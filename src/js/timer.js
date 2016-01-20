var timerSound;
var startSound;

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

Array.prototype.unique = function(eq) {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(eq(a[i], a[j]))
                a.splice(j--, 1);
        }
    }

    return a;
};

function pad2(number) {
    return (number < 10 ? '0' : '') + number;
}

function defaultFormatMilliseconds(millis) {
    var x, milliseconds, seconds, minutes;
    x = millis / 10;
    milliseconds = Math.floor(x % 100);
    x = millis / 1000;
    seconds = Math.floor(x % 60);
    x /= 60;
    minutes = Math.floor(x % 60);
    return [pad2(minutes), pad2(seconds)].join(':') + '.' + pad2(milliseconds);
}

function showScore(score) {
    var row = $('#times #template').clone();

    row.attr('id', 'id-' + score.id);
    row.find('.value').text(defaultFormatMilliseconds(score.value));
    row.find('.date').text(toDate(score.id)).data('date', score.id);
    row.find('.btn-remove').data('scoreId', score.id).bind('click', removeScore);

    $('#times .times-content').prepend(row);
}

function submitScore(elapsed) {
    var score = {id: new Date().getTime(), value: elapsed};
    showScore(score);
    storeScore(score, update);
}

function mark(score, text, type_) {
    $('#id-' + score.id + ' > * .tags').append(' <span class="label label-' + type_ + '">' + text + '</span>');
}

function subXLabel(value) {
    var x = Math.floor(value / 1000);

    if (x < 60) {
        return x - x % 10 + 10;
    }

    return x - x % 30 + 30;
}

function updateScores() {
    $('#times .times-content > *').remove();
    retrieveScores(function(scores) {
        for (var i = 0; i < scores.length; i++) {
            showScore(scores[i]);
        }
        update();
    });
}

function updateIndex() {
    var max = $('#times .times-content > *').length + 1;
    for(var i = 0; i < max; i++) {
        $('#times .times-content *:nth-child(' + i + ') .index').
            text((max - i) + '.');
    }
}

function updateDates() {
    $('#times .times-content > * .date').each(function() {
        var that = $(this);
        that.text(toDate(that.data('date')));
    });
}

function updateLabels() {
    retrieveScores(updateLabelsCallback);
}

function updateLabelsCallback(scores) {
    getConfig('subtext', true, function(markSubX) {
        var score,
            best = {id: 0, value: 999999999},
            best5 = {id: 0, value: 999999999},
            best12 = {id: 0, value: 999999999};

        // Remove first
        $('#times .label').remove();

        for (var i = 0; i < scores.length; i++) {
            score = scores[i];
            if (score.value < best.value) {
                best = score;
            }
            if ((scores.length - i - 1) < 5 && score.value < best5.value) {
                best5 = score;
            }
            if ((scores.length - i - 1) < 12 && score.value < best12.value) {
                best12 = score;
            }
            if(markSubX) {
                mark(score, 'sub ' + subXLabel(score.value), 'info');
            }
        }

        // Then mark
        mark(best, 'best', 'success');
        mark(best5, 'best #5', 'success');
        mark(best12, 'best #12', 'success');
    });
}

function updateStats() {
    retrieveScores(function(scores) {
        var score,
            best = {id: 0, value: 999999999},
            best5 = {id: 0, value: 999999999},
            best12 = {id: 0, value: 999999999},
            total = 0, total5 = 0, total12 = 0,
            last5 = [], last12 = [];
        for (var i = 0; i < scores.length; i++) {
            score = scores[i];
            total += score.value;
            if (score.value < best.value) {
                best = score;
            }
            if ((scores.length - i - 1) < 5) {
                if (score.value < best5.value) {
                    best5 = score;
                }
                total5 += score.value;
                last5.push(score.value);
            }
            if ((scores.length - i - 1) < 12) {
                if (score.value < best12.value) {
                    best12 = score;
                }
                total12 += score.value;
                last12.push(score.value);
            }
        }

        $('#stats-best .value')
            .text(defaultFormatMilliseconds(best.value));
        $('#stats-best5 .value')
            .text(defaultFormatMilliseconds(best5.value));
        $('#stats-best12 .value')
            .text(defaultFormatMilliseconds(best12.value));
        $('#stats-average .value')
            .text(defaultFormatMilliseconds(total/scores.length));
        $('#stats-average5 .value')
            .text(defaultFormatMilliseconds(total5/Math.min(scores.length, 5)));
        $('#stats-average12 .value')
            .text(defaultFormatMilliseconds(total12/Math.min(scores.length, 12)));

        last5.sort();
        last12.sort();

        $('#stats-average3of5 .value')
            .text(defaultFormatMilliseconds(
                last5.slice(0, 3).reduce(function(a, b) { return a + b; })/Math.min(last5.length, 3)));
        $('#stats-average10of12 .value')
            .text(defaultFormatMilliseconds(
                last12.slice(0, 10).reduce(function(a, b) { return a + b; })/Math.min(last12.length, 10)));
    });
}

function update() {
    updateIndex();
    updateDates();
    updateLabels();
    updateStats();
}

/*
 * Business logic
 */

// Vars for the countdown timer
var count, counter, beep;
function countdownTimer()
{
    count = count-1;
    if (count <= 0)
    {
        clearInterval(counter);
        startTimer();
        return;
    }

    updateCountdown(count);
}

// Code for showing the number of seconds
function updateCountdown(currentCount) {
    if(count <= 3) {
        getConfig('soundAfterInspection', false, function(soundAfterInspection) {
            if(soundAfterInspection) {
                timerSound.load();
                timerSound.play();
            }
        });
    }

    $('#timer').text(count);
}

function startCountdown(inspectionTime) {
    count = inspectionTime;
    counter = setInterval(countdownTimer, 1000);
    updateCountdown(count);
}

function startTimer() {
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
            $('#timer').stopwatch(timerConfig).stopwatch('reset').stopwatch('start');
        });
    });
}

function start() {
    $('body').removeClass('stopped').addClass('started');
    getConfig('inspectionTime', 0, function(inspectionTime) {
        if(inspectionTime > 0) {
            startCountdown(inspectionTime);
        } else {
            startTimer();
        }
    });
}

function stop() {
    var sw, elapsed;
    clearInterval(counter);
    sw = $('#timer').stopwatch();
    sw.stopwatch('stop');
    elapsed = sw.data('stopwatch').elapsed;
    if(elapsed > 0) {
        // Only use values stopwatch actually started
        submitScore(elapsed);
    }
    $('body').removeClass('started').addClass('stopped');
    scramble();
}

function toggle() {
    if($('body').hasClass('started')) {
        stop();
    } else {
        start();
    }
}

function scramble() {
    var i, scrambled = cube.scramble(), len = scrambled.length, result = "";
    for (i = 0; i < len; i += 5) {
        // Only allow a line break every 5 moves
        result += scrambled.slice(i, i + 5).join("&nbsp;") + " ";
    }
    $('#scramble').html(result);
}

function onspacedown(e) {
    if(e.keyCode == 32 && e.target == document.body) {
        e.preventDefault();
        return false;
    }
}

function onspaceup(e) {
    if(e.keyCode == 32 && e.target == document.body) {
        e.preventDefault();
        toggle();
    }
}

function handleImportAppend() {
    handleImport(false);
}

function handleImportReplace() {
    handleImport(true);
}

function handleImport(replace) {
    var content = $('#import-content').val().split('\n'),
        scores = [],
        line, date, value;

    for(var i = 0; i < content.length; i++) {
        line = content[i].split(';');

        if(line.length != 2 || line[0] == 'Date' || line[1] == 'Duration') {
            continue;
        }

        date = new Date(line[0]);
        value = Number(line[1]);
        if(date !== null && value !== null) {
            scores.push({id: date.getTime(), value: value});
        }
    }

    if(!replace) {
        // Appending scores
        retrieveScores(function(s) {
            storeScores(scores.concat(s), updateScores);
        });
    } else {
        storeScores(scores, updateScores);
    }
}

function toCsv(scores) {
    var result = 'Date;Duration\n';

    for (var i = 0; i < scores.length; i++) {
        result += $.format.date(
                new Date(scores[i].id),
                'yyyy-MM-ddTHH:mm:ss.SSSZ'
            ) + ';' + scores[i].value + '\n';
    }

    return result;
}

function toDate(timestamp) {
    var interval = Math.floor((new Date().getTime() - timestamp) / 1000);
    return jintervals(interval, "{G.} ago");
}

function showImportData(text) {
    $('#import-content').val(text);
    $('.import-dialog').modal('show');
}

function receivedText() {
    showImportData(fr.result);
}

var fr = new FileReader();
fr.onload = receivedText;
function handleFileSelect()
{
    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
        alert('The File APIs are not fully supported in this browser.');
        return;
    }

    var input = document.getElementById('import-file');
    if (!input) {
        alert("Um, couldn't find the fileinput element.");
        return;
    }

    var files = input.files;
    if (!files) {
        alert("This browser doesn't seem to support the `files` property of file inputs.");
    }
    else if (!files[0]) {
        alert("Please select a file before clicking 'Load'");
    }
    else {
        var file = new Blob([files[0]], {type: 'text/plain'});
        fr.readAsText(file);

        /*
         * We need to reset the file input field, this seems to be the easiest
         * way
         */
        var control = $(input);
        control.replaceWith(control = control.clone(true));
    }
}

$(document).ready(function() {
    getConfig('hintVisible', true, function(hintVisible) {
        if(hintVisible) {
            $('#hint').show();
            $('#hint .close').bind('click', function() {
                storeConfig('hintVisible', false);
            });
        }
    });

    cube.reset();
    scramble();
    $('body').bind('keydown', onspacedown);
    $('body').bind('keyup', onspaceup);
    $('button.start-stop').bind('click', toggle);
    updateScores();

    /*
     * Dialogs
     */
    $('#config-button').bind('click', function() {
        // Show dialog
        $('.config-dialog').modal('show');
    });
    $('#export-content, #import-content').bind('click', function() {
        this.setSelectionRange(0, this.value.length);
        // Does not work on Chrome...
        // window.clipboardData.setData("Text", $(this).val());
    });
    $('#export').bind('click', function() {
        retrieveScores(function(scores) {
            $('#export-content').val(toCsv(scores));
        });
        // Show dialog
        $('.export-dialog').modal('show');
    });
    $('#import').bind('click', function() {
        // Reset input field
        $('#import-content').val('');
        // Hide previous errors
        $('#import-error').hide();
        // Show dialog
        $('.import-dialog').modal('show');
    });
    $('#import-file').change(handleFileSelect);
    $('#import-from-file').bind('click', function() {
        $('#import-file').click();
    });
    $('#import-from-drive').bind('click', handlePickerClick);
    $('#import-append').bind('click', handleImportAppend);
    $('#import-replace').bind('click', handleImportReplace);

    // configuration
    getConfig('inspectionTime', 0, function(inspectionTime) {
        $('#inspectionTime')
            .val(inspectionTime)
            .change(function() {
                storeConfig('inspectionTime', Number($(this).val()));
            });
    });

    getConfig('soundAfterInspection', false, function(soundAfterInspection) {
        $('#soundAfterInspection')
            .prop('checked', soundAfterInspection)
            .bind('click', function(e) {
                storeConfig('soundAfterInspection', e.target.checked);
            }
        );
    });
    // pre-load sound
    timerSound = new Audio('audio/timer.mp3');
    startSound = new Audio('audio/start.mp3');
    timerSound.load();
    startSound.load();

    getConfig('subtext', true, function(subtext) {
        $('#subtext').
            prop('checked', subtext).
            bind('click', function(e) {
                storeConfig('subtext', e.target.checked, updateLabels);
            }
        );
    });
});
