var config = {
    activeGame: '3x3x3',
    scrambles: {
        '2x2x2': { len: 15 },
        '3x3x3': { len: 25 }
    },

    categories: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
        11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        25, 30, 35, 40, 45, 50, 55, 60,
        70, 80, 60+30, 100, 110,
        2*60, 2*60+30, 3*60, 4*60, 5*60,
        6*60, 7*60, 8*60, 9*60, 10*60,
        12*60, 15*60, 20*60, 30*60, 40*60, 50*60, 60*60
    ],
    maxCategories: 5,

    stats: {
        'best': function(stats) {
            return stats.values[0];
        },
        'best5': function(stats) {
            return stats.last5[0];
        },
        'best12': function(stats) {
            return stats.last12[0];
        },
        'worst': function(stats) {
            return stats.values.last(0);
        },
        'worst5': function(stats) {
            return stats.last5.last(0);
        },
        'worst12': function(stats) {
            return stats.last12.last(0);
        },
        'best80': function(stats) {
            return stats.avg80[0];
        },
        'best3of5': function(stats) {
            return stats.best3of5[0];
        },
        'best10of12': function(stats) {
            return stats.best10of12[0];
        },
        'stddev': function(stats) {
            return standardDeviation(stats.scores, scoreValue);
        },
        'stddev5': function(stats) {
            return standardDeviation(stats.last5);
        },
        'stddev12': function(stats) {
            return standardDeviation(stats.last12);
        },
        'stddev80': function(stats) {
            return standardDeviation(stats.avg80);
        },
        'stddev3of5': function(stats) {
            return standardDeviation(stats.best3of5);
        },
        'stddev10of12': function(stats) {
            return standardDeviation(stats.best10of12);
        },
        'average': function(stats) {
            return average(stats.scores, scoreValue);
        },
        'average5': function(stats) {
            return average(stats.last5);
        },
        'average12': function(stats) {
            return average(stats.last12);
        },
        'average80': function(stats) {
            return average(stats.avg80);
        },
        'average3of5': function(stats) {
            return average(stats.best3of5);
        },
        'average10of12': function(stats) {
            return average(stats.best10of12);
        },
        'median': function(stats) {
            return median(stats.scores, scoreValue);
        },
        'median5': function(stats) {
            return median(stats.last5);
        },
        'median12': function(stats) {
            return median(stats.last12);
        },
        'median80': function(stats) {
            return median(stats.avg80);
        },
        'median3of5': function(stats) {
            return median(stats.best3of5);
        },
        'median10of12': function(stats) {
            return median(stats.best10of12);
        },
        'latest': function(stats) {
            return stats.last;
        },
    },
};