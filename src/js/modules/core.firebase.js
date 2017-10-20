const $script = require("scriptjs")
$script("https://apis.google.com/js/platform.js")

const firebase = require('@firebase/app').default
require('@firebase/auth')
require('@firebase/firestore')

const core = require('../core.js');
const dao = require('../dao.js');
const I18n = require('../utils/i18n.js');
const misc = require('../utils/misc.js');
const $ = require('jquery');
const NProgress = require('nprogress');

const firebaseConfig = require('../firebaseConfig.js')

const Keys = {
  user: function(user) {
    return user.uid;
  },
  userInfo: function(user, suffix) {
    var key = '/users/' + Keys.user(user);
    if (suffix) {
      return key + '/' + misc.encodeKey(suffix);
    }
    return key;
  },
  userScores: function(user, puzzle, suffix) {
    var key = '/users/' + Keys.user(user) + '/puzzles/' + misc.encodeKey(puzzle) + '/scores';
    if (suffix) {
      return key + '/' + misc.encodeKey(suffix);
    }
    return key;
  },
  userPuzzles: function(user) {
    return '/users/' + Keys.user(user) + '/puzzles';
  },
  userPuzzle: function(user, puzzle, suffix) {
    var key = '/users/' + Keys.user(user) + '/puzzles/' + misc.encodeKey(puzzle);
    if (suffix) {
      return key + '/' + misc.encodeKey(suffix);
    }
    return key;
  }
};

core.register(
  'Firebase',
  function(sandbox) {
    var module = {};
    var listeners = [];
    var defaultTimeout = 7000;
    var $signOutButton = $('.google-sign-out');
    var $body = $('body');
    var configKeys = [
      'inspectionTime', 'subtext', 'soundAfterInspection', 'hintVisible'
    ];

    module.init = function() {
      sandbox.listen(
        ['datasource-changed'],
        module.handleDatasourceChanged,
        module
      );

      // Initialize Firebase
      firebase.initializeApp(firebaseConfig);

      firebase.auth().onAuthStateChanged(module.handleAuthStateChanged);

      $signOutButton.click(module.handleSignOut);
      window.onSignIn = module.handleSignIn;
    };

    module.handleAuthStateChanged = function(user) {
      sandbox.notify({
        type: 'datasource-changed'
      });
      // NProgress.done();
    };

    module.handleDatasourceChanged = function() {
      var user = firebase.auth().currentUser;
      if (user) {
        dao.datasource = module;
        var updates = {};
        var now = new Date();

        firebase.firestore().doc(Keys.userInfo(user)).set({
          'lastLogin': now.getTime(),
          'lastLoginText': now.toString()
        }, {
          merge: true
        });

        $body.addClass('auth-ok');
        $('img.auth-user-image').attr('src', user.photoURL);
        $('.auth-google-name').text(user.displayName);
        $('.auth-google-email').text(user.email);

        module.migrateData();

        Object.keys(dao.listeners).forEach(function(type) {
          dao.listeners[type].forEach(function(listener) {
            module.listen([type], listener.key, listener.callback);
          });
        });
      } else {
        dao.datasource = undefined;

        $body.removeClass('auth-ok');
      }
    };

    module.handleSignIn = function(googleUser) {
      NProgress.start();
      // We need to register an Observer on Firebase Auth to make sure auth is initialized.
      var unsubscribe = firebase.auth()
        .onAuthStateChanged(function(firebaseUser) {
          unsubscribe();
          module.firebaseSignIn(googleUser, firebaseUser);
        });
    };

    module.firebaseSignIn = function(googleUser, firebaseUser) {
      // Check if we are already signed-in Firebase with the correct user.
      if (!module.isUserEqual(googleUser, firebaseUser)) {
        // Build Firebase credential with the Google ID token.
        var credential = firebase.auth.GoogleAuthProvider
          .credential(googleUser.getAuthResponse().id_token);

        // Sign in with credential from the Google user.
        firebase.auth()
          .signInWithCredential(credential)
          .then(NProgress.done)
          .catch(module.handleAuthError);
      } else {
        NProgress.done();
      }
    };

    module.handleAuthError = function(error) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        alert('You have already signed up with a different auth provider for that email.');
        // If you are using multiple auth providers on your app you should handle linking
        // the user's accounts here.
      } else {
        console.error(error);
      }
      NProgress.done();
    };

    /**
     * Check that the given Google user is equals to the given Firebase user.
     */
    module.isUserEqual = function(googleUser, firebaseUser) {
      if (firebaseUser) {
        var providerData = firebaseUser.providerData;
        for (var i = 0; i < providerData.length; i++) {
          if (providerData[i].providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
            providerData[i].uid === googleUser.getBasicProfile().getId()) {
            // We don't need to reauth the Firebase connection.
            return true;
          }
        }
      }
      return false;
    };

    /**
     * Handle the sign out button press.
     */
    module.handleSignOut = function() {
      var googleAuth = gapi.auth2.getAuthInstance();
      googleAuth.signOut().then(function() {
        firebase.auth().signOut();
      });
    };

    const change = {};
    module.listenChanged = function(key, callback) {
      console.debug('listenChanged: document %s', key);

      if(!change.hasOwnProperty(key)) {
        change[key] = {
          listeners: []
        };
      }
      change[key].listeners.push(callback);

      if(!change[key].unsubscribe) {
        change[key].unsubscribe = firebase.firestore().doc(key)
          .onSnapshot(snapshot => {
            console.debug('listenChanged: document %s (read consumed)', key);
            change[key].snapshot = snapshot;
            change[key].listeners.forEach(listener => listener(snapshot.data()));
          });
      } else if (change[key].snapshot) {
        change[key].listeners.forEach(listener => listener(change[key].snapshot.data()));
      }

      return change[key].unsubscribe;
    };

    const create = {};
    module.listenChildAdded = function(key, callback) {
      if(!create.hasOwnProperty(key)) {
        create[key] = {
          listeners: []
        };
      }
      create[key].listeners.push(callback);

      if(!create[key].unsubscribe) {
        const collection = firebase.firestore().collection(key);

        create[key].unsubscribe = collection
          .where('whenCreated', '>', new Date().getTime())
          .onSnapshot(snapshot => {
            console.debug('listenChildAdded: Change on collection %s (read consumed)', key);
            snapshot.docChanges.forEach(change => {
              console.debug('Change on collection %s:', key, change);
              if (change.type === 'added') {
                create[key].listeners.forEach(listener => {
                  listener(change.doc.data());
                });
              }
            });
          });

        collection.get().then(snapshot => {
          console.debug('listenChildAdded: Retrieve collection %s (read consumed)', key);
          create[key].snapshot = snapshot;
          snapshot.forEach(doc => {
            create[key].listeners.forEach(listener => {
              listener(doc.data());
            });
          });
        });
      } else if (create[key].snapshot) {
        snapshot.forEach(doc => {
          create[key].listeners.forEach(listener => listener(doc.data()));
        });
      }

      return create[key].unsubscribe;
    };

    const remove = {};
    module.listenChildRemoved = function(key, callback) {
      if(!remove.hasOwnProperty(key)) {
        remove[key] = {
          listeners: []
        };
      }
      remove[key].listeners.push(callback);

      if(!remove[key].unsubscribe) {
        remove[key].unsubscribe = firebase.firestore().collection(key)
          .onSnapshot(function(snapshot) {
            console.debug('listenChildRemoved: Change on collection %s (read consumed)', key);
            snapshot.docChanges.forEach(function(change) {
              console.debug('listenChildRemoved: Change on document %s:', change);
              if (change.type === 'removed') {
                remove[key].listeners.forEach(listener => {
                  listener(change.doc.data());
                });
              }
            });
          });
      }

      return remove[key].unsubscribe;
    };

    module.listen = function(types, key, callback) {
      var existing = listeners.filter(function(listener) {
        return listener.callback === callback && listener.key === key;
      });
      if (existing.length > 0) {
        return;
      }

      const db = firebase.firestore();
      const user = firebase.auth().currentUser;
      let unsubscribe;
      types.forEach(function(type) {
        if (type == 'puzzle-added') {
          unsubscribe = module.listenChildAdded(
            Keys.userPuzzles(user),
            callback
          );
        } else if (type == 'puzzle-removed') {
          unsubscribe = module.listenChildRemoved(
            Keys.userPuzzles(user),
            callback
          );
        } else if (type == 'puzzle-changed') {
          unsubscribe = module.listenChanged(
            Keys.userPuzzle(user, key),
            callback
          );
        } else if (type == 'score-added') {
          unsubscribe = module.listenChildAdded(
            Keys.userScores(user, key),
            callback
          );
        } else if (type == 'score-removed') {
          unsubscribe = module.listenChildRemoved(
            Keys.userScores(user, key),
            callback
          );
        } else if (type == 'config-changed') {
          // FIXME: This is an expensive operation, as many listeners on the
          // user exist. All those listeners make a separate read on the
          // database, which drains the quota quickly...
          unsubscribe = module.listenChanged(
            Keys.userInfo(user),
            function(value) {
              return callback(value[key]);
            }
          );
        }
      });

      listeners.push({
        types: types,
        key: key,
        callback: callback,
        unsubscribe: unsubscribe
      });
    };

    module.unlisten = function(types, callback) {
      var callbacks = listeners.filter(function(listener) {
        return listener.callback === callback;
      });
      if (callbacks.length < 1) {
        return;
      }

      callbacks.forEach(function(listener) {
        listener.unsubscribe();
      });
      listeners = listeners.filter(function(listener) {
        return listener.callback !== callback;
      });
    };

    module.storePuzzle = function(puzzle) {
      var user = firebase.auth().currentUser;

      firebase.firestore()
        .doc('users/' + user.uid + '/puzzles/' + misc.encodeKey(puzzle))
        .set({
          name: puzzle
        })
        .then(function(docRef) {
          console.debug("Document written with ID: ", docRef);
        })
        .catch(function(error) {
          console.error("Error adding document: ", error);
        });
    };

    module.removePuzzle = function(puzzle) {
      var user = firebase.auth().currentUser;

      firebase.firestore()
        .doc('users/' + user.uid + '/puzzles/' + misc.encodeKey(puzzle))
        .delete()
        .then(function(docRef) {
          console.debug("Document removed: ", docRef);
        })
        .catch(function(error) {
          console.error("Error removing document: ", error);
        });
    };

    module.retrieveScores = function(puzzle, callback) {
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
    };

    module.storeScore = function(puzzle, score, callback) {
      var firestore = firebase.firestore();
      var user = firebase.auth().currentUser;
      var now = new Date();
      var data = {
        user: firestore.doc(Keys.userInfo(user)),
        puzzle: puzzle,
        value: score.value,
        timestamp: score.timestamp || score.id,
        whenCreated: now.getTime(),
        whenCreatedText: now.toString()
      };
      var key = data.timestamp + '-' + data.value;

      firestore
        .doc(Keys.userScores(user, puzzle, key))
        .set(data)
        .then(function(docRef) {
          console.debug("Score added: ", docRef);
        })
        .catch(function(error) {
          console.error("Error adding score: ", error);
        });
    };

    module.removeScore = function(puzzle, score, callback) {
      var user = firebase.auth().currentUser;
      var key = score.timestamp + '-' + score.value;

      firebase.firestore()
        .doc(Keys.userScores(user, puzzle, key))
        .delete()
        .then(function(docRef) {
          console.debug("Score removed: ", docRef);
        })
        .catch(function(error) {
          console.error("Error removing score: ", error);
        });

      if (callback) {
        callback();
      }
    };

    module.resetScores = function(puzzle, callback) {
      var user = firebase.auth().currentUser;

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
    };

    module.storeConfig = function(key, value, callback) {
      var user = firebase.auth().currentUser;
      var doc = {};
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

    module.notifyMigrated = misc.debounce(function() {
      Materialize.toast(
        I18n.translate('firebaseMigrationFinished'),
        defaultTimeout
      );
    }, 1000);

    module.migrateData = function() {
      dao.retrievePuzzles(function(puzzles) {
        puzzles.forEach(function(puzzle) {
          dao.get('scores-' + puzzle, function(scores) {
            if (scores && scores.length > 0) {
              // Remove all listeners
              scores.forEach(function(score) {
                if (score.id) {
                  score.timestamp = score.id;
                }
                dao.storeScore(puzzle, score);
              });
              dao.set(
                'scores-' + puzzle, [],
                module.notifyMigrated
              );
            }
          });
          dao.storePuzzle(puzzle);
        });
        dao.set('puzzles', []);
      });
      configKeys.forEach(function(key) {
        dao.get(key, function(value) {
          if (value !== null && typeof(value) !== 'undefined') {
            module.storeConfig(key, value);
          }
        });
      });
    };

    return module;
  }
);
