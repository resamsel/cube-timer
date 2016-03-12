var Sandbox = function(core) {
    this.core = core;
    this.notify = function(event) {
        core.notify(event);
    };
    this.listen = function(types, handler, module) {
        core.listen(types, handler, module);
    };
    this.activeGame = function(game) {
        return core.activeGame(game);
    };
    this.createStats = function(scores) {
        var stats = {
            scores: scores,
            categories: {}
        };

        if(stats.scores.length < 1) {
            stats.scores = [{id: 0, value: 0}];
        }

        stats.values = scores.map(scoreValue);
        stats.latest = stats.values.last();
        stats.latest5 = stats.values.slice(-5).sort(compareNumbers);
        stats.latest12 = stats.values.slice(-12).sort(compareNumbers);
        stats.latest50 = stats.values.slice(-50).sort(compareNumbers);
        stats.best3of5 = stats.latest5.slice(0, 3).sort(compareNumbers);
        stats.best10of12 = stats.latest12.slice(0, 10).sort(compareNumbers);

        stats.values.sort(compareNumbers);

        stats.best = stats.values.first();
        stats.avg = stats.values.avg();
        stats.avg80 = stats.values.slice(
            0,
            Math.max(1, Math.floor(scores.length*0.8))
        );

        stats.values.forEach(function(value) {
            var category = Category.fromValue(value);
            if (!(category in stats.categories)) {
                stats.categories[category] = 0;
            }
            stats.categories[category]++;
        });

        return stats;
    };
};

var Core = function() {
    var moduleData = {};
    var handlers = {};
    var eventQueue = [];
    var started = false;
    var game = '3x3x3';

    return {
        register: function(id, creator) {
            moduleData[id] = {
                creator: creator,
                instance: null
            };
        },

        start: function(id) {
            console.log('Core.start(id=%s)', id);
            var data = moduleData[id];
            data.instance = data.creator(new Sandbox(this));
            data.instance.id = id;
            data.instance.init();
        },

        stop: function(id) {
            var data = moduleData[id];
            if (data.instance) {
                data.instance.destroy();
                data.instance = null;
            }
        },

        init: function() {
            console.log('Core.init()');

            // Migrate database, if necessary
            this.migrate();

            retrieveActiveGame(function(game_){
                game = game_;
            });

            for(var moduleId in moduleData) {
                this.start(moduleId);
            }

            started = true;

            while(eventQueue.length > 0) {
                this.notify(eventQueue.pop());
            }

            this.notify({
                type: 'game-changed',
                data: this.activeGame()
            });
        },

        stopAll: function() {
            console.log('Core.stopAll()');
            for(var moduleId in moduleData) {
                this.stop(moduleId);
            }
        },

        migrate: function() {
            console.log('Core.migrate()');

            dao.get('databaseVersion', function(databaseVersion) {
                if(typeof(databaseVersion) === 'undefined') {
                    databaseVersion = 0;
                }
                if(databaseVersion < 1) {
                    // Migrate data set to support multiple games
                    // 1. retrieve data
                    dao.get('scores', function(scores) {
                        // 2. remove data in scores
                        dao.remove('scores');

                        // 3. store data in game '3x3x3'
                        dao.set('scores-3x3x3', scores);

                        dao.set('databaseVersion', 1);
                    });
                }
            });
        },

        notify: function(event) {
            console.log(
                'Core.notify(event=%s)',
                JSON.stringify(event)
            );
            if(!started) {
                eventQueue.push(event);
                return;
            }
            if(!handlers.hasOwnProperty(event.type)) {
                console.log(
                    'No handler found for type %s (%s)',
                    event.type,
                    JSON.stringify(Object.keys(handlers))
                );
                return;
            }
            for(var i = 0; i < handlers[event.type].length; i++) {
                handlers[event.type][i](event);
            }
        },

        listen: function(types, handler, module) {
            console.log(
                'Core.listen(types=%s, handler=%s, module=%s)',
                JSON.stringify(types),
                typeof handler,
                module.id
            );
            if(typeof handler !== 'function') {
                return;
            }
            var type;
            for(var i = 0; i < types.length; i++) {
                type = types[i];
                if(!handlers.hasOwnProperty(type)) {
                    handlers[type] = [];
                }
                handlers[type].push(handler);
            }
        },

        activeGame: function(game_) {
            if(typeof game_ !== 'undefined') {
                game = game_;
                storeActiveGame(game, function() {
                    Core.notify({
                        type: 'game-changed',
                        data: game
                    });
                });
            }

            return game;
        }
    };
}();

$(document).ready(function() {
    Core.init();
});
