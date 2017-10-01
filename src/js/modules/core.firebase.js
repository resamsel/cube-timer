var core = require('../core.js');
var dao = require('../dao.js');
var I18n = require('../utils/i18n.js');
var misc = require('../utils/misc.js');

var Keys = {
	user: function(user) {
		return user.email.replace(/\./g, ',');
	},
	userInfo: function(user, suffix) {
		var key = '/users/'+Keys.user(user)+'/info';
		if(suffix) {
			return key+'/'+suffix;
		}
		return key;
	},
	userScores: function(user, puzzle, suffix) {
		var key = '/user-scores/'+Keys.user(user)+'/'+puzzle;
		if(suffix) {
			return key+'/'+suffix;
		}
		return key;
	},
	userPuzzles: function(user, puzzle) {
		return '/users/'+Keys.user(user)+'/puzzles/'+puzzle+'/name';
	},
	puzzle: function(puzzle, key) {
		return '/puzzles/'+puzzle+'/'+key;
	},
	puzzleScores: function(puzzle, user, key) {
		return '/puzzle-scores/'+puzzle+'/'+key+'-'+Keys.user(user);
	},
	config: function(user, key) {
		return '/configs/'+Keys.user(user)+'/'+key;
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
			sandbox.notify({type: 'datasource-changed'});
			NProgress.done();
		};

		module.handleDatasourceChanged = function() {
			var user = firebase.auth().currentUser;
			if(user) {
				dao.datasource = module;
				var updates = {};
				
				updates[Keys.userInfo(user, 'name')] = user.displayName;
				updates[Keys.userInfo(user, 'email')] = user.email;
				updates[Keys.userInfo(user, 'photo_url')] = user.photoURL;
				updates[Keys.userInfo(user, 'last_login')] = new Date().getTime();
				updates[Keys.userInfo(user, 'last_login_text')] = new Date().toString();

				firebase.database().ref().update(updates);

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

		module.wrap = function(callback) {
			return function(snapshot) {
				return callback(snapshot.val());
			};
		};

		module.listen = function(types, key, callback) {
			var existing = listeners.filter(function(listener) {
				return listener.callback === callback;
			});
			if(existing.length > 0) {
				return;
			}

			var wrapped = module.wrap(callback);
			listeners.push({
				types: types,
				key: key,
				callback: callback,
				wrapped: wrapped
			});

			var user = firebase.auth().currentUser;
			var db = firebase.database();
			var ref;
			types.forEach(function(type) {
				if(type == 'score-added') {
					db.ref(Keys.userScores(user, key))
						.on('child_added', wrapped);
				} else if(type == 'score-removed') {
					db.ref(Keys.userScores(user, key))
						.on('child_removed', wrapped);
				} else if(type == 'config-changed') {
					db.ref(Keys.config(user, key))
						.on('value', wrapped);
				}
			});
		};

		module.unlisten = function(types, callback) {
			var ref = firebase.database().ref('/');
			var callbacks = listeners.filter(function(listener) {
				return listener.callback === callback;
			}).map(function(listener) {
				return listener.wrapped;
			});
			if(callbacks.length < 1) {
				return;
			}

			types.forEach(function(type) {
				callbacks.forEach(function(wrapped) {
					if(type == 'score-added') {
						ref.off('child_added', wrapped);
					} else if(type == 'score-removed') {
						ref.off('child_removed', wrapped);
					} else if(type == 'config-changed') {
						ref.off('value', wrapped);
					}
				});
				listeners = listeners.filter(function(listener) {
					return listener.callback !== callback;
				});
			});
		};

		module.retrieveScores = function(puzzle, callback) {
			var user = firebase.auth().currentUser;
			var ref = firebase.database()
				.ref(Keys.userScores(user, puzzle))
				.once('value', function(snapshot) {
					if(callback) {
						callback(snapshot.val());
					}
				});
		};

		module.storeScore = function(puzzle, score, callback) {
			var database = firebase.database();
			var user = firebase.auth().currentUser;
			var key = score.timestamp+'-'+score.value;
			var data = {
				author: user.displayName,
				authorPic: user.photoURL,
				uid: user.uid,
				puzzle: puzzle,
				value: score.value,
				timestamp: score.timestamp || score.id
			};
			var now = new Date();
			var updates = {};

			// Write the new score's data simultaneously in the score list and the user's score list.
			updates[Keys.puzzle(puzzle, 'name')] = puzzle;
			updates[Keys.puzzleScores(puzzle, user, key)] = data;
			updates[Keys.userScores(user, puzzle, key)] = data;
			updates[Keys.userPuzzles(user, puzzle)] = true;
			updates[Keys.userInfo(user, 'last_active')] = now.getTime();
			updates[Keys.userInfo(user, 'last_active_text')] = now.toString();

			database.ref().update(updates);
		};

		module.removeScore = function(puzzle, score, callback) {
			var user = firebase.auth().currentUser;
			var key = score.timestamp+'-'+score.value;
			var now = new Date();
			var updates = {};

			updates[Keys.puzzleScores(puzzle, user, key)] = null;
			updates[Keys.userScores(user, puzzle, key)] = null;
			updates[Keys.userInfo(user, 'last_active')] = now.getTime();
			updates[Keys.userInfo(user, 'last_active_text')] = now.toString();

			firebase.database().ref().update(updates);
			
			if(callback) {
				callback();
			}
		};

		module.resetScores = function(puzzle, callback) {
			var user = firebase.auth().currentUser;

			firebase.database()
				.ref(Keys.userScores(user, puzzle))
				.once('value', function(snapshot) {
					var updates = {};

					updates[Keys.userScores(user, puzzle)] = [];
					snapshot.forEach(function(score) {
						updates[Keys.puzzleScores(puzzle, user, score.timestamp+'-'+score.value)] = null;
					});

					firebase.database().ref().update(updates);

					if(callback) {
						callback();
					}
				});

			var now = new Date();
			var updates = {};
			updates[Keys.userInfo(user, 'last_active')] = now.getTime();
			updates[Keys.userInfo(user, 'last_active_text')] = now.toString();
			firebase.database().ref().update(updates);
		};

		module.storeConfig = function(key, value, callback) {
			var user = firebase.auth().currentUser;

			firebase.database().ref(Keys.config(user, key)).set(value);

			if(callback) {
				callback();
			}
		};

		module.notifyMigrated = misc.debounce(function() {
			Materialize.toast(
				I18n.translate('firebaseMigrationFinished'),
				defaultTimeout
			);
		}, 1000);

		module.migrateData = function() {
			dao.retrieveGames(function(games) {
				games.forEach(function(game) {
					dao.get('scores-' + game, function(scores) {
						if(scores && scores.length > 0) {
							// Remove all listeners
							firebase.database().ref('/').off();
							scores.forEach(function(score) {
								if(score.id) {
									score.timestamp = score.id;
								}
								dao.storeScore(game, score);
							});
							dao.set(
								'scores-' + game,
								[],
								module.notifyMigrated
							);
						}
					});
				});
			});
			configKeys.forEach(function(key) {
				dao.get(key, function(value) {
					if(value !== null && typeof(value) !== 'undefined') {
						module.storeConfig(key, value);
					}
				});
			});
		};

		return module;
	}
);
