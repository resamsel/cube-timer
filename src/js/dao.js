// TODO: Move to Sandbox

var defaultDAO = {
  get: function(key, callback, context) {
    return new Promise(function(resolve, reject) {
      resolve(null);
    });
  },
  set: function(key, value, callback, context) {
    return new Promise(function(resolve, reject) {
      resolve(value);
    });
  },
  remove: function(key, callback, context) {
    return new Promise(function(resolve, reject) {
      resolve();
    });
  }
};
var localDAO = {
  get: function(key) {
    return new Promise(function(resolve, reject) {
      var value = localStorage.getItem(key);
      if (typeof(value) !== 'undefined') {
        value = JSON.parse(value);
      }
      resolve(value);
    });
  },
  set: function(key, value) {
    return new Promise(function(resolve, reject) {
      localStorage.setItem(key, JSON.stringify(value));
      resolve(value);
    });
  },
  remove: function(key) {
    return new Promise(function(resolve, reject) {
      localStorage.removeItem(key);
      resolve();
    });
  }
};
var chromeDAO = {
  get: function(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, function(v) {
        var value = v[key];
        if (typeof(value) !== 'undefined') {
          value = JSON.parse(v[key]);
        }
        resolve(value);
      });
    });
  },
  set: function(key, value) {
    return new Promise((resolve, reject) => {
      var obj = {};
      obj[key] = JSON.stringify(value);
      chrome.storage.local.set(obj, resolve);
    })
  },
  remove: function(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(key, resolve);
    });
  }
};
var dao = {
  localstore: undefined,
  datasource: undefined
};

if (typeof(Storage) !== 'undefined' && typeof(localStorage) !== 'undefined') {
  console.debug('Using local storage');
  dao.localstore = localDAO;
} else if (typeof(chrome) !== "undefined" && typeof(chrome.storage.local) !== 'undefined') {
  console.debug('Using chrome storage');
  dao.localstore = chromeDAO;
} else {
  console.debug('Using default storage');
  dao.localstore = defaultDAO;
}

dao.get = function(key, callback, context) {
  return dao.localstore.get(key).then(value => {
    if (callback) {
      callback.apply(context, [value]);
    }
  });
}
dao.set = function(key, value, callback, context) {
  return dao.localstore.set(key, value).then(value => {
    if (callback) {
      callback.apply(context, [value]);
    }
  });
}
dao.remove = function(key, callback, context) {
  return dao.localstore.remove(key).then(value => {
    if (callback) {
      callback.apply(context, [value]);
    }
  });
}

dao.defaultCallback = function(key, defaultValue, callback, context) {
  return function(value) {
    if (value === null || typeof(value) === 'undefined') {
      value = defaultValue;
    }
    if (callback) {
      callback.apply(context, [value]);
    }
  };
};

dao.listeners = {
  'puzzle-added': [],
  'puzzle-changed': [],
  'puzzle-removed': [],
  'score-added': [],
  'score-removed': [],
  'config-changed': []
};
dao.subscribe = function(types, key, callback, context) {
  if (dao.datasource) {
    dao.datasource.subscribe(types, key, callback, context);
  } else {
    types.forEach(function(type) {
      if (dao.listeners[type]) {
        dao.listeners[type].push({
          key,
          callback,
          context
        });
      }

      // Notify of existing puzzles
      if (type == 'puzzle-added') {
        dao.get('puzzles').then(puzzles => {
          puzzles.forEach(puzzle => {
            callback.apply(context, [puzzle]);
          });
        });
      }

      // Notify of existing results
      if (type == 'score-added') {
        dao.get('scores-' + key).then(scores => {
          if (scores) {
            scores.forEach(score => {
              callback.apply(context, [score]);
            });
          }
        });
      }

      if (type == 'config-changed') {
        dao.get(key).then(callback.bind(context));
      }
    });
  }
};
dao.unsubscribe = function(types, callback) {
  if (dao.datasource) {
    dao.datasource.unsubscribe(types, callback);
  } else {
    types.forEach(function(type) {
      var listeners = dao.listeners[type];
      if (listeners) {
        dao.listeners[type] = listeners.filter(function(listener) {
          return listener.callback != callback;
        });
      }
    });
  }
};
dao.notify = function(type, data) {
  if (dao.listeners[type]) {
    dao.listeners[type].forEach(function(listener) {
      if (type === 'config-changed') {
        if (data.key === listener.key) {
          listener.callback.apply(listener.context, [data.value]);
        }
      } else {
        listener.callback.apply(listener.context, [data]);
      }
    });
  }
}

dao.retrieveScores = function(puzzle, callback) {
  if (dao.datasource) {
    dao.datasource.retrieveScores(puzzle, callback);
  } else {
    dao.get('scores-' + puzzle).then(callback);
  }
};

dao.storeScore = function(puzzle, score, callback) {
  if (dao.datasource) {
    return dao.datasource.storeScore(puzzle, score, callback);
  } else {
    score.puzzle = puzzle;
    return new Promise(function(resolve, reject) {
      dao.get('scores-' + puzzle).then(scores => {
        if (!scores) {
          scores = [];
        }
        scores.push(score);
        // Fix data
        scores.forEach(function(score) {
          if (score.id) {
            score.timestamp = score.id;
            delete score['id'];
          }
        });
        scores = scores.unique(function(a, b) {
          return a.timestamp == b.timestamp;
        });
        dao.set('scores-' + puzzle, scores).then(resolve);
      });
    }).then(v => {
      if (callback) {
        callback(v);
      }
      dao.notify('score-added', score);
    });
  }
};

dao.removeScore = function(puzzle, score, callback) {
  if (dao.datasource) {
    return dao.datasource.removeScore(puzzle, score, callback);
  } else {
    return new Promise(function(resolve, reject) {
      dao.get('scores-' + puzzle).then(scores => {
        scores = scores.filter(function(s) {
          return s.timestamp != score.timestamp;
        });
        dao.set('scores-' + puzzle, scores).then(resolve);
      });
    }).then(callback).then(() => {
      dao.notify('score-removed', score);
    });
  }
};

dao.resetScores = function(puzzle, callback) {
  if (dao.datasource) {
    return dao.datasource.resetScores(puzzle, callback);
  } else {
    return new Promise(function(resolve, reject) {
      dao.get('scores-' + puzzle).then(scores => {
        dao.set('scores-' + puzzle, []).then(() => {
          scores.forEach(function(score) {
            dao.notify('score-removed', score);
          });
        });
      });
    }).then(callback);
  }
}

dao.retrievePuzzles = function(callback, context) {
  dao.get('puzzles').then(
    dao.defaultCallback('puzzles', ['3x3x3'], callback, context)
  );
};

dao.storePuzzle = function(puzzle) {
  if (dao.datasource) {
    dao.datasource.storePuzzle(puzzle);
  } else {
    dao.retrievePuzzles(function(puzzles) {
      if (puzzles.indexOf(puzzle) < 0) {
        puzzles.push({
          name: puzzle
        });
        dao.set('puzzles', puzzles).then(() => {
          dao.notify('puzzle-added', puzzle);
        });
      }
    });
  }
}

dao.removePuzzle = function(puzzle) {
  if (dao.datasource) {
    dao.datasource.removePuzzle(puzzle);
  } else {
    dao.retrievePuzzles(function(puzzles) {
      if (puzzles.indexOf(puzzle) >= 0) {
        puzzles = puzzles.filter(function(p) {
          return p.name !== puzzle;
        });
        dao.set('puzzles', puzzles).then(() => {
          dao.notify('puzzle-removed', {
            name: puzzle
          });
        });
      }
    });
  }
}

dao.storeConfig = function(key, value, callback) {
  if (dao.datasource) {
    dao.datasource.storeConfig(key, value, callback);
  } else {
    return dao.set(key, value).then(() => {
      if (callback) {
        callback();
      }
      dao.notify('config-changed', {
        key,
        value
      });
    });
  }
};

module.exports = dao;
