var core = require('../core.js');
var dao = require('../dao.js');
var misc = require('../utils/misc.js');
var Stopwatch = require('timer-stopwatch');
//var $ = require('jquery');

core.register(
	'Stopwatch',
	function(sandbox) {
		var count, counter, beep;
		var module = {};
		var timerSound;
		var startSound;
		var inspectionTime = 0;
		var soundAfterInspection = false;
		var $body;

		module.init = function() {
			sandbox.listen(
				['puzzle-changed'],
				module.handlePuzzleChanged,
				module
			);
			sandbox.listen(
				['page-changed'],
				module.handlePageChanged,
				module
			);
			dao.listen(
				['config-changed'],
				'inspectionTime',
				module.handleInspectionTimeChanged
			);
			dao.listen(
				['config-changed'],
				'soundAfterInspection',
				module.handleSoundAfterInspectionChanged
			);

			$body = $('body');

			$('button.start-stop').on('click', module.toggleTimer);
			$('.card-timer').css('display', 'block');
			$('.timer-button')
				.attr('href', '#!'+misc.encodeKey(sandbox.activePuzzle())+'/timer');

			// pre-load sound
			timerSound = new Audio('audio/timer.mp3');
			startSound = new Audio('audio/start.mp3');
			timerSound.load();
			startSound.load();
		};

		/*
		* Handlers
		*/
		module.handlePuzzleChanged = function(event) {
			var puzzle = event.data;
			$('.card-timer .card-title > span').text(puzzle);
			$('.timer-button').attr('href', '#!'+misc.encodeKey(puzzle)+'/timer');
		};

		module.handlePageChanged = function(event) {
			if(event.data == 'timer') {
				$body
					.on('keydown', module.handleSpaceDown)
					.on('keyup', module.handleSpaceUp);
				$('.timer-button').parent().addClass('active');
			} else {
				$body.off('keydown').off('keyup');
				$('.timer-button').parent().removeClass('active');
			}
		};

		module.handleInspectionTimeChanged = function(value) {
			inspectionTime = value;
		};

		module.handleSoundAfterInspectionChanged = function(value) {
			soundAfterInspection = value;
		};

		module.handleSpaceDown = function(event) {
			if(event.keyCode == 32 && event.target == document.body) {
				event.preventDefault();
				return false;
			}
		};
		module.handleSpaceUp = function(event) {
			if(event.keyCode == 32 && event.target == document.body) {
				event.preventDefault();
				module.toggleTimer();
			}
		};

		module.handleStart = function() {
			$('body').removeClass('stopped').addClass('started');
			if(inspectionTime > 0) {
				module.startCountdown(inspectionTime);
			} else {
				module.startTimer();
			}
		};

		module.handleStop = function() {
			var elapsed = 0;
			clearInterval(counter);
			if(typeof module.stopwatch !== 'undefined') {
				module.stopwatch.stop();
				elapsed = module.stopwatch.ms;
			}
			if(elapsed > 0) {
				// Only use values when stopwatch actually started
				sandbox.notify({type: 'stopwatch-stopped', data: null});
				dao.storeScore(
					sandbox.activePuzzle(),
					{
						timestamp: new Date().getTime(),
						value: elapsed
					}
				);
			}
			$body.removeClass('started').addClass('stopped');
		};

		module.toggleTimer = function() {
			if($body.hasClass('started')) {
				module.handleStop();
			} else {
				module.handleStart();
			}
		};

		module.countdownTimer = function() {
			count = count-1;
			if (count <= 0)
			{
				clearInterval(counter);
				module.startTimer();
				return;
			}
			module.updateCountdown(count);
		};

			// Code for showing the number of seconds
		module.updateCountdown = function(currentCount) {
			if(count <= 3) {
				if(soundAfterInspection) {
					timerSound.load();
					timerSound.play();
				}
			}
			$('#timer-display').text(count);
		};

		module.startCountdown = function(inspectionTime) {
			count = inspectionTime;
			counter = setInterval(module.countdownTimer, 1000);
			module.updateCountdown(count);
		};

		module.startTimer = function() {
			var timerConfig = {
				refreshRateMS: 31 // prime number
			};
			if(inspectionTime > 0 && soundAfterInspection) {
				startSound.load();
				startSound.play();
			}
			if(typeof module.stopwatch !== 'undefined') {
				module.stopwatch.stop();
			}
			module.stopwatch = new Stopwatch(timerConfig);
			module.stopwatch
				.onTime(function(time) {
					$('#timer-display')
						.html(misc.defaultFormatMilliseconds(time.ms));
				})
				.start();
		};

		return module;
	}
);
