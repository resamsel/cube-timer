var core = require('../core');
var dao = require('../dao');
var I18n = require('../utils/i18n');
var misc = require('../utils/misc');
var stats = require('../utils/stats');
var Chartist = require('chartist');
var legend = require('chartist-plugin-legend');

require('../../css/core.chart.css')

core.register(
	'Chart',
	function (sandbox) {
		var module = {};
		var maxCategories = 5;
		var windowSize = 50;
		var $results;
		var $categories;
		var $weekdays;

		module.repaint = true;
		module.results = [];
		module.init = function() {
			$results = document.getElementById('ct-stats');
			$categories = document.getElementById('ct-categories');
			$weekdays = document.getElementById('ct-weekdays');

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
			module.listen();

			document.querySelectorAll('.card-stats').forEach(el => {
				el.style.display = 'block';
			});
		};

		module.handleResultsChanged = misc.debounce(function(event) {
			module.updateChart(sandbox.createStats(module.results));
		}, 250);

		module.handlePuzzleChanged = function(event) {
			module.results = [];
			module.repaint = true;

			module.listen();

			module.handleResultsChanged({data: sandbox.activePuzzle()});
		};

		module.listen = function() {
			dao.unlisten(['score-added'], module.handleScoreAdded);
			dao.unlisten(['score-removed'], module.handleScoreRemoved);
			dao.unlisten(['config-changed'], module.handleWindowSizeChanged);

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
				'windowSize',
				module.handleWindowSizeChanged
			);
		};

		module.handleScoreAdded = function(score) {
			module.results.push(score);
			misc.sortScores(module.results);
			module.repaint = true;
			module.handleResultsChanged({data: sandbox.activePuzzle()});
		};

		module.handleScoreRemoved = function(score) {
			module.results = module.results.filter(function(result) {
				return result.timestamp != score.timestamp;
			});
			module.repaint = true;
			module.handleResultsChanged({data: sandbox.activePuzzle()});
		};

		module.handleWindowSizeChanged = function(value) {
			if(value == null || typeof value === 'undefined') {
				value = 50;
			}
			windowSize = value;
			module.repaint = true;
			module.handleResultsChanged({data: sandbox.activePuzzle()});
		};

		module.handlePageChanged = function(event) {
			if(event.data == 'timer' && module.repaint) {
				module.handleResultsChanged({data: sandbox.activePuzzle()});
			}
		};

		module.updateChart = function(stats) {
			if(!module.repaint || sandbox.activePage() != 'timer') {
				return;
			}

			module.detachChart($results);
			module.detachChart($categories);
			module.detachChart($weekdays);

			$results.dataset.chartist = module.createScores(stats);
			$categories.dataset.chartis = module.createCategories(stats);
			$weekdays.dataset.chartist = module.createWeekdays(stats);

			module.repaint = false;
		};

		module.detachChart = function(container) {
			if(typeof container === 'undefined') {
				return;
			}
			var chart = container.dataset.chartist;
			if(chart) {
				while(container.hasChildNodes()) {
					container.removeChild(container.lastChild);
				}
			}
		};

		module.createScores = function(statistics) {
			var values = statistics.scores.map(misc.scoreValue);
			var averages5 = stats.movingAverage(values, 5);
			var averages12 = stats.movingAverage(values, 12);
			var averages50 = stats.movingAverage(values, 50);
			var best = stats.movingMinimum(values);
			var len = values.length;
			var maxEntries = windowSize;
			if(maxEntries < 3 || maxEntries > len) {
				maxEntries = len;
			}
			var offset = Math.max(0, len - maxEntries);
			var data = {
				// A labels array that can contain any sort of values
				labels: statistics.scores.map(misc.scoreKey).slice(offset, len).rpad(maxEntries, null),
				// Our series array that contains series objects or in this case series data arrays
				series: [
					values.slice(offset, len).rpad(maxEntries, null),
					averages12.slice(offset, len).rpad(maxEntries, null),
					averages50.slice(offset, len).rpad(maxEntries, null),
					best.slice(offset, len).rpad(maxEntries, null)
				]
			};

			var options = {
				// Don't draw the line chart points
				showPoint: statistics.scores.length == 1 && statistics.scores[0].value !== 0,
				// X-Axis specific configuration
				axisX: {
					offset: 0,
					// We can disable the grid for this axis
					showGrid: false,
					// and also don't show the label
					showLabel: false
				},
				// Y-Axis specific configuration
				axisY: {
					// Lets offset the chart a bit from the labels
					//offset: 60,
					// The label interpolation function enables you to modify the values
					// used for the labels on each axis. Here we are converting the
					// values into million pound.
					labelInterpolationFnc: misc.hourMinuteFormatMilliseconds
				},
				lineSmooth: Chartist.Interpolation.simple({
					divisor: 2
				}),
				plugins: [
					Chartist.plugins.legend({
						legendNames: [
							I18n.translate('latest'),
							I18n.translate('average12'),
							I18n.translate('average50'),
							I18n.translate('best')
						],
						clickable: false
					})
				]
			};

			return new Chartist.Line('#ct-stats', data, options);
		};

		module.createCategories = function(stats) {
			var len = stats.scores.length;
			var maxEntries = windowSize;
			if(maxEntries < 3 || maxEntries > len) {
				maxEntries = len;
			}
			var offset = Math.max(0, len - maxEntries);
			var values = stats.scores.slice(offset, len).map(misc.scoreValue);
			var categories = sandbox.createCategories(values);
			var series = Object
				.keys(categories)
				.slice(0, maxCategories);
			var data = {
				series: series
					.map(function(key) {
						return categories[key];
					})
			};

			var options = {
				donut: true,
				donutWidth: 15,
				showLabel: false,
				showArea: false,
				plugins: [
					Chartist.plugins.legend({
						legendNames: series
							.map(function(key) {
								return 'sub ' + key;
							}),
						clickable: false
					})
				]

			};

			return new Chartist.Pie('#ct-categories', data, options);
		};

		module.createWeekdays = function(stats) {
			var series = [0, 0, 0, 0, 0, 0, 0];
			var len = stats.scores.length;
			var maxEntries = windowSize;
			if(maxEntries < 3 || maxEntries > len) {
				maxEntries = len;
			}
			var offset = Math.max(0, len - maxEntries);
			var values = stats.scores.slice(offset, len).map(misc.scoreKey);
			values.forEach(function(key) {
				series[new Date(key).getDay()] += 1;
			});
			var shifted = series.shift();
			series.push(shifted);
			var data = {
				labels: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
				series: [series]
			};
			var options = {
				chartPadding: 0,
				axisX: {
					offset: 15,
					showGrid: false
				},
				axisY: {
					showGrid: false
				}
			};

			return new Chartist.Bar('#ct-weekdays', data, options);
		};

		return module;
	}
);
