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
