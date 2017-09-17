// TODO: Move to Core

var defaultDAO = {
	get: function(key, callback) {
		if(callback) {
			callback(null);
		}
	},
	set: function(key, value, callback) {
		if(callback) {
			callback();
		}
	},
	remove: function(key, callback) {
		if(callback) {
			callback();
		}
	}
};
var localDAO = {
	get: function(key, callback) {
		var value = localStorage.getItem(key);
		if(typeof(value) !== 'undefined') {
			value = JSON.parse(value);
		}
		if(callback) {
			callback(value);
		}
	},
	set: function(key, value, callback) {
		localStorage.setItem(key, JSON.stringify(value));
		if(callback) {
			callback();
		}
	},
	remove: function(key, callback) {
		localStorage.removeItem(key);
		if(callback) {
			callback();
		}
	}
};
var chromeDAO = {
	get: function(key, callback) {
		// console.log('chromeDAO.get(%s, callback)', key);
		chrome.storage.local.get(key, function (v) {
			// console.log('get(%s): %o', key, v);
			var value = v[key];
			if(typeof(value) !== 'undefined') {
				value = JSON.parse(v[key]);
			}
			if(callback) {
				callback(value);
			}
		});
	},
	set: function(key, value, callback) {
		var obj = {};
		obj[key] = JSON.stringify(value);
		chrome.storage.local.set(obj, callback);
	},
	remove: function(key, callback) {
		chrome.storage.local.remove(key, callback);
	}
};
var dao = {
	localstore: undefined,
	datasource: undefined
};

if(typeof(Storage) !== 'undefined' && typeof(localStorage) !== 'undefined') {
	console.log('Using local storage');
	dao.localstore = localDAO;
} else if(typeof(chrome) !== "undefined" && typeof(chrome.storage.local) !== 'undefined') {
	console.log('Using chrome storage');
	dao.localstore = chromeDAO;
} else {
	console.log('Using default storage');
	dao.localstore = defaultDAO;
}

dao.get = function(key, callback) {
	dao.localstore.get(key, callback);
}
dao.set = function(key, value, callback) {
	dao.localstore.set(key, value, callback);
}
dao.remove = function(key, callback) {
	dao.localstore.remove(key, callback);
}

dao.defaultCallback = function(key, defaultValue, callback) {
	return function (value) {
		if(value === null || typeof(value) === 'undefined') {
			value = defaultValue;
		}
		if(callback) {
			callback(value);
		}
	};
};

dao.storeConfig = function(key, value, callback) {
	if(dao.datasource) {
		dao.datasource.storeConfig(key, value, callback);
	} else {
		dao.set(key, value, callback);
	}
};

dao.getConfig = function(key, defaultValue, callback) {
	if(dao.datasource) {
		dao.datasource.getConfig(key, defaultValue, callback);
	} else {
		dao.get(key, dao.defaultCallback(key, defaultValue, callback));
	}
};

dao.listeners = {
	'score-added': [],
	'score-removed': []
};
dao.listen = function(types, puzzle, callback) {
	if(dao.datasource) {
		dao.datasource.listen(types, puzzle, callback);
	} else {
		types.forEach(function(type) {
			if(dao.listeners[type]) {
				dao.listeners[type].push(callback);
			}

			// Notify of existing results
			if(type == 'score-added') {
				dao.get('scores-' + puzzle, function(scores) {
					if(scores) {
						scores.forEach(callback);
					}
				});
			}
		});
	}
};
dao.unlisten = function(types, callback) {
	if(dao.datasource) {
		dao.datasource.unlisten(types, callback);
	} else {
		types.forEach(function(type) {
			var listeners = dao.listeners[type];
			if(listeners) {
				dao.listeners[type] = listeners.filter(function(listener) {
					return listener != callback;
				});
			}
		});
	}
};
dao.notify = function(type, score) {
	console.log('dao.notify(type=%s, score)', type, score);
	if(dao.listeners[type]) {
		dao.listeners[type].forEach(function(listener) {
			listener(score);
		});
	}
}

dao.storeScore = function(puzzle, score, callback) {
	console.log('storeScore(puzzle=%s, ...)', puzzle);
	if(dao.datasource) {
		dao.datasource.storeScore(puzzle, score, callback);
	} else {
		score.puzzle = puzzle;
		dao.get('scores-' + puzzle, function(scores) {
			if(!scores) {
				scores = [];
			}
			scores.push(score);
			// Fix data
			scores.forEach(function(score) {
				if(score.id) {
					score.timestamp = score.id;
					delete score['id'];
				}
			});
			scores = scores.unique(function(a, b) { return a.timestamp == b.timestamp; });
			dao.set('scores-' + puzzle, scores, callback);
			dao.notify('score-added', score);
		});
	}
};

dao.removeScore = function(game, score, callback) {
	console.log('removeScore(game=%s, score, callback)', game);
	if(dao.datasource) {
		dao.datasource.removeScore(game, score, callback);
	} else {
		dao.get('scores-' + game, function(scores) {
			scores = scores.filter(function(s) {
				return s.timestamp != score.timestamp;
			});
			dao.set('scores-' + game, scores, callback);
		});
	}
};

dao.resetScores = function(game, callback) {
	if(dao.datasource) {
		dao.datasource.resetScores(game, callback);
	} else {
		dao.get('scores-' + game, function(scores) {
			console.log('dao.get(scores)', scores);
			dao.set('scores-' + game, [], function() {
				console.log('dao.set(scores, [])');
				scores.forEach(function(score) {
					dao.notify('score-removed', score);
				});
				if(callback) {
					callback();
				}
			})
		});
	}
}

dao.retrieveActiveGame = function(callback) {
	dao.get(
		'activeGame',
		dao.defaultCallback('activeGame', '3x3x3', callback)
	);
};

dao.storeActiveGame = function(game, callback) {
	console.log('storeActiveGame(game=%s, callback)', game);
	dao.set('activeGame', game, callback);
};

dao.retrieveGames = function(callback) {
	dao.get(
		'games',
		dao.defaultCallback(
			'games',
			[
				'2x2x2', '3x3x3', '4x4x4', '5x5x5',
				'1x3x3', '2x3x3', '3x3x4', '5x3x3', '7x3x3', '2x2x4'
			],
			callback
		)
	);
};

module.exports = dao;