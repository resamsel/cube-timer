var core = require('../core.js');
var dao = require('../dao.js');
var misc = require('../utils/misc.js');
const moment = require('moment')
var $ = require('jquery');

core.register(
	'Puzzles',
	function(sandbox) {
		var module = {};
		var puzzles = [];
		var $puzzleName;
		var $puzzleList;

		module.init = function() {
			$puzzleName = $('#puzzle-name');
			$puzzleList = $('#puzzles-content .puzzle-container');

			$puzzleList.hide();

			sandbox.listen(
				['puzzle-changed'],
				module.handlePuzzleSwitched,
				module
			);
			sandbox.listen(
				['page-changed'],
				module.handlePageChanged,
				module
			);
			dao.listen(['puzzle-added'], null, module.handlePuzzleAdded);
			dao.listen(['puzzle-removed'], null, module.handlePuzzleRemoved);
			dao.listen(
				['config-changed'],
				'language',
				module.handleLanguageChanged
			);

			$('.puzzles-button')
				.css('display', 'block')
				.attr('href', '#!' + misc.encodeKey(sandbox.activePuzzle()) + '/puzzles');

			$('#create-puzzle-button').click(module.handleCreatePuzzle);

			module.updateTime();
		};

		module.handlePuzzleSwitched = function(event) {
			console.debug('handlePuzzleSwitched(event)', event);
			var puzzle = event.data;

			$('.puzzle-list .active').removeClass('active');
			$('.puzzle-list .puzzle-'+misc.encodeClass(puzzle)).addClass('active');
			$('.active-puzzle .text').text(puzzle);
			$('.active-puzzle').attr('href', '#!'+misc.encodeKey(puzzle)+'/'+sandbox.activePage());

			$('.puzzle-item.active').removeClass('active');
			$(document.getElementById('puzzle-'+misc.encodeClass(puzzle))).addClass('active');
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
			console.debug('handlePuzzleAdded', puzzle, puzzles);

			if(puzzles.indexOf(puzzle.name) < 0) {
				puzzles.push(puzzle.name);
			}

			module.addPuzzle(puzzle);
			module.populatePuzzles();

			dao.listen(
				['puzzle-changed'],
				misc.encodeKey(puzzle.name),
				module.handlePuzzleChanged
			);
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
			module.populatePuzzles();
		};

		module.handlePuzzleChanged = function(puzzle) {
			if(puzzle) {
				module.updatePuzzle(puzzle, $(document.getElementById('puzzle-'+misc.encodeClass(puzzle.name))));
			}
		};

		module.handleLanguageChanged = function(value) {
			moment.locale(value);
			module.updateTime();
		};

		module.handleCreatePuzzle = function() {
			var puzzle = $puzzleName.val();
			$puzzleName.val('');
			dao.storePuzzle(puzzle);
			sandbox.activePuzzle(puzzle);
		};

		module.addPuzzle = function(puzzle) {
			var row = module.updatePuzzle(puzzle, $('#puzzles-content .template').clone());

			var added = false;
			$puzzleList.children().each(function(index, item) {
				var $item = $(item);
				if(added === false && $item.data('puzzle') > puzzle.name) {
					$item.before(row);
					added = true;
				}
			});
			if(added === false) {
				$puzzleList.append(row);
			}

			$puzzleList.show();
		};

		module.updatePuzzle = function(puzzle, row) {
			row.attr('id', 'puzzle-' + misc.encodeClass(puzzle.name));
			row.removeClass('template');
			row.data('puzzle', puzzle.name);
			if(puzzle.name == sandbox.activePuzzle()) {
				row.addClass('active');
			}
			row.find('.title').text(puzzle.name);
			if(typeof puzzle.last_active !== 'undefined') {
				misc.updateWithTime(
					row.find('.last-active'),
					new Date(puzzle.last_active)
				);
			} else {
				row.find('.last-active').hide();
			}
			row
				.find('.select')
				.attr('href', '#!'+misc.encodeKey(puzzle.name)+'/puzzles');
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

			return row;
		};

		/*
		* Create the list of puzzles in the header bar.
		*/
		module.populatePuzzles = misc.debounce(function() {
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
					.attr('href', '#!'+misc.encodeKey(puzzle)+'/'+sandbox.activePage())
					.data('puzzle', puzzle);
				$a.find('span').text(puzzle);

				if(puzzle == activePuzzle) {
					clone.addClass('active');
				}

				// 3. Add it to the puzzle list
				divider.before(clone);
			});
		}, 250);

		module.updateTime = function() {
			$('time.sync').each(function(index, el) {
				misc.updateWithTime($(el));
			});

			setTimeout(module.updateTime, 10000);
		};

		return module;
	}
);
