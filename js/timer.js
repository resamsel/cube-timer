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
    storeScore(score);
    update();
}

function storeScore(score) {
    if(typeof(Storage) !== "undefined") {
        var scores = retrieveScores();
        scores.push(score);
        storeScores(scores);
    }
}

function storeScores(scores) {
    if(typeof(Storage) !== "undefined") {
        scores = scores.unique(function(a, b) { return a.id == b.id });
        localStorage.scores = JSON.stringify(scores);
    }
}

function retrieveScores() {
    if(typeof(Storage) !== "undefined") {
        if(localStorage.scores) {
            return JSON.parse(localStorage.scores);
        }
    }
    return [];
}

function removeScore(e) {
    var id = $(this).data('scoreId');
    var scores = retrieveScores();
    for (var i = 0; i < scores.length; i++) {
        if(scores[i].id == id) {
            scores.remove(i);
            storeScores(scores);
            break;
        }
    }
    $('#id-' + id).fadeOut({
        complete: function() {
            $(this).remove();
            update();
        }
    });
}

function storeConfig(key, value) {
    if(typeof(Storage) !== "undefined") {
        localStorage.setItem(key, JSON.stringify(value));
    }
}

function getConfig(key, defaultValue) {
    if(typeof(Storage) !== "undefined") {
        var value = localStorage.getItem(key);
        if(value !== null) {
            return JSON.parse(value);
        }
    }
    return defaultValue;
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
    var scores = retrieveScores();
    for (var i = 0; i < scores.length; i++) {
        showScore(scores[i]);
    }
    update();
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
    var scores = retrieveScores(),
        score,
        best = {id: 0, value: 999999999},
        best5 = {id: 0, value: 999999999},
        best12 = {id: 0, value: 999999999},
        markSubX = getConfig('subtext', true);

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
    mark(best5, 'best (5)', 'success');
    mark(best12, 'best (12)', 'success');
}

function update() {
    updateIndex();
    updateDates();
    updateLabels();
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
        console.log('Playing beep');
        if(getConfig('soundAfterInspection', false)) {
            timerSound.load();
            timerSound.play();
        }
    }

    $('#timer').text(count);
}

function startCountdown(inspectionTime) {
    count = inspectionTime;
    counter = setInterval(countdownTimer, 1000);
    updateCountdown(count);
}

function startTimer() {
    if(getConfig('inspectionTime', 0) > 0 && getConfig('soundAfterInspection', false)) {
        startSound.load();
        startSound.play();
    }
    $('#timer').stopwatch({
        updateInterval: 31, // prime number
        formatter: defaultFormatMilliseconds,
    }).stopwatch('reset').stopwatch('start');
}

function start() {
    $('body').removeClass('stopped').addClass('started');
    var inspectionTime = getConfig('inspectionTime', 0);
    if(inspectionTime > 0) {
        startCountdown(inspectionTime);
    } else {
        startTimer();
    }
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
    var i, scramble = cube.scramble(), len = scramble.length, result = "";
    for (i = 0; i < len; i += 5) {
        // Only allow a line break every 5 moves
        result += scramble.slice(i, i + 5).join("&nbsp;") + " ";
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

function doImportAppend() {
    doImport(false);
}

function doImportReplace() {
    doImport(true);
}

function doImport(replace) {
    var content = $('#import-content').val().split('\n'),
        scores = [],
        line, date, value;

    for(var i = 0; i < content.length; i++) {
        line = content[i].split(';');

        if(line.length != 2 || line[0] == 'Date' || line[1] == 'Duration') {
            continue;
        }

        date = new Date(line[0]);
        value = new Number(line[1]);
        if(date !== null && value !== null) {
            scores.push({id: date.getTime(), value});
        }
    }

    if(!replace) {
        // Appending scores
        scores = scores.concat(retrieveScores());
    }

    scores = scores.sort(function(a, b) { return a.id - b.id });

    storeScores(scores);

    updateScores();
}

function toCsv(scores) {
    var result = 'Date;Duration\n';
    for (var i = 0; i < scores.length; i++) {
        result += $.format.date(
                new Date(scores[i].id),
                'yyyy-MM-ddTHH:mm:ss.SSSZ'
            )
            + ';' + scores[i].value + '\n';
    }
    return result;
}

function toDate(timestamp) {
    var interval = Math.floor((new Date().getTime() - timestamp) / 1000);
    return jintervals(interval, "{G.} ago");
}

function receivedText() {
    $('#import-content').val(fr.result);
    $('.import-dialog').modal('show');
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
        //fr.readAsDataURL(file);

        /*
         * We need to reset the file input field, this seems to be the easiest
         * way
         */
        var control = $(input);
        control.replaceWith(control = control.clone(true));
    }
}

$(document).ready(function() {
    if(getConfig('hintVisible', true)) {
        $('#hint').show();
        $('#hint .close').bind('click', function() {
            storeConfig('hintVisible', false);
        });
    }

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
        $('.config-dialog').modal('show');
    });
    $('#export-content, #import-content').bind('click', function() {
        this.setSelectionRange(0, this.value.length);
        // Does not work on Chrome...
        // window.clipboardData.setData("Text", $(this).val());
    });
    $('#export').bind('click', function() {
        $('.export-dialog').modal('show');
        $('#export-content').val(toCsv(retrieveScores()));
    });
    $('#import-file').change(handleFileSelect);
    $('#import').bind('click', function() {
        $('#import-file').click();
    });
    $('#import-append').bind('click', doImportAppend);
    $('#import-replace').bind('click', doImportReplace);

    // configuration
    $('#inspectionTime').
        val(getConfig('inspectionTime', 0)).
        change(function() {
            storeConfig('inspectionTime', Number($(this).val()));
        }
    );

    $('#soundAfterInspection')
        .prop('checked', getConfig('soundAfterInspection', false))
        .bind('click', function(e) {
            storeConfig('soundAfterInspection', e.target.checked);
        }
    );
    // pre-load sound
    timerSound = new Audio('audio/timer.mp3');
    startSound = new Audio('audio/start.mp3');
    timerSound.load();
    startSound.load();

    $('#subtext').
        prop('checked', getConfig('subtext', true)).
        bind('click', function(e) {
            storeConfig('subtext', e.target.checked);
            updateLabels();
        }
    );
});
