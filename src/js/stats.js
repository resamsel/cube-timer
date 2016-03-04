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

function createStats(scores) {
    var stats = {
        scores: scores,
        categories: {}
    };

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
}

function updateCategories(stats) {
    var container = $('#subs'), e;
    container.find('.sub').remove();
    if(stats.scores[0].id !== 0) {
        Object
            .keys(stats.categories)
            .sort(compareNumbers)
            .slice(0, config.maxCategories)
            .forEach(function(category) {
                e = $('#subs .template').clone();
                e.removeClass('template');

                e.attr('id', 'subs-' + category)
                    .addClass('sub')
                    .find('.label')
                    .html('sub ' + category);
                e.find('.value').html(stats.categories[category]);
                container.append(e);
            });
    }
}

function updateStats() {
    console.log('Active game: ' + config.activeGame);
    retrieveScores(config.activeGame, function(scores) {
        if (scores.length < 1) {
            scores.push({id: 0, value: 0});
        }

        var stats = createStats(scores);

        updateChart(stats);
        updateCategories(stats);

        Object.keys(config.stats).forEach(function (stat) {
            updateStat(stat, config.stats[stat](stats));
        });
    });
}

function updateStat(key, value) {
    $('#stats-' + key + ' .value')
        .text(defaultFormatMilliseconds(value));
}
