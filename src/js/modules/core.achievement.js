const core = require('../core.js');
const dao = require('../dao.js');
const I18n = require('../utils/i18n.js');
const misc = require('../utils/misc');
const Materialize = require('materialize-css');

core.register(
  'Achievement',
  function(sandbox) {
    var module = {};
    var defaultTimeout = 7000;
    var sleepBetweenToasts = 400;

    module.results = [];
    module.consumeNext = false;

    module.init = function() {
      sandbox.listen(
        ['puzzle-changed'],
        module.handlePuzzleChanged,
        module
      );
      sandbox.listen(
        ['stopwatch-stopped'],
        module.handleStopwatchStopped,
        module
      );
    };

    module.handlePuzzleChanged = function(event) {
      module.results = [];
      module.consumeNext = false;

      dao.unlisten(['score-added'], module.handleScoreAdded);
      dao.unlisten(['score-removed'], module.handleScoreRemoved);

      dao.listen(
        ['score-added'],
        sandbox.activePuzzle(),
        module.handleScoreAdded
      );
      dao.listen(
        ['score-removed'],
        sandbox.activePuzzle(),
        module.handleScoreRemoved
      );
    };

    module.handleScoreAdded = function(score) {
      module.results.push(score);
      if (module.consumeNext) {
        module.showAchievement(score);
        module.consumeNext = false;
      }
    };

    module.handleScoreRemoved = function(score) {
      module.results = module.results.filter(function(result) {
        return result.timestamp != score.timestamp;
      });
    };

    module.handleStopwatchStopped = function(event) {
      module.consumeNext = true;
    };

    module.showAchievement = function(score) {
      var stats = sandbox.createStats(module.results);

      module.toastAchievement(score, stats);

      setTimeout(
        function() {
          module.toastMotivation(score, stats);
        },
        1 * sleepBetweenToasts
      );

      setTimeout(
        function() {
          module.toastPercentile(score, stats);
        },
        2 * sleepBetweenToasts
      );
    };

    /*
     * Adds and toasts achievements
     */
    module.toastAchievement = function(score, stats) {
      // TODO: Add achievements

      // achievement-$puzzle-best - new best == a single result has been recorded
      // achievement-$puzzle-zerozero - XX:yy.00 has been recorded
      // achievement-$puzzle-10 - 10 results have been recorded
      // achievement-$puzzle-25 - 25 results have been recorded
      // achievement-$puzzle-50 - 50 results have been recorded
      // achievement-$puzzle-100 - 100 results have been recorded
      // achievement-$puzzle-250 - 250 results have been recorded
      // achievement-$puzzle-500 - 500 results have been recorded
      // achievement-$puzzle-1000 - 1000 results have been recorded
      // achievement-$puzzle-3-weekdays - results on 3 different weekdays
      // achievement-$puzzle-5-weekdays - results on 5 different weekdays
      // achievement-$puzzle-7-weekdays - results on all weekdays
      // achievement-$puzzle-streak-3 - results on 3 consecutive days
      // achievement-$puzzle-streak-5 - results on 5 consecutive days
      // achievement-$puzzle-streak-7 - results on 7 consecutive days
      // achievement-$puzzle-streak-10 - results on 10 consecutive days
      // achievement-$puzzle-streak-25 - results on 25 consecutive days
      // achievement-$puzzle-3-a-day - results on a single day
      // achievement-$puzzle-5-a-day - results on a single day
      // achievement-$puzzle-10-a-day - results on a single day
      // achievement-$puzzle-25-a-day - results on a single day
      // achievement-$puzzle-50-a-day - results on a single day
      // achievement-$puzzle-3-categories - 3 different categories
      // achievement-$puzzle-5-categories - 5 different categories
      // achievement-$puzzle-10-categories - 10 different categories
      // achievement-$puzzle-25-categories - 25 different categories
      // achievement-$puzzle-50-categories - 50 different categories
    };

    module.toastMotivation = function(score, stats) {
      if (score.value <= stats.best) {
        Materialize.toast(
          I18n.translate('achievement_best_all'),
          defaultTimeout
        );
        return;
      }
      stats.latest50.sort(misc.compareNumbers);
      if (score.value <= stats.latest50.first()) {
        Materialize.toast(
          I18n.translate('achievement_best_latest50'),
          defaultTimeout
        );
        return;
      }
      stats.latest12.sort(misc.compareNumbers);
      if (score.value <= stats.latest12.first()) {
        Materialize.toast(
          I18n.translate('achievement_best_latest12'),
          defaultTimeout
        );
        return;
      }
      stats.latest5.sort(misc.compareNumbers);
      if (score.value <= stats.latest5.first()) {
        Materialize.toast(
          I18n.translate('achievement_best_latest5'),
          defaultTimeout
        );
        return;
      }
      if (score.value < stats.latest50.avg()) {
        Materialize.toast(
          I18n.translate('achievement_better_avg50'),
          defaultTimeout
        );
        return;
      }
      if (score.value < stats.avg) {
        Materialize.toast(
          I18n.translate('achievement_better_avg'),
          defaultTimeout
        );
        return;
      }
    };

    module.toastPercentile = function(score, stats) {
      var index = stats.values.binaryIndexOf(score.value);
      var normalized = Math.abs(index) / Math.max(stats.values.length - 1, 1);
      var percent = Math.round(100 - (normalized) * 100);
      Materialize.toast(
        I18n.translate('achievement_better_than', [percent]),
        defaultTimeout
      );
    };

    return module;
  }
);
