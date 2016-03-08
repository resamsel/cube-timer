function identity(v) {
    return v;
}

function addition(a, b) {
    return a + b;
}

function average(data, mapper) {
    if (typeof(mapper) === 'undefined') {
        mapper = identity;
    }

    var sum = data.map(mapper).reduce(addition, 0);

    return sum / data.length;
}

function median(data, mapper) {
    if (typeof(mapper) === 'undefined') {
        mapper = identity;
    }

    // map and sort the resulting array
    var m = data.map(mapper).sort(function(a, b) {
        return a - b;
    });

    var middle = Math.floor((m.length - 1) / 2);
    if (m.length % 2) {
        return m[middle];
    } else {
        return (m[middle] + m[middle + 1]) / 2.0;
    }
}

function standardDeviation(data, mapper) {
    if (typeof(mapper) === 'undefined') {
        mapper = identity;
    }

    var avg = average(data, mapper);

    var squareDiffs = data.map(mapper).map(function(value) {
        var diff = value - avg;
        var sqrDiff = diff * diff;
        return sqrDiff;
    });

    var avgSquareDiff = average(squareDiffs);

    return Math.sqrt(avgSquareDiff);
}

function movingAverage(data, size) {
    var avg = [];
    for (var i = 0; i < data.length; i++) {
        avg.push(average(data.slice(Math.max(i - size, 0), i+1)));
    }
    return avg;
}

function movingMinimum(data) {
    var minimum = [];
    for (var i = 0; i < data.length; i++) {
        minimum.push(Math.min(minimum.last(999999999), data[i]));
    }
    return minimum;
}
