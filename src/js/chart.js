function statsChart(results) {
    if(results.length < 1) {
        results = [{id:0, value:0}];
    }
    var values = results.map(scoreValue);
    var averages5 = movingAverage(values, 5);
    var averages12 = movingAverage(values, 12);
    var averages50 = movingAverage(values, 50);
    var best = movingMinimum(values);
    console.log(
        'values=%s, averages12=%s, averages50=%s, best=%s',
        values, averages12, averages50, best
    );
    var data = {
        // A labels array that can contain any sort of values
        labels: results.map(scoreKey),
        // Our series array that contains series objects or in this case series data arrays
        series: [
            values, averages12, averages50, best
        ]
    };

    var options = {
        // Don't draw the line chart points
        showPoint: results.length == 1 && results[0].value !== 0,
        // X-Axis specific configuration
        axisX: {
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
            labelInterpolationFnc: defaultFormatMilliseconds
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
                ]
            })
        ]
    };

    // Create a new line chart object where as first parameter we pass in a selector
    // that is resolving to our chart container element. The Second parameter
    // is the actual data object.
    var container = $('#ct-stats');
    var chart = container.data('chartist');
    if(chart) {
        console.log('Updating chart with data');
        //chart.update(data, options);
        chart.detach();
        $('#ct-stats *').remove();
    }
    if(values.length > 0) {
        container.data(
            'chartist',
            new Chartist.Line('#ct-stats', data, options)
        );
    }
}
