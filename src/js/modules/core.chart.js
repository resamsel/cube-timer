var core = require('../core.js');
var dao = require('../dao.js');
var I18n = require('../utils/i18n.js');
var misc = require('../utils/misc.js');
var stats = require('../utils/stats.js');
var Chartist = require('chartist');
var legend = require('../external/chartist-plugin-legend.js');
//var $ = require('jquery');

core.register(
	'Chart',
	function (sandbox) {
		var module = {};
		var maxCategories = 5;
		var windowSize = 50;

		module.repaint = true;
		module.init = function() {
			sandbox.listen(
				['results-changed'],
				module.handleResultsChanged,
				module
			);
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

			$('.card-stats').css('display', 'block');
		};

		module.handleResultsChanged = misc.debounce(function(event) {
			//console.log('handleResultsChanged', event);
			module.updateChart(sandbox.createStats(module.results));
		}, 250);
		
		module.handleGameChanged = function(event) {
			module.results = [];
			module.repaint = true;
			var puzzle = sandbox.activeGame();

			dao.unlisten(['score-added'], module.handleScoreAdded);
			dao.unlisten(['score-removed'], module.handleScoreRemoved);

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

			module.handleResultsChanged({data: sandbox.activeGame()});
		};
		
		module.handleScoreAdded = function(score) {
			if(!module.results) {
				module.results = [];
			}
			module.results.push(score);
			misc.sortScores(module.results);
			module.repaint = true;
			module.handleResultsChanged({data: sandbox.activeGame()});
		};

		module.handleScoreRemoved = function(score) {
			module.results = module.results.filter(function(result) {
				return result.timestamp != score.timestamp;
			});
			module.repaint = true;
			module.handleResultsChanged({data: sandbox.activeGame()});
		};

		module.handlePageChanged = function(event) {
			if(event.data == 'timer' && module.repaint) {
				module.handleResultsChanged({data: sandbox.activeGame()});
			}
		};

		module.updateChart = function(stats) {
			console.log('%s.updateChart(stats=%s)', module.id, stats);
			
			if(!module.repaint || sandbox.activePage() != 'timer') {
				return;
			}

			var results = $('#ct-stats');
			var categories = $('#ct-categories');
			var weekdays = $('#ct-weekdays');

			module.detachChart(results);
			module.detachChart(categories);
			module.detachChart(weekdays);

			//if(stats.scores.length > 0) {
				results.data('chartist', module.createScores(stats));
				categories.data('chartist', module.createCategories(stats));
				weekdays.data('chartist', module.createWeekdays(stats));
				//}
			module.repaint = false;
		};

		module.detachChart = function(container) {
			var chart = container.data('chartist');
			if(chart) {
				chart.detach();
				container.children().remove();
			}
		};

		module.createScores = function(statistics) {
			var values = statistics.scores.map(misc.scoreValue);
			var averages5 = stats.movingAverage(values, 5);
			var averages12 = stats.movingAverage(values, 12);
			var averages50 = stats.movingAverage(values, 50);
			var best = stats.movingMinimum(values);
			var len = values.length;
			var offset = Math.max(0, len - windowSize);
			console.log(
				'values=%s, averages12=%s, averages50=%s, best=%s, offset=%d',
				values, averages12, averages50, best, offset
			);
			var data = {
				// A labels array that can contain any sort of values
				labels: statistics.scores.map(misc.scoreKey).slice(offset, len).rpad(windowSize, null),
				// Our series array that contains series objects or in this case series data arrays
				series: [
					values.slice(offset, len).rpad(windowSize, null),
					averages12.slice(offset, len).rpad(windowSize, null),
					averages50.slice(offset, len).rpad(windowSize, null),
					best.slice(offset, len).rpad(windowSize, null)
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
			var offset = Math.max(0, len - windowSize);
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
			var offset = Math.max(0, len - windowSize);
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
