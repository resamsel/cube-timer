var core = require('../core');
var dao = require('../dao');
var misc = require('../utils/misc');
var Category = require('../utils/category');
var $ = require('jquery');

core.register(
	'Results',
	function(sandbox) {
		var module = {};
		var results = [];
		var subtext = false;
		var timeout;
		var $loading;
		var $resultsButton;
		var $scoresContent;
		var $scoreTemplate;
		var $noResults;

		module.init = function() {
			$loading = $('.page-results .loading');
			$resultsButton = $('.results-button');
			$scoresContent = $('#results-content .times-content');
			$scoreTemplate = $('#results-content .template.result-container');
			$noResults = $('.page-results .empty');

			timeout = setTimeout(function() {
				$loading.hide();
				$noResults.fadeIn();
			}, 2000);

			dao.listen(
				['config-changed'],
				'subtext',
				module.update
			);
			sandbox.listen(
				['page-changed'],
				module.handlePageChanged,
				module
			);
			sandbox.listen(
				['puzzle-changed'],
				module.handlePuzzleChanged,
				module
			);
			module.listen();

			$resultsButton
				.css('display', 'block')
				.attr('href', '#!'+misc.encodeKey(sandbox.activePuzzle())+'/results');
			$noResults.hide();
		};

		module.listen = function() {
			dao.unlisten(['score-added'], module.handleScoreAdded);
			dao.unlisten(['score-removed'], module.handleScoreRemoved);
			dao.unlisten(['config-changed'], module.handleSubtextChanged);

			var puzzle = sandbox.activePuzzle();
			dao.listen(
				['score-added'],
				puzzle,
				module.handleScoreAdded
			);
			dao.listen(
				['score-removed'],
				puzzle,
				module.handleScoreRemoved
			);
			dao.listen(
				['config-changed'],
				'subtext',
				module.handleSubtextChanged
			);
		};

		module.handlePageChanged = function(event) {
			if(event.data == 'results') {
				$resultsButton.parent().addClass('active');
			} else {
				$resultsButton.parent().removeClass('active');
			}
		};

		module.handlePuzzleChanged = function(event) {
			module.cleanResults();
			$loading.fadeIn();

			$resultsButton.attr(
				'href',
				'#!'+misc.encodeKey(event.data)+'/results'
			);

			results = [];

			module.listen();

			module.handleResultsChanged();
		};

		module.handleResultsChanged = misc.debounce(function() {
			misc.sortScores(results);
			module.updateResults(sandbox.activePuzzle());
		}, 250);

		module.handleScoreAdded = function(score) {
			if(typeof timeout !== 'undefined') {
				clearTimeout(timeout);
				timeout = undefined;
			}

			results.push(score);
			module.handleResultsChanged();
		};

		module.handleScoreRemoved = function(score) {
			results = results.filter(function(result) {
				return result.timestamp != score.timestamp;
			});
			$('#id-' + score.timestamp).fadeOut({
				complete: function(a) {
					var $this = $(this);
					if($this.parent().children().length < 2) {
						$this.parent().prev().remove();
						$this.parent().remove();
					}
					$this.remove();
					module.update();
				}
			});
		};

		module.handleSubtextChanged = function(value) {
			subtext = value;
		};

		module.removeResult = function(element) {
			element = $(element);
			var puzzle = element.data('puzzle');
			var score = element.data('score');
			dao.removeScore(puzzle, score);
		};

		module.createContainer = function() {
			var container = $scoreTemplate.clone().removeClass('template');
			$scoresContent.append(container);
			return container;
		};

		module.createResult = function(score, index) {
			var row = $('#results-content .template.result-item').clone();

			row.attr('id', 'id-' + score.timestamp).removeClass('template');
			row
				.find('.value')
				.text(misc.defaultFormatMilliseconds(score.value));
			row
				.find('.date')
				.text(misc.toDate(score.timestamp)).data('date', score.timestamp);
			row
				.find('.delete')
				.data('puzzle', sandbox.activePuzzle())
				.data('score', score)
				.on('click', function(event) {
					module.removeResult(this);
				});

			return row;
		};

		module.createDate = function(date) {
			var element = $('#results-content .template.result-header')
				.clone()
				.removeClass('template')
				.attr('datetime', misc.toIsoDate(date))
				.html(misc.toGroupedDate(date));
			var firstChar = element.html().substring(0, 1);
			if(firstChar == firstChar.toLowerCase()) {
				// The content was not translated, so add the i18n-key attribute
				// to translate it later
				element.attr('i18n-key', element.html());
			}
			return element;
		};

		module.cleanResults = function() {
			$('#results-content .times-content > *').remove();
			$noResults.hide();
		};

		module.updateResults = misc.debounce(function() {
			module.cleanResults();
			$loading.hide();

			var result;
			var latestDate = '', date;
			var container;
			var previous;

			if(results.length < 1) {
				$noResults.fadeIn();
				return;
			}

			results.slice().reverse().forEach(function(result, i) {
				date = misc.toGroupedDate(result.timestamp);
				if(date !== latestDate) {
					$scoresContent.append(module.createDate(result.timestamp));
					container = module.createContainer();
					latestDate = date;
				}
				container.append(
					module.createResult(result, i+1)
				);
			});
			module.update(results);
		}, 250);

		module.update = misc.debounce(function() {
			module.updateDates();
			module.updateIndices(results);
			module.updateLabels(results);
		}, 250);

		module.updateDates = function() {
			results.forEach(function(result, index) {
				misc.updateWithTime(
					$('#id-' + result.timestamp + ' time'),
					new Date(result.timestamp)
				);
			});
			$('#results-content .times-content > * .date').each(function() {
				var that = $(this);
				that.text(misc.toDate(that.data('date')));
			});

		};

		module.updateIndices = function(results) {
			results.forEach(function(result, index) {
				$('#id-' + result.timestamp + ' .index').text('#' + (index+1));
			});
		};

		module.mark = function(result, text, type_) {
			$('#id-' + result.timestamp + ' .tags')
				.append(' <span class="label label-' + type_ + '">' + text + '</span>');
		};

		module.updateLabels = function(results) {
			var result,
				best = {timestamp: 0, value: 999999999},
				best5 = {timestamp: 0, value: 999999999},
				best12 = {timestamp: 0, value: 999999999},
				sub;

			// Remove first
			$('#results-content .label').remove();

			for (var i = 0; i < results.length; i++) {
				result = results[i];
				if (result.value < best.value) {
					best = result;
				}
				if ((results.length - i - 1) < 5 && result.value < best5.value) {
					best5 = result;
				}
				if ((results.length - i - 1) < 12 && result.value < best12.value) {
					best12 = result;
				}
				if(subtext) {
					sub = Category.fromValue(result.value);
					if (sub > 0) {
						module.mark(result, 'sub ' + sub, 'info');
					}
				}
			}

			// Then mark
			module.mark(best, 'best', 'success');
			module.mark(best5, 'best #5', 'success');
			module.mark(best12, 'best #12', 'success');
		};

		return module;
	}
);
