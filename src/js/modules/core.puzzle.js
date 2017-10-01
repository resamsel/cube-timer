var core = require('../core.js');
var dao = require('../dao.js');
var misc = require('../utils/misc.js');

core.register(
	'Puzzle',
	function(sandbox) {
		var module = {};
		var puzzles = [];
		var $puzzleName;
		var $puzzleList;

		module.init = function() {
			$puzzleName = $('#puzzle-name');
			$puzzleList = $('#puzzles-content .puzzle-container');

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
			dao.listen(['puzzle-added'], null, module.handlePuzzleAdded);
			dao.listen(['puzzle-removed'], null, module.handlePuzzleRemoved);

			$puzzleList.hide();
			$('.puzzles-button')
				.css('display', 'block')
				.attr('href', '#!' + sandbox.activeGame() + '/puzzles');

			$('#create-puzzle-button').click(module.handleCreatePuzzle);
		};

		module.handleGameChanged = function(event) {
			console.log('handleGameChanged(event)', event);
			var game = event.data;

			$('.game-list .active').removeClass('active');
			$('.game-list .game-' + game).addClass('active');
			$('.active-game .text').text(game);
			$('.active-game').attr('href', '#!'+game+'/'+sandbox.activePage());
		};

		module.handlePageChanged = function(event) {
			if(event.data == 'puzzles') {
				$('.puzzles-button').parent().addClass('active');
			} else {
				$('.puzzles-button').parent().removeClass('active');
			}

			$('.active-game').attr('href', '#!' + sandbox.activeGame() + '/' + event.data);
			$('.game-list .game:not(.puzzle-create) > a').each(function(index, el) {
				var $el = $(el);
				$el.attr('href', '#!'+$el.data('puzzle')+'/'+event.data);
			});
			
		};

		module.handlePuzzleAdded = function(puzzle) {
			console.log('Puzzle added', puzzle);
			if(puzzles.indexOf(puzzle.name) < 0) {
				puzzles.push(puzzle.name);
			}

			module.addPuzzle(puzzle);
			module.populateGames();
		};

		module.handlePuzzleRemoved = function(puzzle) {
			if(puzzles.indexOf(puzzle.name) >= 0) {
				puzzles = puzzles.filter(function(p) {
					return p !== puzzle.name;
				});
				if(puzzle.name === sandbox.activeGame()) {
					sandbox.activeGame(puzzles[0].name);
				}
			}

			$('#puzzle-'+puzzle.name).fadeOut({
				complete: function() {
					$(this).remove();
				}
			});
			module.populateGames();
		};

		module.handleCreatePuzzle = function() {
			var puzzle = $puzzleName.val();
			$puzzleName.val('');
			dao.storePuzzle(puzzle);
			sandbox.activeGame(puzzle);
		};

		module.addPuzzle = function(puzzle) {
			var row = $('#puzzles-content .template').clone();

			row.attr('id', 'puzzle-' + puzzle.name);
			row.removeClass('template');
			row
				.find('.title')
				.text(puzzle.name);
			row
				.find('.delete')
				.data('puzzle', puzzle.name)
				.on('click', function(event) {
					var puzzle = $(this).data('puzzle');
					$('#delete-puzzle-ok')
						.attr('href', '#!'+sandbox.activeGame()+'/puzzles')
						.on('click', function () {
							dao.removePuzzle(puzzle);
						});
					$('#delete-puzzle-cancel')
						.attr('href', '#!'+sandbox.activeGame()+'/puzzles')
						.on('click', function () {
							$('#delete-puzzle-ok').off('click');
						});
				});

			$puzzleList.append(row);

			$puzzleList.show();
		};

		/*
		* Create the list of games in the header bar.
		*/
		module.populateGames = misc.debounce(function() {
			var activeGame = sandbox.activeGame();
			var puzzleList = $('.game-list');
			var divider = $('.game-list .divider');
			var template = puzzleList.find('.template'),
				clone,
				game;

			puzzleList.find('[class^="game game-"]').remove();
			puzzles.sort();
			puzzles.forEach(function(game) {
				// 1. Clone template
				clone = template.clone();

				// 2. Update clone
				clone.removeClass('template').addClass('game-' + game);
				var $a = clone.find('a')
					.attr('href', '#!'+game+'/timer')
					.data('puzzle', game);
				$a.find('span').text(game);

				if(game == activeGame) {
					clone.addClass('active');
				}

				// 3. Add it to the game list
				divider.before(clone);
			});
		}, 250);

		return module;
	}
);