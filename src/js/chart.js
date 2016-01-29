function statsChart(results) {
    var values = results.map(scoreValue);
    var averages5 = movingAverage(values, 5);
    var averages10 = movingAverage(values, 25);
    var data = {
        // A labels array that can contain any sort of values
        labels: results.map(scoreKey),
        // Our series array that contains series objects or in this case series data arrays
        series: [
            values, averages5, averages10
        ]
    };

    var options = {
        // Don't draw the line chart points
        showPoint: results.length <= 1,
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
                legendNames: ['Times', 'Average #5', 'Average #25']
            })
        ]
    };

    // Create a new line chart object where as first parameter we pass in a selector
    // that is resolving to our chart container element. The Second parameter
    // is the actual data object.
    var container = $('#ct-stats');
    var chart = container.data('chartist');
    if(chart) {
        chart.update(data, options);
    } else {
        container.data('chartist', new Chartist.Line('#ct-stats', data, options));
    }
}
