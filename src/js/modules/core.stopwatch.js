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

        module.init = function() {
            sandbox.listen(
                ['game-changed'],
                module.handleGameChanged,
                module
            );
            $('body')
                .on('keydown', module.handleSpaceDown)
                .on('keyup', module.handleSpaceUp);
            $('button.start-stop').on('click', module.toggleTimer);
            $('.card-timer').css('display', 'block');
            $('.timer-button').on('click', function(e) {
                sandbox.goToPage('timer');
            });

            // pre-load sound
            timerSound = new Audio('audio/timer.mp3');
            startSound = new Audio('audio/start.mp3');
            timerSound.load();
            startSound.load();

            if(window.location.hash == '#timer') {
                sandbox.goToPage('timer');
            }
        };

        module.handleGameChanged = function(event) {
            $('.card-timer .card-title > span').text(event.data);
        };

        /*
         * Handlers
         */
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
            dao.getConfig('inspectionTime', 0, function(inspectionTime) {
                if(inspectionTime > 0) {
                    module.startCountdown(inspectionTime);
                } else {
                    module.startTimer();
                }
            });
            sandbox.notify({
                type: 'stopwatch-started',
                data: null
            });
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
                var result ={ id: new Date().getTime(), value: elapsed };
                dao.storeScore(
                    sandbox.activeGame(),
                    result,
                    function() {
                        sandbox.notify({
                            type: 'result-created',
                            data: result
                        });
                        sandbox.notify({
                            type: 'results-changed',
                            data: sandbox.activeGame()
                        });
                    }
                );
            }
            $('body').removeClass('started').addClass('stopped');
        };

        module.toggleTimer = function() {
            if($('body').hasClass('started')) {
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
                dao.getConfig('soundAfterInspection', false, function(soundAfterInspection) {
                    if(soundAfterInspection) {
                        timerSound.load();
                        timerSound.play();
                    }
                });
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
            dao.getConfig('inspectionTime', 0, function(inspectionTime) {
                dao.getConfig('soundAfterInspection', false, function(soundAfterInspection) {
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
                });
            });
        };

        return module;
    }
);
