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
var dao;
if(typeof(Storage) !== 'undefined' && typeof(localStorage) !== 'undefined') {
    console.log('Using local storage');
    dao = localDAO;
} else if(typeof(chrome) !== "undefined" && typeof(chrome.storage.local) !== 'undefined') {
    console.log('Using chrome storage');
    dao = chromeDAO;
} else {
    console.log('Using default storage');
    dao = defaultDAO;
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
    dao.set(key, value, callback);
};

dao.getConfig = function(key, defaultValue, callback) {
    return dao.get(key, dao.defaultCallback(key, defaultValue, callback));
};

dao.storeScore = function(game, score, callback) {
    dao.retrieveScores(game, function(scores) {
        scores.push(score);
        dao.storeScores(game, scores, callback);
    });
};

dao.storeScores = function(game, scores, callback) {
    console.log('storeScores(game=%s, scores=%s, callback)', game, scores);
    scores.sort(function(a, b) { return a.id - b.id; });
    dao.set(
        'scores-' + game,
        scores.unique(function(a, b) { return a.id == b.id; }),
        callback
    );
};

dao.retrieveScores = function(game, callback) {
    console.log('retrieveScores(game=%s, callback)', game);
    dao.get(
        'scores-' + game,
        dao.defaultCallback('scores-' + game, [], callback)
    );
};

dao.removeScore = function(game, resultId, callback) {
    console.log('removeScore(game=%s, resultId=%s, callback)', game, resultId);
    dao.retrieveScores(game, function(scores) {
        for (var i = 0; i < scores.length; i++) {
            if(scores[i].id == resultId) {
                scores.remove(i);
                dao.storeScores(game, scores, callback);
                return;
            }
        }
    });
};

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