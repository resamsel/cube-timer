import Module from './core.module';
import routes from '../utils/routes';

var dao = require('../dao');
var misc = require('../utils/misc');
var TimerStopwatch = require('timer-stopwatch');
var $ = require('jquery');

const timerSound = require('../../audio/timer.mp3')
const startSound = require('../../audio/start.mp3')

import '../../css/core.stopwatch.css';

export default class Stopwatch extends Module {
  static get id() {
    return 'Stopwatch';
  }

  constructor(sandbox) {
    super('Stopwatch', sandbox);

    this.count = null;
    this.counter = null;
    this.beep = null;
    this.module = {};
    this.timerSound;
    this.startSound;
    this.inspectionTime = 0;
    this.soundAfterInspection = false;
    this.$body = null;
  }

  init(sandbox) {
    this.listen(['puzzle-changed'], this.handlePuzzleChanged);
    this.listen(['page-changed'], this.handlePageChanged);
    dao.subscribe(
      ['config-changed'],
      'inspectionTime',
      this.handleInspectionTimeChanged,
      this
    );
    dao.subscribe(
      ['config-changed'],
      'soundAfterInspection',
      this.handleSoundAfterInspectionChanged,
      this
    );

    this.$body = $('body');

    $('button.start-stop').on('click', this.toggleTimer.bind(this));
    $('.card-timer').css('display', 'block');
    $('.timer-button')
      .attr('href', routes.encode(this.sandbox.activePuzzle(), 'timer'));

    // pre-load sound
    this.timerSound = new Audio(timerSound);
    this.startSound = new Audio(startSound);
    this.timerSound.load();
    this.startSound.load();

    this.resetTimer();
  }

  /*
   * Handlers
   */
  handlePuzzleChanged(event) {
    const puzzle = event.data;
    $('.card-timer .card-title > span').text(puzzle);
    $('.timer-button').attr('href', routes.encode(puzzle, 'timer'));
    this.resetTimer();
  }

  handlePageChanged(event) {
    if (event.data == 'timer') {
      this.$body
        .on('keydown', this.handleSpaceDown.bind(this))
        .on('keyup', this.handleSpaceUp.bind(this));
      $('.timer-button').parent().addClass('active');
    } else {
      this.$body.off('keydown').off('keyup');
      $('.timer-button').parent().removeClass('active');
    }
  }

  handleInspectionTimeChanged(value) {
    console.debug('handleInspectionTimeChanged(%s)', JSON.stringify(value));
    this.inspectionTime = value;
  }

  handleSoundAfterInspectionChanged(value) {
    this.soundAfterInspection = value;
  }

  handleSpaceDown(event) {
    if (event.keyCode == 32 && event.target == document.body) {
      event.preventDefault();
      return false;
    }
  }

  handleSpaceUp(event) {
    if (event.keyCode == 32 && event.target == document.body) {
      event.preventDefault();
      this.toggleTimer();
    }
  }

  handleStart() {
    this.$body.removeClass('stopped').addClass('started');
    if (this.inspectionTime > 0) {
      this.startCountdown(this.inspectionTime);
    } else {
      this.startTimer();
    }
  }

  handleStop() {
    var elapsed = 0;
    clearInterval(this.counter);
    if (typeof this.stopwatch !== 'undefined' && this.stopwatch !== null) {
      this.stopwatch.stop();
      elapsed = this.stopwatch.ms;
    }
    if (elapsed > 0) {
      // Only use values when stopwatch actually started
      this.notify({
        type: 'stopwatch-stopped',
        data: null
      });
      dao.storeScore(
        this.sandbox.activePuzzle(), {
          timestamp: new Date().getTime(),
          value: elapsed
        }
      );
    }
    this.resetTimer();
  }

  resetTimer() {
    this.$body.removeClass('started').addClass('stopped');
  }

  toggleTimer() {
    if (this.$body.hasClass('started')) {
      this.handleStop();
    } else {
      this.handleStart();
    }
  }

  countdownTimer() {
    this.count = this.count - 1;
    if (this.count <= 0) {
      clearInterval(this.counter);
      this.startTimer();
      return;
    }
    this.updateCountdown(this.count);
  }

  // Code for showing the number of seconds
  updateCountdown(currentCount) {
    if (this.count <= 3) {
      if (this.soundAfterInspection) {
        this.timerSound.load();
        this.timerSound.play();
      }
    }
    $('#timer-display').text(this.count);
  }

  startCountdown(inspectionTime) {
    this.count = inspectionTime;
    this.counter = setInterval(this.countdownTimer.bind(this), 1000);
    this.updateCountdown(this.count);
  }

  startTimer() {
    var timerConfig = {
      refreshRateMS: 31 // prime number
    };
    if (this.inspectionTime > 0 && this.soundAfterInspection) {
      this.startSound.load();
      this.startSound.play();
    }
    if (typeof this.stopwatch !== 'undefined' && this.stopwatch) {
      this.stopwatch.stop();
    }
    this.stopwatch = new TimerStopwatch(this.timerConfig);
    this.stopwatch
      .onTime(function(time) {
        $('#timer-display')
          .html(misc.defaultFormatMilliseconds(time.ms));
      })
      .start();
  }
}
