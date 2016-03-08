Core.register(
    'chart',
    function (sandbox) {
        var module = {};

        module.init = function() {
            sandbox.listen(
                ['game-changed', 'results-changed'],
                module.handleResultsChanged,
                module
            );
        };

        module.handleResultsChanged = function(event) {
            retrieveScores(event.data, function(results) {
                module.updateChart(module.createStats(results));
            });
        };

        module.updateChart = function(stats) {
            console.log('%s.updateChart(stats=%s)', module.id, stats);

            var results = $('#ct-stats');
            var categories = $('#ct-categories');
            var weekdays = $('#ct-weekdays');

            module.detachChart(results);
            module.detachChart(categories);
            module.detachChart(weekdays);

            if(stats.scores.length > 0) {
                results.data('chartist', module.createScores(stats));
                categories.data('chartist', module.createCategories(stats));
                weekdays.data('chartist', module.createWeekdays(stats));
            }
        };

        module.detachChart = function(container) {
            var chart = container.data('chartist');
            if(chart) {
                chart.detach();
                container.children().remove();
            }
        }

        module.createScores = function(stats) {
            var values = stats.scores.map(scoreValue);
            var averages5 = movingAverage(values, 5);
            var averages12 = movingAverage(values, 12);
            var averages50 = movingAverage(values, 50);
            var best = movingMinimum(values);
            var windowSize = 50;
            var len = values.length;
            var offset = Math.max(0, len - windowSize);
            console.log(
                'values=%s, averages12=%s, averages50=%s, best=%s, offset=%d',
                values, averages12, averages50, best, offset
            );
            var data = {
                // A labels array that can contain any sort of values
                labels: stats.scores.map(scoreKey).slice(offset, len).rpad(windowSize, null),
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
                showPoint: stats.scores.length == 1 && stats.scores[0].value !== 0,
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
                    labelInterpolationFnc: hourMinuteFormatMilliseconds
                },
                lineSmooth: Chartist.Interpolation.simple({
                    divisor: 2
                }),
                plugins: [
                    Chartist.plugins.legend({
                        legendNames: [
                            translate('latest'),
                            translate('average12'),
                            translate('average50'),
                            translate('best')
                        ],
                        clickable: false
                    })
                ]
            };

            return new Chartist.Line('#ct-stats', data, options);
        };

        module.createCategories = function(stats) {
            var series = Object.keys(stats.categories).slice(0, 5);
            var data = {
                series: series
                    .map(function(key) {
                        return stats.categories[key];
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
            stats.scores.map(scoreKey).forEach(function(key) {
                if(key % 100000 > 1000) {
                    // Imported data should be ignored, as it would be the same
                    // Day over and over again
                    series[new Date(key).getDay()] += 1;
                }
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

        module.createStats = function(scores) {
            var stats = {
                scores: scores,
                categories: {}
            };

            if(stats.scores.length < 1) {
                stats.scores = [{id: 0, value: 0}];
            }

            stats.values = scores.map(scoreValue);
            stats.last = stats.values.last();
            stats.last5 = stats.values.slice(-5).sort(compareNumbers);
            stats.last12 = stats.values.slice(-12).sort(compareNumbers);
            stats.best3of5 = stats.last5.slice(0, 3).sort(compareNumbers);
            stats.best10of12 = stats.last12.slice(0, 10).sort(compareNumbers);

            stats.values.sort(compareNumbers);

            stats.avg80 = stats.values.slice(
                0,
                Math.max(1, Math.floor(scores.length*0.8))
            );

            stats.values.forEach(function(value) {
                var category = valueToSub(value);
                if (!(category in stats.categories)) {
                    stats.categories[category] = 0;
                }
                stats.categories[category]++;
            });

            return stats;
        };

        return module;
    }
);
