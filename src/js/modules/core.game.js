var core = require('../core.js');
var dao = require('../dao.js');
//var $ = require('jquery');

core.register(
	'Game',
	function(sandbox) {
		var module = {};

		module.init = function() {
			sandbox.listen(
				['game-changed'],
				module.handleGameChanged,
				module
			);
			sandbox.listen(
				['page-changed'],
				module.handlePageChanged,
				module
			);

			$('.active-game').css('display', 'block');

			module.populateGames();
		};

		module.handleGameChanged = function(event) {
			var game = event.data;

			$('.game-list .active').removeClass('active');
			$('.game-list .game-' + game).addClass('active');
			$('.active-game .text').text(game);
			$('.active-game').attr('href', '#!'+game+'/'+sandbox.activePage());
		};

		/*
		* Create the list of games in the header bar.
		*/
		module.populateGames = function() {
			dao.retrieveGames(function(games) {
				var activeGame = sandbox.activeGame();
				var gameList = $('.game-list');
				var template = gameList.find('.template'),
					clone,
					game;

				for(var i = 0; i < games.length; i++) {
					game = games[i];

					// 1. Clone template
					clone = template.clone();

					// 2. Update clone
					clone.removeClass('template').addClass('game-' + game);
					clone
						.find('a')
						.attr('href', '#!' + game + '/timer')
					.text(game);
					clone.on('click', module.activateGame(game));

					if(game == activeGame) {
						clone.addClass('active');
					}

					// 3. Add it to the game list
					gameList.append(clone);
				}
				//$('.dropdown-button').dropdown();

				sandbox.notify({type: 'game-list-created'});
			});
		};

		module.activateGame = function(game) {
			return function() {
				sandbox.activeGame(game);
				//$('.button-collapse').sideNav('hide');
				//sandbox.notify({type: 'main-menu-closed'});
			};
		};

		module.handlePageChanged = function(event) {
			$('.active-game').attr('href', '#!' + sandbox.activeGame() + '/' + event.data);
		};

		return module;
	}
);