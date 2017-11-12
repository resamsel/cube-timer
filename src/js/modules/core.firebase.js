import Module from './core.module';
import {
  encodeKey
} from '../utils/misc';
import Debounce from 'debounce-decorator';
import I18nUtils from '../utils/i18n';

const $script = require("scriptjs")
$script("https://apis.google.com/js/platform.js")

const firebase = require('@firebase/app').default
require('@firebase/auth')
require('@firebase/firestore')

const dao = require('../dao');
const I18n = require('../utils/i18n');
const misc = require('../utils/misc');
const $ = require('jquery');
const NProgress = require('nprogress');

import '../../css/core.firebase.css';

const Keys = {
  user: function(user) {
    return user.uid;
  },
  userInfo: function(user, suffix) {
    var key = '/users/' + Keys.user(user);
    if (suffix) {
      return key + '/' + encodeKey(suffix);
    }
    return key;
  },
  userScores: function(user, puzzle, suffix) {
    var key = '/users/' + Keys.user(user) + '/puzzles/' + encodeKey(puzzle) + '/scores';
    if (suffix) {
      return key + '/' + encodeKey(suffix);
    }
    return key;
  },
  userPuzzles: function(user) {
    return '/users/' + Keys.user(user) + '/puzzles';
  },
  userPuzzle: function(user, puzzle, suffix) {
    var key = '/users/' + Keys.user(user) + '/puzzles/' + encodeKey(puzzle);
    if (suffix) {
      return key + '/' + encodeKey(suffix);
    }
    return key;
  }
};

export default class Firebase extends Module {
  static get id() {
    return 'Firebase';
  }

  constructor(sandbox) {
    super(Firebase.id, sandbox);

    this.listeners = [];
    this.defaultTimeout = 7000;
    this.$signOutButton = undefined;
    this.$body = undefined;
    this.configKeys = [
      'inspectionTime', 'subtext', 'soundAfterInspection', 'hintVisible'
    ];

    this.change = {};
    this.create = {};
    this.remove = {};
  }

  init() {
    this.$body = $('body');
    this.$signOutButton = $('.google-sign-out');

    this.listen(['datasource-changed'], this.handleDatasourceChanged);

    // Initialize Firebase
    firebase.initializeApp(require('../config/firebase'));

    firebase.auth().onAuthStateChanged(this.handleAuthStateChanged.bind(this));

    this.$signOutButton.click(this.handleSignOut.bind(this));
    window.onSignIn = this.handleSignIn.bind(this);

    $('.auth-dropdown').show();
  }

  handleAuthStateChanged(user) {
    super.notify({
      type: 'datasource-changed'
    });
    // NProgress.done();
  }

  handleDatasourceChanged() {
    const user = firebase.auth().currentUser;
    if (user) {
      dao.datasource = this;
      const now = new Date();

      firebase.firestore().doc(Keys.userInfo(user)).set({
        'lastLogin': now.getTime(),
        'lastLoginText': now.toString()
      }, {
        merge: true
      });

      this.$body.addClass('auth-ok');
      $('img.auth-user-image').attr('src', user.photoURL);
      $('.auth-google-name').text(user.displayName);
      $('.auth-google-email').text(user.email);

      this.migrateData();

      const self = this;
      Object.keys(dao.listeners).forEach(function(type) {
        dao.listeners[type].forEach(function(listener) {
          dao.subscribe([type], listener.key, listener.callback, listener.context);
        });
      });
    } else {
      dao.datasource = undefined;

      this.$body.removeClass('auth-ok');
    }
  }

  handleSignIn(googleUser) {
    NProgress.start();
    // We need to register an Observer on Firebase Auth to make sure auth is initialized.
    const self = this;
    const unsubscribe = firebase.auth()
      .onAuthStateChanged(function(firebaseUser) {
        unsubscribe();
        self.firebaseSignIn(googleUser, firebaseUser);
      });
  }

  firebaseSignIn(googleUser, firebaseUser) {
    // Check if we are already signed-in Firebase with the correct user.
    if (!this.isUserEqual(googleUser, firebaseUser)) {
      // Build Firebase credential with the Google ID token.
      var credential = firebase.auth.GoogleAuthProvider
        .credential(googleUser.getAuthResponse().id_token);

      // Sign in with credential from the Google user.
      firebase.auth()
        .signInWithCredential(credential)
        .then(NProgress.done)
        .catch(this.handleAuthError.bind(this));
    } else {
      NProgress.done();
    }
  }

  handleAuthError(error) {
    if (error.code === 'auth/account-exists-with-different-credential') {
      alert('You have already signed up with a different auth provider for that email.');
      // If you are using multiple auth providers on your app you should handle linking
      // the user's accounts here.
    } else {
      console.error(error);
    }
    NProgress.done();
  }

  /**
   * Check that the given Google user is equals to the given Firebase user.
   */
  isUserEqual(googleUser, firebaseUser) {
    if (firebaseUser) {
      const providerData = firebaseUser.providerData;
      for (var i = 0; i < providerData.length; i++) {
        if (providerData[i].providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
          providerData[i].uid === googleUser.getBasicProfile().getId()) {
          // We don't need to reauth the Firebase connection.
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Handle the sign out button press.
   */
  handleSignOut() {
    var googleAuth = gapi.auth2.getAuthInstance();
    googleAuth.signOut().then(function() {
      firebase.auth().signOut();
    });
  }

  listenChanged(key, callback, context) {
    if (!this.change.hasOwnProperty(key)) {
      this.change[key] = {
        listeners: []
      };
    }
    const change = this.change[key];
    change.listeners.push({
      callback,
      context
    });

    if (!change.unsubscribe) {
      const unsubscribe = firebase.firestore().doc(key)
        .onSnapshot(snapshot => {
          console.debug('listenChanged: document %s (read consumed)', key);
          change.snapshot = snapshot;
          change.listeners.forEach(listener => {
            if (snapshot.exists) {
              listener.callback.apply(listener.context, [snapshot.data()]);
            }
          });
        });
      change.unsubscribe = function() {
        unsubscribe();
        change.listeners = change.listeners.filter(listener => {
          return listener.callback !== callback;
        });
      }
    } else if (change.snapshot) {
      change.listeners.forEach(listener => {
        listener.callback.apply(listener.context, [change.snapshot.data()]);
      });
    }

    return change.unsubscribe;
  }

  listenChildAdded(key, callback, context) {
    if (!this.create.hasOwnProperty(key)) {
      this.create[key] = {
        listeners: []
      };
    }
    const create = this.create[key];
    const existing = create.listeners.filter(function(listener) {
      return listener.callback === callback;
    });
    if(existing.length === 0) {
      create.listeners.push({
        callback,
        context
      });
    }

    if (!create.unsubscribe) {
      const collection = firebase.firestore().collection(key);

      const unsubscribe = collection
        .where('whenCreated', '>', new Date().getTime())
        .onSnapshot(snapshot => {
          console.debug('listenChildAdded: Change on collection %s (read consumed)', key);
          snapshot.docChanges.forEach(change => {
            //console.debug('Change on collection %s:', key, change);
            if (change.type === 'added') {
              create.listeners.forEach(listener => {
                listener.callback.apply(listener.context, [change.doc.data()]);
              });
            }
          });
        });
      create.unsubscribe = function() {
        unsubscribe();
        create.unsubscribe = undefined;
        create.snapshot = undefined;

        create.listeners = create.listeners.filter(listener => {
          return listener.callback !== callback;
        });
      }

      collection.get().then(snapshot => {
        console.debug('listenChildAdded: Retrieve collection %s (read consumed)', key);
        create.snapshot = snapshot;
        snapshot.forEach(doc => {
          create.listeners.forEach(listener => {
            listener.callback.apply(listener.context, [doc.data()]);
          });
        });
      });
    } else if (create.snapshot) {
      create.snapshot.forEach(doc => {
        create.listeners.forEach(listener => {
          listener.callback.apply(listener.context, [doc.data()]);
        });
      });
    }

    return create.unsubscribe;
  };

  listenChildRemoved(key, callback, context) {
    console.debug('listenChildRemoved', key);
    if (!this.remove.hasOwnProperty(key)) {
      this.remove[key] = {
        listeners: []
      };
    }
    const remove = this.remove[key];
    const existing = remove.listeners.filter(function(listener) {
      return listener.callback === callback;
    });
    if(existing.length === 0) {
      remove.listeners.push({
        callback,
        context
      });
    }

    if (!remove.unsubscribe) {
      const unsubscribe = firebase.firestore().collection(key)
        .onSnapshot(function(snapshot) {
          console.debug('listenChildRemoved: Change on collection %s (read consumed)', key);
          snapshot.docChanges.forEach(function(change) {
            //console.debug('listenChildRemoved: Change on document %s:', change);
            if (change.type === 'removed') {
              remove.listeners.forEach(listener => {
                listener.callback.apply(listener.context, [change.doc.data()]);
              });
            }
          });
        });
      remove.unsubscribe = function() {
        unsubscribe();
        remove.unsubscribe = undefined;
        remove.snapshot = undefined;

        remove.listeners = remove.listeners.filter(listener => {
          return listener.callback !== callback;
        });
      }
    }

    return remove.unsubscribe;
  };

  subscribe(types, key, callback, context) {
    // console.log(
    //   'subscribe(types=%s, key=%s, callback, context)',
    //   types.join('/'), key, callback
    // );
    // console.log('subscribe: listeners.length=%d', this.listeners.length);
    var existing = this.listeners.filter(function(listener) {
      return listener.callback === callback && listener.key === key;
    });
    if (existing.length > 0) {
      return;
    }

    const self = this;
    const db = firebase.firestore();
    const user = firebase.auth().currentUser;
    let unsubscribe;
    types.forEach(function(type) {
      if (type == 'puzzle-added') {
        unsubscribe = self.listenChildAdded(
          Keys.userPuzzles(user),
          callback,
          context
        );
      } else if (type == 'puzzle-removed') {
        unsubscribe = self.listenChildRemoved(
          Keys.userPuzzles(user),
          callback,
          context
        );
      } else if (type == 'puzzle-changed') {
        unsubscribe = self.listenChanged(
          Keys.userPuzzle(user, key),
          callback,
          context
        );
      } else if (type == 'score-added') {
        unsubscribe = self.listenChildAdded(
          Keys.userScores(user, key),
          callback,
          context
        );
      } else if (type == 'score-removed') {
        unsubscribe = self.listenChildRemoved(
          Keys.userScores(user, key),
          callback,
          context
        );
      } else if (type == 'config-changed') {
        // FIXME: This is an expensive operation, as many listeners on the
        // user exist. All those listeners make a separate read on the
        // database, which drains the quota quickly...
        unsubscribe = self.listenChanged(
          Keys.userInfo(user),
          function(value) {
            return callback.apply(context, [value[key]]);
          }
        );
      }
    });

    this.listeners.push({
      types: types,
      key: key,
      callback: callback,
      context: context,
      unsubscribe: unsubscribe
    });
  }

  unsubscribe(types, callback) {
    // console.log('unsubscribe(types=%s, callback)', types.join('/'));
    // console.log('unsubscribe: listeners.length=%d', this.listeners.length);
    var callbacks = this.listeners.filter(function(listener) {
      return listener.callback === callback;
    });
    if (callbacks.length < 1) {
      return;
    }

    callbacks.forEach(function(listener) {
      console.debug('unsubscribe', listener.unsubscribe);
      listener.unsubscribe();
    });
    this.listeners = this.listeners.filter(function(listener) {
      return listener.callback !== callback;
    });
  }

  storePuzzle(puzzle) {
    var user = firebase.auth().currentUser;

    firebase.firestore()
      .doc('users/' + user.uid + '/puzzles/' + encodeKey(puzzle))
      .set({
        name: puzzle
      })
      .then(function(docRef) {
        console.debug("Document written with ID: ", docRef);
      })
      .catch(function(error) {
        console.error("Error adding document: ", error);
      });
  }

  removePuzzle(puzzle) {
    var user = firebase.auth().currentUser;

    firebase.firestore()
      .doc('users/' + user.uid + '/puzzles/' + encodeKey(puzzle))
      .delete()
      .then(function(docRef) {
        console.debug("Document removed: ", docRef);
      })
      .catch(function(error) {
        console.error("Error removing document: ", error);
      });
  }

  retrieveScores(puzzle, callback) {
    var user = firebase.auth().currentUser;
    firebase.firestore()
      .collection(Keys.userScores(user, puzzle)).get()
      .then(function(snapshot) {
        if (callback) {
          callback(snapshot.docs.map(function(doc) {
            return doc.data();
          }));
        }
      });
  }

  storeScore(puzzle, score, callback) {
    const firestore = firebase.firestore();
    const user = firebase.auth().currentUser;
    const now = new Date();
    const data = {
      user: firestore.doc(Keys.userInfo(user)),
      puzzle: puzzle,
      value: score.value,
      timestamp: score.timestamp || score.id,
      whenCreated: now.getTime(),
      whenCreatedText: now.toString()
    };
    const key = data.timestamp + '-' + data.value;

    firestore
      .doc(Keys.userScores(user, puzzle, key))
      .set(data)
      .then(function(docRef) {
        console.debug("Score added: ", docRef);
      })
      .catch(function(error) {
        console.error("Error adding score: ", error);
      });
  }

  removeScore(puzzle, score, callback) {
    const user = firebase.auth().currentUser;
    const key = score.timestamp + '-' + score.value;

    firebase.firestore()
      .doc(Keys.userScores(user, puzzle, key))
      .delete()
      .then(function(docRef) {
        console.debug("Score removed: ", docRef);

        if (callback) {
          callback();
        }
      })
      .catch(function(error) {
        console.error("Error removing score: ", error);
      });
  }

  resetScores(puzzle, callback) {
    const user = firebase.auth().currentUser;

    firebase.firestore()
      .doc(Keys.userScores(user, puzzle))
      .delete()
      .then(function(docRef) {
        console.debug("Puzzle removed: ", docRef);

        if (callback) {
          callback();
        }
      })
      .catch(function(error) {
        console.error("Error removing puzzle: ", error);
      });
  }

  storeConfig(key, value, callback) {
    const user = firebase.auth().currentUser;
    const doc = {};
    doc[key] = value;

    firebase.firestore()
      .doc(Keys.userInfo(user))
      .set(doc, {
        merge: true
      })
      .then(function(docRef) {
        console.debug("Config stored: ", docRef);

        if (callback) {
          callback();
        }
      })
      .catch(function(error) {
        console.error("Error storing config: ", error);
      });
  };

  @Debounce(1000)
  notifyMigrated() {
    Materialize.toast(
      I18nUtils.translate('firebaseMigrationFinished'),
      this.defaultTimeout
    );
  }

  migrateData() {
    console.debug('migrateData');
    const self = this;
    dao.retrievePuzzles(function(puzzles) {
      puzzles.forEach(function(puzzle) {
        dao.get('scores-' + puzzle.name, function(scores) {
          if (scores && scores.length > 0) {
            // Remove all listeners
            scores.forEach(function(score) {
              if (score.id) {
                score.timestamp = score.id;
              }
              dao.storeScore(puzzle.name, score);
            });
            dao.set('scores-' + puzzle.name, [], self.notifyMigrated);
          }
        });
        dao.storePuzzle(puzzle.name);
      });
      dao.set('puzzles', []);
    });
    this.configKeys.forEach(function(key) {
      dao.get(key, function(value) {
        if (value !== null && typeof(value) !== 'undefined') {
          self.storeConfig(key, value);
        }
      });
    });
  }
}
