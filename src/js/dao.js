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
	console.debug('Using local storage');
	dao.localstore = localDAO;
} else if(typeof(chrome) !== "undefined" && typeof(chrome.storage.local) !== 'undefined') {
	console.debug('Using chrome storage');
	dao.localstore = chromeDAO;
} else {
	console.debug('Using default storage');
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

dao.listeners = {
	'puzzle-added': [],
	'puzzle-removed': [],
	'score-added': [],
	'score-removed': [],
	'config-changed': []
};
dao.listen = function(types, key, callback) {
	if(dao.datasource) {
		dao.datasource.listen(types, key, callback);
	} else {
		types.forEach(function(type) {
			if(dao.listeners[type]) {
				dao.listeners[type].push({
					key: key,
					callback: callback
				});
			}

			// Notify of existing puzzles
			if(type == 'puzzle-added') {
				dao.get('puzzles', function(puzzles) {
					puzzles.forEach(callback);
				});
			}

			// Notify of existing results
			if(type == 'score-added') {
				dao.get('scores-' + key, function(scores) {
					if(scores) {
						scores.forEach(callback);
					}
				});
			}

			if(type == 'config-changed') {
				dao.get(key, callback);
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
					return listener.callback != callback;
				});
			}
		});
	}
};
dao.notify = function(type, score) {
	if(dao.listeners[type]) {
		dao.listeners[type].forEach(function(listener) {
			listener.callback(score);
		});
	}
}

dao.retrieveScores = function(puzzle, callback) {
	if(dao.datasource) {
		dao.datasource.retrieveScores(puzzle, callback);
	} else {
		dao.get('scores-'+puzzle, callback);
	}
};

dao.storeScore = function(puzzle, score, callback) {
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

dao.removeScore = function(puzzle, score, callback) {
	if(dao.datasource) {
		dao.datasource.removeScore(puzzle, score, callback);
	} else {
		dao.get('scores-' + puzzle, function(scores) {
			scores = scores.filter(function(s) {
				return s.timestamp != score.timestamp;
			});
			dao.set('scores-' + puzzle, scores, callback);
		});
	}
};

dao.resetScores = function(puzzle, callback) {
	if(dao.datasource) {
		dao.datasource.resetScores(puzzle, callback);
	} else {
		dao.get('scores-' + puzzle, function(scores) {
			dao.set('scores-' + puzzle, [], function() {
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

dao.retrievePuzzles = function(callback) {
	dao.get(
		'puzzles',
		dao.defaultCallback('puzzles', ['3x3x3'], callback)
	);
};

dao.storePuzzle = function(puzzle) {
	if(dao.datasource) {
		dao.datasource.storePuzzle(puzzle);
	} else {
		dao.retrievePuzzles(function(puzzles) {
			if(puzzles.indexOf(puzzle) < 0) {
				puzzles.push(puzzle);
				dao.set('puzzles', puzzles, function() {
					dao.notify('puzzle-added', {name: puzzle});
				});
			}
		});
	}
}

dao.removePuzzle = function(puzzle) {
	if(dao.datasource) {
		dao.datasource.removePuzzle(puzzle);
	} else {
		dao.retrievePuzzles(function(puzzles) {
			if(puzzles.indexOf(puzzle) >= 0) {
				puzzles = puzzles.filter(function(p) {
					return p.name !== puzzle;
				});
				dao.set('puzzles', puzzles, function() {
					dao.notify('puzzle-removed', {name: puzzle});
				});
			}
		});
	}
}

module.exports = dao;