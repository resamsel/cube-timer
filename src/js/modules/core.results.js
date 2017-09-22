var core = require('../core.js');
var dao = require('../dao.js');
var misc = require('../utils/misc.js');
var Category = require('../utils/category.js');

core.register(
	'Results',
	function(sandbox) {
		var module = {};

		module.results = [];

		module.init = function() {
			sandbox.listen(
				['config-subtext-changed'],
				module.updateLabels,
				module
			);
			sandbox.listen(
				['game-changed'],
				module.handleGameChanged,
				module
			);

			$('.results-button')
				.css('display', 'block')
				.attr('href', '#!' + sandbox.activeGame() + '/results')
				.on('click', function(e) {
					module.updateDates();
					sandbox.goToPage(sandbox.activeGame() + '/results');
				});
		};

		module.handleGameChanged = function(event) {
			module.results = [];

			dao.unlisten(['score-added'], module.handleScoreAdded);
			dao.unlisten(['score-removed'], module.handleScoreRemoved);

			dao.listen(
				['score-added'],
				sandbox.activeGame(),
				module.handleScoreAdded
			);
			dao.listen(
				['score-removed'],
				sandbox.activeGame(),
				module.handleScoreRemoved
			);

			module.handleResultsChanged();
		};

		module.handleResultsChanged = misc.debounce(function() {
			misc.sortScores(module.results);
			module.updateResults(sandbox.activeGame());
		}, 250);

		module.handleScoreAdded = function(score) {
			module.results.push(score);
			module.handleResultsChanged();
		};
		
		module.handleScoreRemoved = function(score) {
			module.results = module.results.filter(function(result) {
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
 
		module.removeResult = function(element) {
			element = $(element);
			var game = element.data('game');
			var score = element.data('score');
			//console.log('removeResult with score %s, game %s', score, game);
			dao.removeScore(game, score);
		};

		module.createContainer = function() {
			var container = $('#results-content .template.result-container')
				.clone()
				.removeClass('template');
			$('#results-content .times-content').append(container);
			return container;
		};

		module.createResult = function(score, index) {
			var row = $('#results-content .template.result-item').clone();

			row.attr('id', 'id-' + score.timestamp);
			row.removeClass('template');
			row
				.find('.value')
				.text(misc.defaultFormatMilliseconds(score.value));
			row
				.find('.date')
				.text(misc.toDate(score.timestamp)).data('date', score.timestamp);
			row
				.find('.delete')
				.data('game', sandbox.activeGame())
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

		module.updateResults = misc.debounce(function(game) {
			console.log(
				'%s.updateResults(game=%s)',
				module.id,
				game
			);
			var results = module.results;
			$('#results-content .times-content > *').remove();
			var result;
			var latestDate = '', date;
			var parentContainer = $('#results-content .times-content');
			var container;
			var previous;

			results.slice().reverse().forEach(function(result, i) {
				date = misc.toGroupedDate(result.timestamp);
				if(date !== latestDate) {
					parentContainer.append(module.createDate(result.timestamp));
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
			//console.log('update', results);
			module.updateDates();
			module.updateIndices(module.results);
			module.updateLabels(module.results);
		}, 250);

		module.updateDates = function() {
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
			dao.getConfig('subtext', true, function(markSubX) {
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
					if(markSubX) {
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
			});
		};

		return module;
	}
);