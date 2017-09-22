var core = require('../core.js');
var dao = require('../dao.js');
var I18n = require('../utils/i18n.js');
var misc = require('../utils/misc.js');

core.register(
	'Google',
	function(sandbox) {
		var module = {};
        var defaultTimeout = 7000;
		var $signOutButton = $('.google-sign-out');
		var $body = $('body');

		module.init = function() {
			sandbox.listen(
				['datasource-changed'],
				module.handleDatasourceChanged,
				module
			);

			// Initialize Firebase
			firebase.initializeApp(firebaseConfig);

			firebase.auth().onAuthStateChanged(function(user) {
				sandbox.notify({type: 'datasource-changed'});
			});

			$signOutButton.click(module.handleSignOut);
		};

		module.handleDatasourceChanged = function() {
			var user = firebase.auth().currentUser;
			if(user) {
				dao.datasource = module;
				firebase.database()
					.ref('/users/'+user.uid+'/info')
					.set({
						name: user.displayName,
						email: user.email,
						photo_url : user.photoURL
					});
				$body.addClass('auth-ok');
				$('img.auth-user-image').attr('src', user.photoURL);
				$('.auth-google-name').text(user.displayName);
				$('.auth-google-email').text(user.email);

				module.migrateData();
			} else {
				dao.datasource = undefined;

				$body.removeClass('auth-ok');
			}
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

		module.listen = function(types, key, callback) {
			var user = firebase.auth().currentUser;
			types.forEach(function(type) {
				if(type == 'score-added') {
					firebase.database()
						.ref('/users/'+user.uid+'/scores/'+key)
						.on('child_added', function(snapshot) {
							callback(snapshot.val());
						});
				} else if(type == 'score-removed') {
					firebase.database()
						.ref('/users/'+user.uid+'/scores/'+key)
						.on('child_removed', function(snapshot) {
							callback(snapshot.val());
						});
				} else if(type == 'config-changed') {
					firebase.database()
						.ref('/users/'+user.uid+'/config/'+key)
						.on('value', function(snapshot) {
							callback(snapshot.val());
						});
				}
			});
		};

		module.unlisten = function(types, callback) {
			types.forEach(function(type) {
				if(type == 'score-added') {
					firebase.database().ref('/').off('child_added', callback);
				} else if(type == 'score-removed') {
					firebase.database().ref('/').off('child_removed', callback);
				} else if(type == 'config-changed') {
					firebase.database().ref('/').off('value', callback);
				}
			});
		};

		module.retrieveScores = function(puzzle, callback) {
			var user = firebase.auth().currentUser;
			var ref = firebase.database()
				.ref('/users/'+user.uid+'/scores/'+puzzle)
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
			var updates = {};

			// Write the new score's data simultaneously in the score list and the user's score list.
			updates['/puzzles/'+puzzle+'/scores/'+user.uid+'-'+key] = data;
			updates['/users/'+user.uid+'/scores/'+puzzle+'/'+key] = data;
			updates['/users/'+user.uid+'/puzzles/'+puzzle+'/name'] = puzzle;

			database.ref().update(updates);
		};

		module.removeScore = function(puzzle, score, callback) {
			var user = firebase.auth().currentUser;
			var key = score.timestamp+'-'+score.value;
			var updates = {};

			updates['/puzzles/'+puzzle+'/scores/'+user.uid+'-'+key] = null;
			updates['/users/'+user.uid+'/scores/'+puzzle+'/'+key] = null;

			firebase.database().ref().update(updates);
			
			if(callback) {
				callback();
			}
		};

		module.resetScores = function(puzzle, callback) {
			var user = firebase.auth().currentUser;

			firebase.database()
				.ref('/users/'+user.uid+'/scores/'+puzzle)
				.once('value', function(snapshot) {
					var updates = {};

					updates['/users/'+user.uid+'/scores/'+puzzle] = [];
					snapshot.forEach(function(score) {
						updates['/puzzles/'+puzzle+'/scores/'+user.uid+'-'+score.timestamp+'-'+score.value] = null;
					});

					firebase.database().ref().update(updates);

					if(callback) {
						callback();
					}
				});
		};

		module.storeConfig = function(key, value, callback) {
			var user = firebase.auth().currentUser;

			firebase.database()
				.ref('/users/'+user.uid+'/config/'+key)
				.set(value);

			if(callback) {
				callback();
			}
		};

		module.getConfig = function(key, defaultValue, callback) {
			var user = firebase.auth().currentUser;

			firebase.database()
				.ref('/users/'+user.uid+'/config/'+key)
				.once('value', function(snapshot) {
					callback(snapshot.val());
				});
		};

		module.notifyMigrated = misc.debounce(function() {
			Materialize.toast(
				I18n.translate('firebase_migration_finished'),
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
		};

		return module;
	}
);
