import Module from './core.module';
import Debounce from 'debounce-decorator';
import {
  sortScores,
  scoreValue,
  scoreKey,
  hourMinuteFormatMilliseconds
} from '../utils/misc';
import {
  movingAverage,
  movingMinimum
} from '../utils/stats';
import Chartist from 'chartist';
import 'chartist-plugin-legend';
import I18nUtils from '../utils/i18n';
import '../../css/core.chart.css';

var dao = require('../dao');

export default class Chart extends Module {
  static get id() {
    return 'Chart';
  }

  constructor(sandbox) {
    super(Chart.id, sandbox);

    this.maxCategories = 7;
    this.windowSize = 50;
    this.$results = null;
    this.$categories = null;
    this.$weekdays = null;

    this.repaint = true;
    this.results = [];
  }

  init() {
    this.$results = document.getElementById('ct-stats');
    this.$categories = document.getElementById('ct-categories');
    this.$weekdays = document.getElementById('ct-weekdays');

    this.listen(['puzzle-changed'], this.handlePuzzleChanged);
    this.listen(['page-changed'], this.handlePageChanged);
    this.listenDatabase();

    document.querySelectorAll('.card-stats').forEach(el => {
      el.style.display = 'block';
    });
  }

  @Debounce(250)
  handleResultsChanged(event) {
    // FIXME: move createStats to utils
    this.updateChart(this.sandbox.createStats(this.results));
  }

  handlePuzzleChanged(event) {
    this.results = [];
    this.repaint = true;

    this.listenDatabase();

    this.handleResultsChanged({
      data: this.sandbox.activePuzzle()
    });
  }

  listenDatabase() {
    dao.unsubscribe(['score-added'], this.handleScoreAdded);
    dao.unsubscribe(['score-removed'], this.handleScoreRemoved);
    dao.unsubscribe(['config-changed'], this.handleWindowSizeChanged);

    var puzzle = this.sandbox.activePuzzle();
    dao.subscribe(
      ['score-added'],
      puzzle,
      this.handleScoreAdded,
      this
    );
    dao.subscribe(
      ['score-removed'],
      puzzle,
      this.handleScoreRemoved,
      this
    );
    dao.subscribe(
      ['config-changed'],
      'windowSize',
      this.handleWindowSizeChanged,
      this
    );
  }

  handleScoreAdded(score) {
    this.results.push(score);
    sortScores(this.results);
    this.repaint = true;
    this.handleResultsChanged({
      data: this.sandbox.activePuzzle()
    });
  }

  handleScoreRemoved(score) {
    this.results = this.results.filter(function(result) {
      return result.timestamp != score.timestamp;
    });
    this.repaint = true;
    this.handleResultsChanged({
      data: this.sandbox.activePuzzle()
    });
  }

  handleWindowSizeChanged(value) {
    if (value == null || typeof value === 'undefined') {
      value = 50;
    }
    this.windowSize = value;
    this.repaint = true;
    this.handleResultsChanged({
      data: this.sandbox.activePuzzle()
    });
  }

  handlePageChanged(event) {
    if (event.data == 'timer' && this.repaint) {
      this.handleResultsChanged({
        data: this.sandbox.activePuzzle()
      });
    }
  }

  updateChart(stats) {
    if (!this.repaint || this.sandbox.activePage() !== 'timer') {
      return;
    }

    this.detachChart(this.$results);
    this.detachChart(this.$categories);
    this.detachChart(this.$weekdays);

    this.$results.dataset.chartist = this.createScores(stats);
    this.$categories.dataset.chartist = this.createCategories(stats);
    this.$weekdays.dataset.chartist = this.createWeekdays(stats);

    if (stats.scores.length > 0) {
      $('#stats-categories').fadeIn();
      $('#stats-weekdays').fadeIn();
    } else {
      $('#stats-categories').hide();
      $('#stats-weekdays').hide();
    }

    this.repaint = false;
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

  createScores(statistics) {
    const values = statistics.scores.map(scoreValue);
    const averages5 = movingAverage(values, 5);
    const averages12 = movingAverage(values, 12);
    const averages = movingAverage(values, values.length);
    const best = movingMinimum(values);
    const len = values.length;
    let maxEntries = this.windowSize;
    if (maxEntries < 3 || maxEntries > len) {
      maxEntries = len;
    }
    const offset = Math.max(0, len - maxEntries);
    const data = {
      // A labels array that can contain any sort of values
      labels: statistics.scores.map(scoreKey).slice(offset, len).rpad(maxEntries, null),
      // Our series array that contains series objects or in this case series data arrays
      series: [
        values.slice(offset, len).rpad(maxEntries, null),
        averages5.slice(offset, len).rpad(maxEntries, null),
        averages12.slice(offset, len).rpad(maxEntries, null),
        averages.slice(offset, len).rpad(maxEntries, null),
        best.slice(offset, len).rpad(maxEntries, null)
      ]
    };

    const options = {
      // Don't draw the line chart points
      showPoint: statistics.scores.length == 1 && statistics.scores[0].value !== 0,
      // X-Axis specific configuration
      axisX: {
        offset: 0,
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
        labelInterpolationFnc: hourMinuteFormatMilliseconds
      },
      lineSmooth: Chartist.Interpolation.simple({
        divisor: 2
      }),
      plugins: [
        Chartist.plugins.legend({
          legendNames: [
            I18nUtils.translate('latest'),
            I18nUtils.translate('average5'),
            I18nUtils.translate('average12'),
            I18nUtils.translate('average'),
            I18nUtils.translate('best')
          ],
          clickable: false
        })
      ]
    };

    return new Chartist.Line('#ct-stats', data, options);
  }

  createCategories(stats) {
    if (!stats.scores || stats.scores.length < 1) {
      return null;
    }

    const len = stats.scores.length;
    let maxEntries = this.windowSize;
    if (maxEntries < 3 || maxEntries > len) {
      maxEntries = len;
    }
    const offset = Math.max(0, len - maxEntries);
    const values = stats.scores.slice(offset, len).map(scoreValue);
    // FIXME
    const categories = this.sandbox.createCategories(values);
    const series = Object.keys(categories).slice(0, this.maxCategories);
    const data = {
      series: series
        .map(function(key) {
          return categories[key];
        })
    };

    const options = {
      donut: true,
      donutWidth: 15,
      showLabel: false,
      showArea: false,
      plugins: [
        Chartist.plugins.legend({
          legendNames: series
            .map(function(key) {
              return 'sub ' + key;
            }),
          clickable: false
        })
      ]

    };

    return new Chartist.Pie('#ct-categories', data, options);
  }

  createWeekdays(stats) {
    if (!stats.scores || stats.scores.length < 1) {
      return null;
    }

    const series = [0, 0, 0, 0, 0, 0, 0];
    const len = stats.scores.length;
    let maxEntries = windowSize;
    if (maxEntries < 3 || maxEntries > len) {
      maxEntries = len;
    }
    const offset = Math.max(0, len - maxEntries);
    const values = stats.scores.slice(offset, len).map(scoreKey);
    values.forEach(function(key) {
      series[new Date(key).getDay()] += 1;
    });
    const shifted = series.shift();
    series.push(shifted);
    const data = {
      labels: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
      series: [series]
    };
    const options = {
      chartPadding: {
        bottom: 10
      },
      axisX: {
        offset: 15,
        showGrid: false
      },
      axisY: {
        showGrid: false
      }
    };

    return new Chartist.Bar('#ct-weekdays', data, options);
  }
}
