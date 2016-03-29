var stats = {};

stats.identity = function(v) {
    return v;
};

stats.addition = function(a, b) {
    return a + b;
};

stats.average = function(data, mapper) {
    if (typeof(mapper) === 'undefined') {
        mapper = stats.identity;
    }

    var sum = data.map(mapper).reduce(stats.addition, 0);

    return sum / data.length;
};

stats.median = function(data, mapper) {
    if (typeof(mapper) === 'undefined') {
        mapper = stats.identity;
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
};

stats.standardDeviation = function(data, mapper) {
    if (typeof(mapper) === 'undefined') {
        mapper = stats.identity;
    }

    var avg = stats.average(data, mapper);

    var squareDiffs = data.map(mapper).map(function(value) {
        var diff = value - avg;
        var sqrDiff = diff * diff;
        return sqrDiff;
    });

    var avgSquareDiff = stats.average(squareDiffs);

    return Math.sqrt(avgSquareDiff);
};

stats.movingAverage = function(data, size) {
    var avg = [];
    for (var i = 0; i < data.length; i++) {
        avg.push(stats.average(data.slice(Math.max(i - size, 0), i+1)));
    }
    return avg;
};

stats.movingMinimum = function(data) {
    var minimum = [];
    for (var i = 0; i < data.length; i++) {
        minimum.push(Math.min(minimum.last(999999999), data[i]));
    }
    return minimum;
};

module.exports = stats;