var timerSound;
var startSound;
var config = {
    activeGame: '3x3x3',
    stats: [
        'best', 'best5', 'best12',
        'worst', 'worst5', 'worst12',
        'best80', 'best3of5', 'best10of12',
        'stddev', 'stddev5', 'stddev12',
        'average', 'average5', 'average12',
        'average80', 'average3of5', 'average10of12',
        'median', 'median5', 'median12',
        'median80', 'median3of5', 'median10of12',
    ],
    subs: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
        11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        25, 30, 35, 40, 45, 50, 55, 60,
        70, 80, 60+30, 100, 110,
        2*60, 2*60+30, 3*60, 4*60, 5*60,
        6*60, 7*60, 8*60, 9*60, 10*60,
        12*60, 15*60, 20*60, 30*60, 40*60, 50*60, 60*60
    ]
};

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

Array.prototype.last = function(defaultValue) {
    if(this.length > 0) {
        return this[this.length - 1];
    }
    return defaultValue || 0;
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
    var row = $('#times .template').clone();

    row.attr('id', 'id-' + score.id);
    row.removeClass('template');
    row.find('.value').text(defaultFormatMilliseconds(score.value));
    row.find('.date').text(toDate(score.id)).data('date', score.id);
    row
        .find('.btn-remove')
        .data('game', config.activeGame)
        .data('scoreId', score.id)
        .bind('click', removeScore);

    $('#times .times-content').prepend(row);
}

function submitScore(elapsed) {
    var score = {id: new Date().getTime(), value: elapsed};
    showScore(score);
    storeScore(config.activeGame, score, update);
}

function mark(score, text, type_) {
    $('#id-' + score.id + ' > * .tags').append(' <span class="label label-' + type_ + '">' + text + '</span>');
}

function valueToSub(value) {
    var x = value / 1000, sub;
    for (var i = 0; i < config.subs.length; i++) {
        sub = config.subs[i];
        if (x < sub) {
            return sub;
        }
    }

    return -1;
}

function updateScores() {
    console.log('updateScores(): activeGame: ' + config.activeGame);
    $('#times .times-content > *').remove();
    retrieveScores(config.activeGame, function(scores) {
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
    retrieveScores(config.activeGame, updateLabelsCallback);
}

function updateLabelsCallback(scores) {
    getConfig('subtext', true, function(markSubX) {
        var score,
            best = {id: 0, value: 999999999},
            best5 = {id: 0, value: 999999999},
            best12 = {id: 0, value: 999999999},
            sub;

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
                sub = valueToSub(score.value);
                if (sub > 0) {
                    mark(score, 'sub ' + sub, 'info');
                }
            }
        }

        // Then mark
        mark(best, 'best', 'success');
        mark(best5, 'best #5', 'success');
        mark(best12, 'best #12', 'success');
    });
}

function scoreKey(score) {
    return score.id;
}

function scoreValue(score) {
    return score.value;
}

function compareNumbers(a, b) {
    return a - b;
}

function updateStats() {
    console.log('Active game: ' + config.activeGame);
    retrieveScores(config.activeGame, function(scores) {
        statsChart(scores);

        var empty = scores.length < 1;
        if (empty) {
            scores.push({id: 0, value: 0});
        }

        var subs = {};
        var values = scores.map(scoreValue);
        var last5 = values.slice(-5).sort(compareNumbers);
        var last12 = values.slice(-12).sort(compareNumbers);
        var best3of5 = last5.slice(0, 3).sort(compareNumbers);
        var best10of12 = last12.slice(0, 10).sort(compareNumbers);

        values.sort(compareNumbers);

        values.forEach(function(value) {
            var sub = valueToSub(value);
            if (!(sub in subs)) {
                subs[sub] = 0;
            }
            subs[sub]++;
        });
        var container = $('#subs'), e;
        container.find('.sub').remove();
        if(!empty) {
            Object
                .keys(subs)
                .sort(compareNumbers)
                .slice(0, 3)
                .forEach(function(sub) {
                    e = $('#subs .template').clone();
                    e.removeClass('template');
    
                    e.attr('id', 'subs-' + sub)
                        .addClass('sub')
                        .find('.label')
                        .html('sub ' + sub);
                    e.find('.value').html(subs[sub]);
                    container.append(e);
                });
        }

        var avg80 = values.slice(
            0,
            Math.max(1, Math.floor(scores.length*0.8))
        );

        updateStat('best', values[0]);
        updateStat('best5', last5[0]);
        updateStat('best12', last12[0]);
        updateStat('best80', avg80[0]);
        updateStat('best3of5', best3of5[0]);
        updateStat('best10of12', best10of12[0]);
        updateStat('worst', values.last(0));
        updateStat('worst5', last5.last(0));
        updateStat('worst12', last12.last(0));
        updateStat('stddev', standardDeviation(scores, scoreValue));
        updateStat('stddev5', standardDeviation(last5));
        updateStat('stddev12', standardDeviation(last12));
        updateStat('stddev80', standardDeviation(avg80));
        updateStat('stddev3of5', standardDeviation(best3of5));
        updateStat('stddev10of12', standardDeviation(best10of12));
        updateStat('average', average(scores, scoreValue));
        updateStat('average5', average(last5));
        updateStat('average12', average(last12));
        updateStat('average80', average(avg80));
        updateStat('average3of5', average(best3of5));
        updateStat('average10of12', average(best10of12));
        updateStat('median', median(scores, scoreValue));
        updateStat('median5', median(last5));
        updateStat('median12', median(last12));
        updateStat('median80', median(avg80));
        updateStat('median3of5', median(best3of5));
        updateStat('median10of12', median(best10of12));
    });
}

function updateStat(key, value) {
    $('#stats-' + key + ' .value')
        .text(defaultFormatMilliseconds(value));
}

function updateHighlights() {
    retrieveHighlights(function(highlights) {
        $('#stats .stat').removeClass('highlight');
        var highlight;
        for(var i = 0; i < highlights.length; i++) {
            highlight = highlights[i];
            $('#stats-' + highlight).addClass('highlight');
        }
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
    scramble(config.activeGame);
}

function toggle() {
    if($('body').hasClass('started')) {
        stop();
    } else {
        start();
    }
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
        retrieveScores(config.activeGame, function(s) {
            storeScores(config.activeGame, scores.concat(s), updateScores);
        });
    } else {
        storeScores(config.activeGame, scores, updateScores);
    }
}

function handleStatChange(event) {
    var that = $(event.target);
    storeHighlight(
        that.attr('stat'),
        that.prop('checked'),
        updateHighlights
    );
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
    var files = input.files;
    if (!files) {
        alert(chrome.i18n.getMessage("importFilesUnsupported"));
    }
    else if (!files[0]) {
        alert(chrome.i18n.getMessage("importFilesEmpty"));
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
    // Migrate database, if necessary
    migrate();

    i18n();

    getConfig('hintVisible', true, function(hintVisible) {
        if(hintVisible) {
            $('#hint').show();
            $('#hint .close').bind('click', function() {
                storeConfig('hintVisible', false);
            });
        }
    });

    cube.reset();
    $('body').bind('keydown', onspacedown);
    $('body').bind('keyup', onspaceup);
    $('button.start-stop').bind('click', toggle);

    retrieveActiveGame(function(activeGame) {
        config.activeGame = activeGame;
        scramble(config.activeGame);
        updateScores();
    });
    
    /*
     * Header
     */
    populateGames();

    /*
     * Dialogs
     */
    $('#results-button').bind('click', function() {
        // Show dialog
        $('.results-dialog').modal('show');
    });
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
        retrieveScores(config.activeGame, function(scores) {
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

    var container = $('#stats'), stat, e;
    for(var i = 0; i < config.stats.length; i++) {
        stat = config.stats[i];
        e = $('#stats .template').clone();
        e.removeClass('template');

        e.attr('id', 'stats-' + stat)
            .find('.label')
            .html(translate(stat + '_short'));
        container.append(e);
    }
    retrieveHighlights(function(highlights) {
        var container = $('#statsHighlights .stats-content'),
            highlight, stat;

        for(var i = 0; i < config.stats.length; i++) {
            highlight = config.stats[i];
            stat = $('#statsHighlights .template').clone();
            stat.removeClass('template');

            stat.find('input[type=checkbox]')
                .attr('id', 'stat-' + highlight)
                .attr('stat', highlight)
                .prop('checked', highlights.indexOf(highlight) > -1);
            stat.find('.label')
                .html(translate(highlight + '_short'));
            stat.change(handleStatChange);

            container.append(stat);
        }
    });
    updateHighlights();
});
