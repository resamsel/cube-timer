var misc = require('./utils/misc.js');
var Category = require('./utils/category.js');

module.exports = function(core) {
    this.core = core;
    this.notify = function(event) {
        core.notify(event);
    };
    this.listen = function(types, handler, module) {
        core.listen(types, handler, module);
    };
    this.activeGame = function(game) {
        return core.activeGame(game);
    };
    this.createStats = function(scores) {
        var stats = {
            scores: scores
        };

        if(stats.scores.length < 1) {
            stats.scores = [{id: 0, value: 0}];
        }

        stats.values = scores.map(misc.scoreValue);
        stats.latest = stats.values.last();
        stats.latest5 = stats.values.slice(-5).sort(misc.compareNumbers);
        stats.latest12 = stats.values.slice(-12).sort(misc.compareNumbers);
        stats.latest50 = stats.values.slice(-50).sort(misc.compareNumbers);
        stats.best3of5 = stats.latest5.slice(0, 3).sort(misc.compareNumbers);
        stats.best10of12 = stats.latest12.slice(0, 10).sort(misc.compareNumbers);

        stats.values.sort(misc.compareNumbers);

        stats.best = stats.values.first();
        stats.avg = stats.values.avg();
        stats.avg80 = stats.values.slice(
            0,
            Math.max(1, Math.floor(scores.length*0.8))
        );

        stats.categories = this.createCategories(stats.values);

        return stats;
    };
    this.createCategories = function(values) {
        var categories = {};

        values.forEach(function(value) {
            var category = Category.fromValue(value);
            if (!(category in categories)) {
                categories[category] = 0;
            }
            categories[category]++;
        });

        return categories;
    };
};