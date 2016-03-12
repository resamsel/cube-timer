Core.register(
    'Chart',
    function (sandbox) {
        var module = {};
        var maxCategories = 5;

        module.init = function() {
            sandbox.listen(
                ['game-changed', 'results-changed'],
                module.handleResultsChanged,
                module
            );
            sandbox.listen(
                ['i18n-started'],
                module.handleI18nStarted,
                module
            );
        };

        module.handleResultsChanged = function(event) {
            retrieveScores(event.data, function(results) {
                module.updateChart(sandbox.createStats(results));
            });
        };

        module.handleI18nStarted = function(event) {
            module.handleResultsChanged({data: sandbox.activeGame()});
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
        };

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
            var series = Object
                .keys(stats.categories)
                .slice(0, maxCategories);
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

        return module;
    }
);
