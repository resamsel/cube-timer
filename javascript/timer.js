// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
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
    var button = $('<button/>').
        text('-').
        data('scoreId', score.id).
        addClass('btn btn-default btn-xs btn-remove').
        bind('click', removeScore);
    $('#times > tbody').prepend(
        $('<tr/>').
            attr('id', 'id-' + score.id).
            append($('<td/>').addClass('index text-right')).
            append($('<td/>').
                addClass('value').
                text(defaultFormatMilliseconds(score.value))).
            append($('<td/>').addClass('date').text(toDate(score.id))).
            append($('<td/>').addClass('tags')).
            append($('<td/>').addClass('actions').append(button))
    );
    updateIndex();
}

function submitScore(elapsed) {
    var score = {id: new Date().getTime(), value: elapsed};
    showScore(score);
    if(typeof(Storage) !== "undefined") {
        var scores = [];
        if(localStorage.scores) {
            scores = JSON.parse(localStorage.scores);
        }
        scores.push(score);
        storeScores(scores);
    }
    updateLabels();
}

function storeScores(scores) {
    if(typeof(Storage) !== "undefined") {
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
    var id = $(e.target).data('scoreId');
    var scores = retrieveScores();
    for (var i = 0; i < scores.length; i++) {
        if(scores[i].id == id) {
            scores.remove(i);
            storeScores(scores);
            break;
        }
    }
    $('#id-' + id).remove();
    updateIndex();
    updateLabels();
}

function storeConfig(key, value) {
    if(typeof(Storage) !== "undefined") {
        localStorage.setItem(key, JSON.stringify(value));
    }
}

function getConfig(key, defaultValue) {
    if(typeof(Storage) !== "undefined") {
        var value = localStorage.getItem(key);
        if(value !== "undefined") {
            return JSON.parse(value);
        }
    }
    return defaultValue;
}

function mark(score, text, type_) {
    $('#id-' + score.id + ' > td.tags').append(' <span class="label label-' + type_ + '">' + text + '</span>');
}

function subXLabel(value) {
    var x = Math.floor(value / 1000);

    if (x < 60) {
        return x - x % 10 + 10;
    }

    return x - x % 30 + 30;
}

function updateIndex() {
    var max = $('#times > tbody > tr').length + 1;
    for(var i = 0; i < max; i++) {
        $('#times tr:nth-child(' + i + ') td.index').
            text((max - i) + '.');
    }
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

function start() {
    $('#timer').stopwatch({
        updateInterval: 31, // prime number
        formatter: defaultFormatMilliseconds,
    }).stopwatch('reset').stopwatch('start');
    $('body').removeClass('stopped').addClass('started');
}

function stop() {
    var sw, elapsed;
    sw = $('#timer').stopwatch();
    sw.stopwatch('stop');
    elapsed = sw.data('stopwatch').elapsed;
    submitScore(elapsed);
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

function toCsv(scores) {
    var result = 'Date;Duration\n';
    for (var i = 0; i < scores.length; i++) {
        result += scores[i].id + ';' + scores[i].value + '\n';
    }
    return result;
}

function toDate(timestamp) {
    var interval = Math.floor((new Date().getTime() - timestamp) / 1000);
    return jintervals(interval, "{G.} ago");
}

$(document).ready(function() {
    cube.reset();
    scramble();
    $('body').bind('keydown', onspacedown);
    $('body').bind('keyup', onspaceup);
    $('button.start-stop').bind('click', toggle);
    var scores = retrieveScores();
    for (var i = 0; i < scores.length; i++) {
        showScore(scores[i]);
    }
    updateLabels();

    $('#export').bind('click', function() {
        $('#export-content').val(toCsv(retrieveScores()));
        $('.export-dialog').modal('show');
    });
    $('#export-content').bind('click', function() {
        this.setSelectionRange(0, this.value.length);
    });
    
    // configuration
    $('#subtext').
        prop('checked', getConfig('subtext', true)).
        bind('click', function(e) {
            storeConfig('subtext', e.target.checked);
            updateLabels();
        });
});
