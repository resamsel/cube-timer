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

function storeScore(score, callback) {
    retrieveScores(function(scores) {
        scores.push(score);
        storeScores(scores, callback);
    });
}

function storeScores(scores, callback) {
    scores.sort(function(a, b) { return a.id - b.id; });
    return dao.set(
        'scores',
        scores.unique(function(a, b) { return a.id == b.id; }),
        callback
    );
}

function retrieveScores(callback) {
    return dao.get('scores', defaultCallback('scores', [], callback));
}

function removeScore(e) {
    var element = $(this);
    var id = element.data('scoreId');
    retrieveScores(function(scores) {
        for (var i = 0; i < scores.length; i++) {
            if(scores[i].id == id) {
                scores.remove(i);
                storeScores(scores, removeScoreHandler(element, id));
                return;
            }
        }
    });
}

function removeScoreHandler(element, id) {
    return function() {
        $('#id-' + id).fadeOut({
            complete: function() {
                element.remove();
                update();
            }
        });
    };
}
