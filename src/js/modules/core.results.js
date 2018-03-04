import Module from './core.module';
import routes from '../utils/routes';
import {
  sortScores,
  defaultFormatMilliseconds,
  hourMinuteFormatMilliseconds,
  toDate,
  toIsoDate,
  toGroupedDate,
  updateWithTime,
  scoreValue,
  scoreKey,
  daysBetween
} from '../utils/misc';
import {
  movingAverage,
  movingMinimum
} from '../utils/stats';
import Debounce from 'debounce-decorator';
import I18nUtils from '../utils/i18n';
import Chartist from 'chartist';
import moment from 'moment';
import _ from 'underscore';
import 'chartist-plugin-legend';

var dao = require('../dao');
var Category = require('../utils/category');
var $ = require('jquery');

import '../../css/core.results.css';

export default class Results extends Module {
  constructor(sandbox) {
    super(Results.id, sandbox);

    this.results = [];
    this.subtext = false;
    this.timeout = undefined;
    this.repaint = true;

    this.$loading = null;
    this.$resultsButton = null;
    this.$scoresContent = null;
    this.$scoreTemplate = null;
    this.$noResults = null;
    this.timelineContainer = null;
    this.$timeline = null;
  }

  init() {
    this.$loading = $('.page-results .loading');
    this.$resultsButton = $('.results-button');
    this.$contents = $('#results-content');
    this.$scoresContent = $('#results-content .times-content');
    this.$scoreTemplate = $('#results-content .template.result-container');
    this.$noResults = $('.page-results .empty');
    this.timelineContainer = document.querySelector('.card-timeline');
    this.$timeline = document.getElementById('ct-timeline');

    const self = this;
    this.timeout = setTimeout(function() {
      self.$loading.hide();
      self.$noResults.fadeIn();
    }, 2000);

    this.listen(['page-changed'], this.handlePageChanged);
    this.listen(['puzzle-changed'], this.handlePuzzleChanged);
    this.subscribe();

    this.$resultsButton
      .attr('href', routes.encode(this.sandbox.activePuzzle(), 'results'))
      .show();
    this.$noResults.hide();
  }

  subscribe() {
    dao.unsubscribe('score-added', this.handleScoreAdded);
    dao.unsubscribe('score-removed', this.handleScoreRemoved);
    dao.unsubscribe('config-changed', this.handleSubtextChanged);

    var puzzle = this.sandbox.activePuzzle();
    dao.subscribe(
      'score-added',
      puzzle,
      this.handleScoreAdded,
      this
    );
    dao.subscribe(
      'score-removed',
      puzzle,
      this.handleScoreRemoved,
      this
    );
    dao.subscribe(
      'config-changed',
      'subtext',
      this.handleSubtextChanged,
      this
    );
  }

  handlePageChanged(event) {
    if (event.data == 'results') {
      this.$resultsButton.parent().addClass('active');
      this.updateChart(this.sandbox.createStats(this.results));
    } else {
      this.$resultsButton.parent().removeClass('active');
    }
  }

  handlePuzzleChanged(event) {
    this.cleanResults();
    this.$loading.fadeIn();

    this.$resultsButton.attr(
      'href',
      routes.encode(event.data, 'results')
    );

    this.results = [];
    this.repaint = true;

    this.subscribe();

    this.handleResultsChanged();
  }

  @Debounce(250)
  handleResultsChanged() {
    sortScores(this.results);
    this.updateResults(this.sandbox.activePuzzle());
    this.updateChart(this.sandbox.createStats(this.results));
  }

  handleScoreAdded(score) {
    if (typeof this.timeout !== 'undefined') {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }

    this.results.push(score);
    this.repaint = true;
    this.handleResultsChanged();
  }

  handleScoreRemoved(score) {
    this.results = this.results.filter(function(result) {
      return result.timestamp != score.timestamp;
    });
    this.repaint = true;
    const self = this;
    $('#id-' + score.timestamp).fadeOut({
      complete: function(a) {
        var $this = $(this);
        if ($this.parent().children().length < 2) {
          $this.parent().prev().remove();
          $this.parent().remove();
        }
        $this.remove();
        self.update();
      }
    });
  }

  handleSubtextChanged(value) {
    this.subtext = value;
  }

  removeResult(el) {
    const element = $(el);
    const puzzle = element.data('puzzle');
    const score = element.data('score');
    dao.removeScore(puzzle, score);
  }

  createContainer() {
    const container = this.$scoreTemplate.clone().removeClass('template');
    this.$scoresContent.append(container);
    return container;
  }

  createResult(score, index) {
    const row = $('#results-content .template.result-item').clone();
    const self = this;

    row.attr('id', 'id-' + score.timestamp).removeClass('template');
    row
      .find('.value')
      .text(defaultFormatMilliseconds(score.value));
    row
      .find('.date')
      .text(toDate(score.timestamp)).data('date', score.timestamp);
    row
      .find('.delete')
      .data('puzzle', this.sandbox.activePuzzle())
      .data('score', score)
      .on('click', function(event) {
        self.removeResult(this);
      });

    return row;
  }

  createDate(date) {
    const element = $('#results-content .template.result-header')
      .clone()
      .removeClass('template')
      .attr('datetime', toIsoDate(date))
      .html(toGroupedDate(date));
    var firstChar = element.html().substring(0, 1);
    if (firstChar == firstChar.toLowerCase()) {
      // The content was not translated, so add the i18n-key attribute
      // to translate it later
      element.attr('i18n-key', element.html());
    }
    return element;
  }

  cleanResults() {
    $('#results-content .times-content > *').remove();
    this.$noResults.hide();
    this.$contents.hide();
  }

  @Debounce(250)
  updateResults() {
    this.cleanResults();
    this.$loading.hide();

    let result;
    var latestDate = '',
      date;
    var container;
    var previous;

    if (this.results.length < 1) {
      this.$noResults.fadeIn();
      return;
    }

    const self = this;
    this.results.slice().reverse().forEach(function(result, i) {
      date = toGroupedDate(result.timestamp);
      if (date !== latestDate) {
        self.$scoresContent.append(self.createDate(result.timestamp));
        container = self.createContainer();
        latestDate = date;
      }
      container.append(
        self.createResult(result, i + 1)
      );
    });
    this.update();
    this.$contents.show();
  }

  @Debounce(250)
  update() {
    this.updateDates();
    this.updateIndices();
    this.updateLabels();
  }

  updateDates() {
    this.results.forEach(function(result, index) {
      updateWithTime(
        $('#id-' + result.timestamp + ' time'),
        new Date(result.timestamp)
      );
    });
    $('#results-content .times-content > * .date').each(function() {
      const $this = $(this);
      $this.text(toDate($this.data('date')));
    });
  }

  updateIndices() {
    this.results.forEach(function(result, index) {
      $('#id-' + result.timestamp + ' .index').text('#' + (index + 1));
    });
  }

  mark(result, text, type_) {
    $('#id-' + result.timestamp + ' .tags')
      .append(' <span class="label label-' + type_ + '">' + text + '</span>');
  }

  updateLabels() {
    var result,
      best = {
        timestamp: 0,
        value: 999999999
      },
      best5 = {
        timestamp: 0,
        value: 999999999
      },
      best12 = {
        timestamp: 0,
        value: 999999999
      },
      sub;

    // Remove first
    $('#results-content .label').remove();

    let i = 0;
    this.results.forEach(result => {
      if (result.value < best.value) {
        best = result;
      }
      if ((this.results.length - i - 1) < 5 && result.value < best5.value) {
        best5 = result;
      }
      if ((this.results.length - i - 1) < 12 && result.value < best12.value) {
        best12 = result;
      }
      if (subtext) {
        sub = Category.fromValue(result.value);
        if (sub > 0) {
          this.mark(result, 'sub ' + sub, 'info');
        }
      }
      i++;
    });

    // Then mark
    this.mark(best, 'best', 'success');
    this.mark(best5, 'best of 5', 'success');
    this.mark(best12, 'best of 12', 'success');
  }

  updateChart(stats) {
    if (!this.repaint || this.sandbox.activePage() !== 'results') {
      return;
    }

    this.detachChart(this.$timeline);

    if (this.results.length > 0) {
      this.timelineContainer.show();
      const element = this.$timeline;
      element.fadeIn().then(() => {
        element.dataset.chartist = this.createTimeline(stats);
      });

      this.repaint = false;
    } else {
      this.timelineContainer.hide();
    }
  }

  detachChart(container) {
    if (typeof container === 'undefined') {
      return;
    }
    const chart = container.dataset.chartist;
    if (chart) {
      while (container.hasChildNodes()) {
        container.removeChild(container.lastChild);
      }
    }
  }

  createTimeline(statistics) {
    const d = _.groupBy(statistics.scores, score => new Date(score.timestamp).setHours(0, 0, 0, 0));
    const dates = Object.keys(d).map(key => new Date(parseInt(key)));
    const labels = dates.length > 0 ? daysBetween(dates[0], dates[dates.length - 1]) : [];
    const series = labels.map(date => (date.getTime() in d) ? d[date.getTime()].length : 0);
    console.log('labels', labels);
    console.log('series', series);

    return new Chartist.Bar('#ct-timeline', {
      labels,
      series: [series]
    }, {
      high: 10,
      axisX: {
        // type: Chartist.FixedScaleAxis,
        divisor: 5,
        labelInterpolationFnc: function(value, index) {
          const dist = Math.max(parseInt(labels.length / 5), 1);
          return index % dist === 0 ? moment(value).format('MMM D Y') : null;
        }
      },
      axisY: {
        onlyInteger: true
      }
    }).on('draw', function(data) {
      const width = $('#ct-timeline').width() - 100;
      if (data.type === 'bar') {
        data.element.attr({
          style: `stroke-width: ${Math.max(Math.min(width/labels.length, 10), 1)}px`
        });
      }
    });
  }
}
