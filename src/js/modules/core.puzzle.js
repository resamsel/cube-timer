var core = require('../core.js');
var dao = require('../dao.js');
//var $ = require('jquery');

core.register(
	'Puzzle',
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

		module.handlePageChanged = function(event) {
			$('.active-game').attr('href', '#!' + sandbox.activeGame() + '/' + event.data);
			$('.game-list .game > a').each(function(index, el) {
				var $el = $(el);
				$el.attr('href', '#!'+$el.data('puzzle')+'/'+event.data);
			});
			
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
					var $a = clone.find('a');
					$a.attr('href', '#!'+game+'/timer');
					$a.text(game);
					$a.data('puzzle', game);

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

		return module;
	}
);