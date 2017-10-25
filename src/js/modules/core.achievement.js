import Module from './core.module';
import I18nUtils from '../utils/i18n';
import { compareNumbers } from '../utils/misc';
import { toast } from 'materialize-css';

const dao = require('../dao');

export default class Achievement extends Module {
  static get id() {
    return 'Achievement';
  }

  constructor(sandbox) {
    super(Achievement.id, sandbox);

    this.defaultTimeout = 7000;
    this.sleepBetweenToasts = 400;
    this.results = [];
    this.consumeNext = false;
  }

  init() {
    this.listen(['puzzle-changed'], this.handlePuzzleChanged);
    this.listen(['stopwatch-stopped'], this.handleStopwatchStopped);
  }

  handlePuzzleChanged(event) {
    this.results = [];
    this.consumeNext = false;

    dao.unsubscribe(['score-added'], this.handleScoreAdded);
    dao.unsubscribe(['score-removed'], this.handleScoreRemoved);

    dao.subscribe(
      ['score-added'],
      this.sandbox.activePuzzle(),
      this.handleScoreAdded,
      this
    );
    dao.subscribe(
      ['score-removed'],
      this.sandbox.activePuzzle(),
      this.handleScoreRemoved,
      this
    );
  }

  handleScoreAdded(score) {
    this.results.push(score);
    if (this.consumeNext) {
      this.showAchievement(score);
      this.consumeNext = false;
    }
  }

  handleScoreRemoved(score) {
    this.results = this.results.filter(function(result) {
      return result.timestamp != score.timestamp;
    });
  }

  handleStopwatchStopped(event) {
    console.debug('handleStopwatchStopped');
    this.consumeNext = true;
  }

  showAchievement(score) {
    var stats = this.sandbox.createStats(this.results);

    this.toastAchievement(score, stats);

    const self = this;
    setTimeout(
      function() {
        self.toastMotivation(score, stats);
      },
      1 * this.sleepBetweenToasts
    );

    setTimeout(
      function() {
        self.toastPercentile(score, stats);
      },
      2 * this.sleepBetweenToasts
    );
  }

  /*
   * Adds and toasts achievements
   */
  toastAchievement(score, stats) {
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
  }

  toastMotivation(score, stats) {
    if (score.value <= stats.best) {
      toast(
        I18nUtils.translate('achievement_best_all'),
        this.defaultTimeout
      );
      return;
    }
    stats.latest50.sort(compareNumbers);
    if (score.value <= stats.latest50.first()) {
      toast(
        I18nUtils.translate('achievement_best_latest50'),
        this.defaultTimeout
      );
      return;
    }
    stats.latest12.sort(compareNumbers);
    if (score.value <= stats.latest12.first()) {
      toast(
        I18nUtils.translate('achievement_best_latest12'),
        this.defaultTimeout
      );
      return;
    }
    stats.latest5.sort(compareNumbers);
    if (score.value <= stats.latest5.first()) {
      toast(
        I18nUtils.translate('achievement_best_latest5'),
        this.defaultTimeout
      );
      return;
    }
    if (score.value < stats.latest50.avg()) {
      toast(
        I18nUtils.translate('achievement_better_avg50'),
        this.defaultTimeout
      );
      return;
    }
    if (score.value < stats.avg) {
      toast(
        I18nUtils.translate('achievement_better_avg'),
        this.defaultTimeout
      );
      return;
    }
  }

  toastPercentile(score, stats) {
    var index = stats.values.binaryIndexOf(score.value);
    var normalized = Math.abs(index) / Math.max(stats.values.length - 1, 1);
    var percent = Math.round(100 - (normalized) * 100);
    toast(
      I18nUtils.translate('achievement_better_than', [percent]),
      this.defaultTimeout
    );
  }
}
