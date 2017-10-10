var Sandbox = require('./sandbox.js');
var dao = require('./dao.js');
var I18n = require('./utils/i18n.js');

module.exports = function() {
	var moduleData = {};
	var handlers = {};
	var eventQueue = [];
	var started = false;
	var game = '3x3x3';
	var page = 'timer';
	var core = {};

	core.register = function(id, creator) {
		moduleData[id] = {
			creator: creator,
			instance: null
		};
	};

	core.start = function(id) {
		console.debug('Core.start(id=%s)', id);
		var data = moduleData[id];
		data.instance = data.creator(new Sandbox(this));
		data.instance.id = id;
		data.instance.init();
	};

	core.stop = function(id) {
		var data = moduleData[id];
		if (data.instance) {
			data.instance.destroy();
			data.instance = null;
		}
	};

	core.init = function() {
		console.debug('Core.init()');

		NProgress.start();

		// Migrate database, if necessary
		this.migrate();

		for(var moduleId in moduleData) {
			this.start(moduleId);
		}

		started = true;

		while(eventQueue.length > 0) {
			this.notify(eventQueue.pop());
		}

		NProgress.done();
	};

	core.stopAll = function() {
		console.debug('Core.stopAll()');
		for(var moduleId in moduleData) {
			this.stop(moduleId);
		}
	};

	core.migrate = function() {
		console.debug('Core.migrate()');

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

					// 5. upgrade database version
					dao.set('databaseVersion', 1);
				});
			}
			if(databaseVersion < 2) {
				// Migrate data set to support games in Firebase
				// 1. retrieve data
				dao.get('games', function(games) {
					// 2. remove data in games
					dao.remove('games');

					var puzzles;
					if(games !== null) {
						// 3. migrate games to puzzle objects
						puzzles = games.map(function(game) {
							return {name: game};
						});
					} else {
						puzzles = ['3x3x3'];
					}

					// 4. store data in puzzles
					dao.set('puzzles', puzzles);
					puzzles.forEach(function(puzzle) {
						dao.notify('puzzle-added', {name: puzzle});
					});

					// 5. upgrade database version
					dao.set('databaseVersion', 2);
				});
			}
		});
	};

	core.notify = function(event) {
		console.debug(
			'Core.notify(event=%s)',
			JSON.stringify(event)
		);
		if(!started) {
			eventQueue.push(event);
			return;
		}
		if(!handlers.hasOwnProperty(event.type)) {
			return;
		}
		for(var i = 0; i < handlers[event.type].length; i++) {
			handlers[event.type][i](event);
		}
	};

	core.listen = function(types, handler, module) {
		console.debug(
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
	};

	core.activeGame = function(game_) {
		if(typeof game_ !== 'undefined') {
			game = game_;
			core.notify({
				type: 'game-changed',
				data: game
			});
		}

		return game;
	};

	core.goToPage = function(path) {
		var parts = path.split('/');
		if(parts.length > 1) {
			var game = parts[0];
			if(game.length > 0 && core.activeGame() != game) {
				core.activeGame(game);
				return core.goToPage(path);
			}
		}

		var page_ = parts.reverse()[0];
		var element = $('.page.page-' + page_);
		if(element.length < 1) {
			return;
		}

		page = page_;

		$('.page:not(.page-' + page + ')').hide();

		$('.button-collapse').sideNav('hide');
		core.notify({type: 'main-menu-closed'});

		$('.page-title')
			.attr('i18n-key', page)
			.html(I18n.translate(page));

		element.show();

		core.notify({type: 'page-changed', data: page});
	};
	
	core.activePage = function() {
		return page;
	};

	return core;
}();