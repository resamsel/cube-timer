var core = require('../core.js');
var dao = require('../dao.js');
var I18n = require('../utils/i18n.js');
var misc = require('../utils/misc.js');
var Materialize = require('materialize-css');

core.register(
    'Achievement',
    function(sandbox) {
        var module = {};
        var defaultTimeout = 7000;
        var sleepBetweenToasts = 400;

        module.init = function() {
            sandbox.listen(
                ['result-created'],
                module.handleResultCreated,
                module
            );
        };

        module.handleResultCreated = function(event) {
            var result = event.data;
            dao.retrieveScores(sandbox.activeGame(), function(results) {
                var stats = sandbox.createStats(results);

                module.toastAchievement(result, stats);

                setTimeout(
                    function() {
                        module.toastMotivation(result, stats);
                    },
                    1*sleepBetweenToasts
                );

                setTimeout(
                    function() {
                        module.toastPercentile(result, stats);
                    },
                    2*sleepBetweenToasts
                );
            });
        };

        /*
         * Adds and toasts achievements
         */
        module.toastAchievement = function(result, stats) {
            // TODO: Add achievements

            // achievement-$game-best - new best == a single result has been recorded
            // achievement-$game-zerozero - XX:yy.00 has been recorded
            // achievement-$game-10 - 10 results have been recorded
            // achievement-$game-25 - 25 results have been recorded
            // achievement-$game-50 - 50 results have been recorded
            // achievement-$game-100 - 100 results have been recorded
            // achievement-$game-250 - 250 results have been recorded
            // achievement-$game-500 - 500 results have been recorded
            // achievement-$game-1000 - 1000 results have been recorded
            // achievement-$game-3-weekdays - results on 3 different weekdays
            // achievement-$game-5-weekdays - results on 5 different weekdays
            // achievement-$game-7-weekdays - results on all weekdays
            // achievement-$game-streak-3 - results on 3 consecutive days
            // achievement-$game-streak-5 - results on 5 consecutive days
            // achievement-$game-streak-7 - results on 7 consecutive days
            // achievement-$game-streak-10 - results on 10 consecutive days
            // achievement-$game-streak-25 - results on 25 consecutive days
            // achievement-$game-3-a-day - results on a single day
            // achievement-$game-5-a-day - results on a single day
            // achievement-$game-10-a-day - results on a single day
            // achievement-$game-25-a-day - results on a single day
            // achievement-$game-50-a-day - results on a single day
            // achievement-$game-3-categories - 3 different categories
            // achievement-$game-5-categories - 5 different categories
            // achievement-$game-10-categories - 10 different categories
            // achievement-$game-25-categories - 25 different categories
            // achievement-$game-50-categories - 50 different categories
        };

        module.toastMotivation = function(result, stats) {
            if(result.value <= stats.best) {
                Materialize.toast(
                    I18n.translate('achievement_best_all'),
                    defaultTimeout
                );
                return;
            }
            stats.latest50.sort(misc.compareNumbers);
            if(result.value <= stats.latest50.first()) {
                Materialize.toast(
                    I18n.translate('achievement_best_latest50'),
                    defaultTimeout
                );
                return;
            }
            stats.latest12.sort(misc.compareNumbers);
            if(result.value <= stats.latest12.first()) {
                Materialize.toast(
                    I18n.translate('achievement_best_latest12'),
                    defaultTimeout
                );
                return;
            }
            stats.latest5.sort(misc.compareNumbers);
            if(result.value <= stats.latest5.first()) {
                Materialize.toast(
                    I18n.translate('achievement_best_latest5'),
                    defaultTimeout
                );
                return;
            }
            if(result.value < stats.latest50.avg()) {
                Materialize.toast(
                    I18n.translate('achievement_better_avg50'),
                    defaultTimeout
                );
                return;
            }
            if(result.value < stats.avg) {
                Materialize.toast(
                    I18n.translate('achievement_better_avg'),
                    defaultTimeout
                );
                return;
            }
        };

        module.toastPercentile = function(result, stats) {
            var index = stats.values.binaryIndexOf(result.value);
            var normalized = Math.abs(index)/Math.max(stats.values.length-1, 1);
            var percent = Math.round(100-(normalized)*100);
            Materialize.toast(
                I18n.translate('achievement_better_than', [percent]),
                defaultTimeout
            );
        };

        return module;
    }
);
