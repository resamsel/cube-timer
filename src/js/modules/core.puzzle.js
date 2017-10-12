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
				['puzzle-changed'],
				module.handlePuzzleChanged,
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
				.attr('href', '#!' + misc.encodeKey(sandbox.activePuzzle()) + '/puzzles');

			$('#create-puzzle-button').click(module.handleCreatePuzzle);
		};

		module.handlePuzzleChanged = function(event) {
			console.log('handlePuzzleChanged(event)', event);
			var puzzle = event.data;

			$('.puzzle-list .active').removeClass('active');
			$('.puzzle-list .puzzle-'+misc.encodeClass(puzzle)).addClass('active');
			$('.active-puzzle .text').text(puzzle);
			$('.active-puzzle').attr('href', '#!'+misc.encodeKey(puzzle)+'/'+sandbox.activePage());
		};

		module.handlePageChanged = function(event) {
			if(event.data == 'puzzles') {
				$('.puzzles-button').parent().addClass('active');
			} else {
				$('.puzzles-button').parent().removeClass('active');
			}

			$('.active-puzzle').attr('href', '#!' + misc.encodeKey(sandbox.activePuzzle()) + '/' + event.data);
			$('.puzzles-button').attr('href', '#!' + misc.encodeKey(sandbox.activePuzzle()) + '/puzzles');
			$('.puzzle-list .puzzle:not(.puzzle-create) > a').each(function(index, el) {
				var $el = $(el);
				$el.attr('href', '#!'+misc.encodeKey($el.data('puzzle'))+'/'+event.data);
			});
			
		};

		module.handlePuzzleAdded = function(puzzle) {
			console.log('Puzzle added', puzzle);
			if(puzzles.indexOf(puzzle.name) < 0) {
				puzzles.push(puzzle.name);
			}

			module.addPuzzle(puzzle);
			module.pupulatePuzzles();
		};

		module.handlePuzzleRemoved = function(puzzle) {
			if(puzzles.indexOf(puzzle.name) >= 0) {
				puzzles = puzzles.filter(function(p) {
					return p !== puzzle.name;
				});
				if(puzzle.name === sandbox.activePuzzle()) {
					sandbox.activePuzzle(puzzles[0].name);
				}
			}

			$(document.getElementById('puzzle-'+misc.encodeClass(puzzle.name))).fadeOut({
				complete: function() {
					$(this).remove();
				}
			});
			module.pupulatePuzzles();
		};

		module.handleCreatePuzzle = function() {
			var puzzle = $puzzleName.val();
			$puzzleName.val('');
			dao.storePuzzle(puzzle);
			sandbox.activePuzzle(puzzle);
		};

		module.addPuzzle = function(puzzle) {
			var row = $('#puzzles-content .template').clone();

			row.attr('id', 'puzzle-' + misc.encodeClass(puzzle.name));
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
						.attr('href', '#!'+misc.encodeKey(sandbox.activePuzzle())+'/puzzles')
						.on('click', function () {
							dao.removePuzzle(puzzle);
						});
					$('#delete-puzzle-cancel')
						.attr('href', '#!'+misc.encodeKey(sandbox.activePuzzle())+'/puzzles')
						.on('click', function () {
							$('#delete-puzzle-ok').off('click');
						});
				});

			$puzzleList.append(row);

			$puzzleList.show();
		};

		/*
		* Create the list of puzzles in the header bar.
		*/
		module.pupulatePuzzles = misc.debounce(function() {
			var activePuzzle = sandbox.activePuzzle();
			var puzzleList = $('.puzzle-list');
			var divider = $('.puzzle-list .divider');
			var template = puzzleList.find('.template'),
			clone;

			puzzleList.find('[class^="puzzle puzzle-"]').remove();
			puzzles.sort();
			puzzles.forEach(function(puzzle) {
				// 1. Clone template
				clone = template.clone();

				// 2. Update clone
				clone.removeClass('template').addClass('puzzle-'+misc.encodeClass(puzzle));
				var $a = clone.find('a')
					.attr('href', '#!'+misc.encodeKey(puzzle)+'/timer')
					.data('puzzle', puzzle);
				$a.find('span').text(puzzle);

				if(puzzle == activePuzzle) {
					clone.addClass('active');
				}

				// 3. Add it to the puzzle list
				divider.before(clone);
			});
		}, 250);

		return module;
	}
);