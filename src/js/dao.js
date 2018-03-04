// TODO: Move to Sandbox

import LocalDAO from './daos/local';
import ChromeDAO from './daos/chrome';
import DefaultDAO from './daos/default';

const SUBSCRIPTIONS = [
  ['puzzle-added', null],
  ['puzzle-changed', null],
  ['puzzle-removed', null],
  ['score-added', null],
  ['score-removed', null],
  ['config-changed', 'inspectionTime']
];

function defaultCallback(key, defaultValue, callback, context) {
  return function(value) {
    if (value === null || typeof(value) === 'undefined') {
      value = defaultValue;
    }
    if (callback) {
      callback.apply(context, [value]);
    }
  };
}

class DAO {
  constructor() {
    this.puzzle = undefined;
    this.datasource = undefined;
    this.listeners = {
      'puzzle-added': [],
      'puzzle-changed': [],
      'puzzle-removed': [],
      'score-added': [],
      'score-removed': [],
      'config-changed': []
    };
    this.subscriptions = {};

    this.localstore = undefined;
    if (typeof(Storage) !== 'undefined' && typeof(localStorage) !== 'undefined') {
      console.debug('Using local storage');
      this.localstore = new LocalDAO();
    } else if (typeof(chrome) !== "undefined" && typeof(chrome.storage.local) !== 'undefined') {
      console.debug('Using chrome storage');
      this.localstore = new ChromeDAO();
    } else {
      console.debug('Using default storage');
      this.localstore = new DefaultDAO();
    }
  }

  get(key, callback, context) {
    return this.localstore.get(key).then(value => {
      if (callback) {
        callback.apply(context, [value]);
      }
    });
  }

  set(key, value, callback, context) {
    return this.localstore.set(key, value).then(value => {
      if (callback) {
        callback.apply(context, [value]);
      }
    });
  }

  remove(key, callback, context) {
    return this.localstore.remove(key).then(value => {
      if (callback) {
        callback.apply(context, [value]);
      }
    });
  }

  registerDatasource(datasource) {
    this.datasource = datasource;
    const self = this;

    SUBSCRIPTIONS.forEach(params => {
      datasource.subscribe(
        params[0],
        params[1],
        self.subscriptionHandler(params[0], params[1]),
        self
      );
    });

    console.log('DAO.puzzle', this.puzzle);
    if (this.puzzle) {
      datasource.retrieveScores(this.puzzle, scores => {
        self.storeScores(scores);
      });
    }
  }

  unregisterDatasource(datasource) {
    this.datasource = undefined;

    SUBSCRIPTIONS.forEach(params => {
      datasource.unsubscribe(
        params[0],
        params[1],
        this.subscriptionHandler(params[0], params[1]),
        this
      );
    });
  }

  subscribe(type, key, callback, context) {
    if (this.listeners[type]) {
      this.listeners[type].push({
        key,
        callback,
        context
      });
    }

    // Notify of existing puzzles
    if (type == 'puzzle-added') {
      this.get('puzzles').then(puzzles => {
        if (!puzzles) {
          puzzles = [];
        }
        puzzles.forEach(puzzle => {
          callback.apply(context, [puzzle]);
        });
      });
    }

    // Notify of existing results
    if (type == 'score-added') {
      this.get('scores-' + key).then(scores => {
        if (scores) {
          scores.forEach(score => {
            callback.apply(context, [score]);
          });
        }
      });
    }

    if (type == 'config-changed') {
      this.get(key).then(callback.bind(context));
    }
  }

  unsubscribe(type, callback) {
    var listeners = this.listeners[type];
    if (listeners) {
      this.listeners[type] = listeners.filter(function(listener) {
        return listener.callback != callback;
      });
    }
  }

  subscriptionHandler(type, key) {
    const self = this;
    const subscriptionKey = `${type}:${key}`;
    if (!this.subscriptions[subscriptionKey]) {
      this.subscriptions[subscriptionKey] = function(value) {
        console.log('subscriptionHandler(type=%s, key=%s)(%s)', type, key);
        if (type === 'config-changed') {
          self.notify(type, {
            key,
            value
          });
        } else {
          self.notify(type, value);
        }
      }
    }
    return this.subscriptions[subscriptionKey];
  }

  notify(type, data) {
    console.debug('DAO.notify', type, data);

    if (this.listeners[type]) {
      this.listeners[type].forEach(listener => {
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

  retrieveScores(puzzle, callback) {
    this.get('scores-' + puzzle).then(callback);
  }

  /**
   * FIXME: Avoid iterating above each entry, do the insert all at once!
   */
  storeScores(scores) {
    const self = this;
    scores.forEach(score => {
      self.storeScore(score.puzzle, score);
    });
  }

  storeScore(puzzle, score, keepLocally) {
    score.puzzle = puzzle;
    const self = this;
    return new Promise((resolve, reject) => {
      self.get('scores-' + puzzle).then(scores => {
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
          if (score.user) {
            delete score['user'];
          }
        });
        scores = scores.unique((a, b) => a.timestamp == b.timestamp);
        self.set('scores-' + puzzle, scores).then(resolve);
      });
    }).then(v => {
      self.notify('score-added', score);
    });
  }

  removeScore(puzzle, score, callback) {
    return new Promise(function(resolve, reject) {
      this.get('scores-' + puzzle).then(scores => {
        scores = scores.filter(function(s) {
          return s.timestamp != score.timestamp;
        });
        this.set('scores-' + puzzle, scores).then(resolve);
      });
    }).then(callback).then(() => {
      this.notify('score-removed', score);

      if (this.datasource) {
        return this.datasource.removeScore(puzzle, score, callback);
      }
    });
  }

  resetScores(puzzle, callback) {
    if (this.datasource) {
      return this.datasource.resetScores(puzzle, callback);
    } else {
      return new Promise(function(resolve, reject) {
        this.get('scores-' + puzzle).then(scores => {
          this.set('scores-' + puzzle, []).then(() => {
            scores.forEach(function(score) {
              this.notify('score-removed', score);
            });
          });
        });
      }).then(callback);
    }
  }

  retrievePuzzles(callback, context) {
    this.get('puzzles').then(
      defaultCallback('puzzles', [{
        name: '3x3x3'
      }], callback, context)
    );
  }

  storePuzzle(puzzleName) {
    const self = this;
    this.retrievePuzzles(function(puzzles) {
      if (puzzles.indexOf(puzzleName) < 0) {
        const puzzle = {
          name: puzzleName
        };
        puzzles.push(puzzle);
        self.set('puzzles', puzzles).then(() => {
          self.notify('puzzle-added', puzzle);
        });
      }
    });

    if (this.datasource) {
      this.datasource.storePuzzle(puzzleName);
    }
  }

  removePuzzle(puzzleName) {
    this.retrievePuzzles(function(puzzles) {
      if (puzzles.indexOf(puzzleName) >= 0) {
        puzzles = puzzles.filter(function(p) {
          return p.name !== puzzleName;
        });
        this.set('puzzles', puzzles).then(() => {
          this.notify('puzzle-removed', {
            name: puzzleName
          });
        });
      }
    });

    if (this.datasource) {
      this.datasource.removePuzzle(puzzleName);
    }
  }

  storeConfig(key, value, callback) {
    return this.set(key, value).then(() => {
      if (callback) {
        callback();
      }
      this.notify('config-changed', {
        key,
        value
      });
    });

    if (this.datasource) {
      this.datasource.storeConfig(key, value);
    }
  }
}

module.exports = new DAO();
