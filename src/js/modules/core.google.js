var core = require('../core.js');
var dao = require('../dao.js');
var I18n = require('../utils/i18n.js');
var misc = require('../utils/misc.js');

core.register(
	'Google',
	function(sandbox) {
		var module = {};
        var defaultTimeout = 7000;

		module.init = function() {
			sandbox.listen(
				['database-available'],
				module.handleDatabaseAvailable,
				module
			);

			// Initialize Firebase
			firebase.initializeApp(firebaseConfig);

			firebase.auth().onAuthStateChanged(function(user) {
				sandbox.notify({type: 'database-available'});
			});
		};

		module.handleDatabaseAvailable = function() {
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
				module.migrateData();
			} else {
				dao.datasource = undefined;
			}
		};

		module.listen = function(types, key, callback) {
			var user = firebase.auth().currentUser;
			types.forEach(function(type) {
				if(type == 'score-added') {
					firebase.database()
						.ref('/users/'+user.uid+'/puzzles/'+key+'/scores')
						.on('child_added', function(snapshot) {
							callback(snapshot.val());
						});
				} else if(type == 'score-removed') {
					firebase.database()
						.ref('/users/'+user.uid+'/puzzles/'+key+'/scores')
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

		module.storeScore = function(puzzle, score, callback) {
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
			updates['/users/'+user.uid+'/puzzles/'+puzzle+'/scores/'+key] = data;

			firebase.database().ref().update(updates);
		};

		module.removeScore = function(puzzle, score, callback) {
			console.log('firebase.removeScore(puzzle=%s, score=%s, callback)', puzzle, JSON.stringify(score));
			var user = firebase.auth().currentUser;
			var key = score.timestamp+'-'+score.value;
			var updates = {};

			updates['/puzzles/'+puzzle+'/scores/'+user.uid+'-'+key] = null;
			updates['/users/'+user.uid+'/puzzles/'+puzzle+'/scores/'+key] = null;
			console.log('Updates: %s', JSON.stringify(updates));

			firebase.database().ref().update(updates);
			
			if(callback) {
				callback();
			}
		};

		module.resetScores = function(puzzle, callback) {
			var user = firebase.auth().currentUser;

			firebase.database()
				.ref('/users/'+user.uid+'/puzzles/'+puzzle+'/scores')
				.once('value', function(snapshot) {
					var updates = {};

					updates['/users/'+user.uid+'/puzzles/'+puzzle+'/scores'] = [];
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
			console.log('storeConfig(key=%s, value=%s, callback)', key, value);
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
							console.log('game', game, scores);
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
