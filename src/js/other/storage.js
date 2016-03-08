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

function defaultCallback(key, defaultValue, callback) {
    return function (value) {
        if(value === null || typeof(value) === 'undefined') {
            value = defaultValue;
        }
        if(callback) {
            callback(value);
        }
    };
}

function storeConfig(key, value, callback) {
    dao.set(key, value, callback);
}

function getConfig(key, defaultValue, callback) {
    return dao.get(key, defaultCallback(key, defaultValue, callback));
}

function storeScore(game, score, callback) {
    retrieveScores(game, function(scores) {
        scores.push(score);
        storeScores(game, scores, callback);
    });
}

function storeScores(game, scores, callback) {
    console.log('storeScores(game=%s, scores=%s, callback)', game, scores);
    scores.sort(function(a, b) { return a.id - b.id; });
    dao.set(
        'scores-' + game,
        scores.unique(function(a, b) { return a.id == b.id; }),
        callback
    );
}

function retrieveScores(game, callback) {
    console.log('retrieveScores(game=%s, callback)', game);
    dao.get(
        'scores-' + game,
        defaultCallback('scores-' + game, [], callback)
    );
}

function removeScore(game, resultId, callback) {
    console.log('removeScore(game=%s, resultId=%s, callback)', game, resultId);
    retrieveScores(game, function(scores) {
        for (var i = 0; i < scores.length; i++) {
            if(scores[i].id == resultId) {
                scores.remove(i);
                storeScores(game, scores, callback);
                return;
            }
        }
    });
}

function retrieveActiveGame(callback) {
    dao.get(
        'activeGame',
        defaultCallback('activeGame', '3x3x3', callback)
    );
}

function storeActiveGame(game, callback) {
    console.log('storeActiveGame(game=%s, callback)', game);
    config.activeGame = game;
    dao.set('activeGame', game, callback);
}

function retrieveGames(callback) {
    dao.get(
        'games',
        defaultCallback(
            'games',
            [
                '2x2x2', '3x3x3', '4x4x4', '5x5x5',
                '1x3x3', '2x3x3', '3x3x4', '5x3x3', '7x3x3', '2x2x4'
            ],
            callback
        )
    );
}