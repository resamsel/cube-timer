Core.register(
    "stopwatch",
    function(sandbox) {
        var count, counter, beep;
        var module = {};
        var timerSound;
        var startSound;

        module.init = function() {
            $('body')
                .bind('keydown', module.handleSpaceDown)
                .bind('keyup', module.handleSpaceUp);
            $('button.start-stop').bind('click', module.handleStart);

            // pre-load sound
            timerSound = new Audio('audio/timer.mp3');
            startSound = new Audio('audio/start.mp3');
            timerSound.load();
            startSound.load();
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
            getConfig('inspectionTime', 0, function(inspectionTime) {
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
            var sw, elapsed;
            clearInterval(counter);
            sw = $('#timer').stopwatch();
            sw.stopwatch('stop');
            elapsed = sw.data('stopwatch').elapsed;
            if(elapsed > 0) {
                // Only use values when stopwatch actually started
                storeScore(
                    sandbox.activeGame(),
                    { id: new Date().getTime(), value: elapsed },
                    function() {
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

            // Vars for the countdown timer
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
                getConfig('soundAfterInspection', false, function(soundAfterInspection) {
                    if(soundAfterInspection) {
                        timerSound.load();
                        timerSound.play();
                    }
                });
            }
            $('#timer').text(count);
        };

        module.startCountdown = function(inspectionTime) {
            count = inspectionTime;
            counter = setInterval(module.countdownTimer, 1000);
            module.updateCountdown(count);
        };

        module.startTimer = function() {
            var timerConfig = {
                updateInterval: 31, // prime number
                formatter: defaultFormatMilliseconds
            };
            getConfig('inspectionTime', 0, function(inspectionTime) {
                getConfig('soundAfterInspection', false, function(soundAfterInspection) {
                    if(inspectionTime > 0 && soundAfterInspection) {
                        startSound.load();
                        startSound.play();
                    }
                    $('#timer')
                        .stopwatch(timerConfig)
                        .stopwatch('reset')
                        .stopwatch('start');
                });
            });
        };

        return module;
    }
);
