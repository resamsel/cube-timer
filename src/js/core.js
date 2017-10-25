import Sandbox from './sandbox';
import * as dao from './dao';
import { encodeKey, decodeKey } from'./utils/misc';
import I18nUtils from './utils/i18n';
import * as NProgress from 'nprogress';

class Core {
	constructor() {
		console.log('Constructed');
		this.moduleData = {};
		this.handlers = {};
		this.eventQueue = [];
		this.started = false;
		this.puzzle = '3x3x3';
		this.page = 'timer';

	}

	register(id, creator) {
		console.debug('Core.register(id=%s)', id);
		this.moduleData[id] = {
			creator: creator,
			instance: null
		};
	}

	start(id) {
		console.debug('Core.start(id=%s)', id);
		var data = this.moduleData[id];
		data.instance = new data.creator(new Sandbox(this));
		data.instance.id = id;
		data.instance.init();
	}

	stop(id) {
		var data = this.moduleData[id];
		if (data.instance) {
			data.instance.destroy();
			data.instance = null;
		}
	}

	stopAll() {
		console.debug('Core.stopAll()');
		for(var moduleId in this.moduleData) {
			this.stop(moduleId);
		}
	}

	init() {
		console.debug('Core.init()');

		// Migrate database, if necessary
		this.migrate();

		for(var moduleId in this.moduleData) {
			this.start(moduleId);
		}

		this.started = true;

		while(this.eventQueue.length > 0) {
			this.notify(this.eventQueue.pop());
		}

		document.querySelector('body').style.display = 'block';
		NProgress.done();
	}

	notify(event) {
		console.debug(
			'Core.notify(event=%s)',
			JSON.stringify(event)
		);
		if(!this.started) {
			this.eventQueue.push(event);
			return;
		}
		if(!this.handlers.hasOwnProperty(event.type)) {
			return;
		}
		for(var i = 0; i < this.handlers[event.type].length; i++) {
			this.handlers[event.type][i](event);
		}
	};

	listen(types, handler, module) {
		console.debug(
			'Core.listen(types=%s, handler=%s, module=%s)',
			JSON.stringify(types),
			typeof handler,
			module.id
		)
		if(typeof handler !== 'function') {
			return;
		}
		var type;
		for(var i = 0; i < types.length; i++) {
			type = types[i];
			if(!this.handlers.hasOwnProperty(type)) {
				this.handlers[type] = [];
			}
			this.handlers[type].push(handler);
		}
	}

	activePuzzle(puzzle_) {
		if(typeof puzzle_ !== 'undefined' && puzzle_ !== this.puzzle) {
			this.puzzle = puzzle_;
			this.notify({
				type: 'puzzle-changed',
				data: this.puzzle
			});
		}

		return this.puzzle;
	};

	goToPage(path) {
		var parts = path.split('/');
		if(parts.length > 1) {
			var puzzle = decodeKey(parts[0]);
			if(puzzle.length > 0 && this.activePuzzle() != puzzle) {
				this.activePuzzle(puzzle);
				return this.goToPage(path);
			}
		}

		var page_ = parts.reverse()[0];
		var element = $('.page.page-' + page_);
		if(element.length < 1) {
			return;
		}

		this.page = page_;

		$('.page:not(.page-' + this.page + ')').hide();

		$('.button-collapse').sideNav('hide');
		this.notify({type: 'main-menu-closed'});

		$('.page-title')
			.attr('I18nUtils-key', this.page)
			.html(I18nUtils.translate(this.page));

		element.show();

		this.notify({type: 'page-changed', data: this.page});
	}

	activePage() {
		return this.page;
	}

	migrate() {
		console.debug('Core.migrate()');

		dao.get('databaseVersion', function(databaseVersion) {
			if(typeof(databaseVersion) === 'undefined') {
				databaseVersion = 0;
			}
			if(databaseVersion < 1) {
				// Migrate data set to support multiple puzzles
				// 1. retrieve data
				dao.get('scores', function(scores) {
					// 2. remove data in scores
					dao.remove('scores');

					// 3. store data in puzzle '3x3x3'
					dao.set('scores-3x3x3', scores);

					// 5. upgrade database version
					dao.set('databaseVersion', 1);
				});
			}
			if(databaseVersion < 2) {
				// Migrate data set to support puzzles in Firebase
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
						puzzles = [{name: '3x3x3'}];
					}

					// 4. store data in puzzles
					dao.set('puzzles', puzzles);
					puzzles.forEach(function(puzzle) {
						dao.notify('puzzle-added', puzzle);
					});

					// 5. upgrade database version
					dao.set('databaseVersion', 2);
				});
			}
			if(databaseVersion < 3) {
				// Migrate dataset to populate puzzles with default puzzle
				// 1. retrieve data
				dao.get('puzzles', function(puzzles) {
					if(puzzles.length < 1) {
						puzzles = [{name: '3x3x3'}];
					}

					// 4. store data in puzzles
					dao.set('puzzles', puzzles);
					puzzles.forEach(function(puzzle) {
						dao.notify('puzzle-added', puzzle);
					});

					// 5. upgrade database version
					dao.set('databaseVersion', 3);
				});
			}
		});
	}
};

export default new Core();
