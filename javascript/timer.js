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
        addClass('btn btn-warning btn-xs btn-remove').
        bind('click', removeScore);
    $('#times').prepend(
        $('<li/>').
            text(defaultFormatMilliseconds(score.value)).
            attr('id', 'id-' + score.id).
            append(button)
    );
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
    var id = e.target.parentNode.id;
    var scores = retrieveScores();
    for (var i = 0; i < scores.length; i++) {
        if('id-' + scores[i].id == id) {
            scores.remove(i);
            storeScores(scores);
            break;
        }
    }
    $(e.target.parentNode).remove();
    updateLabels();
}

function mark(score, text) {
    $('#id-' + score.id).append(' <span class="label label-success">' + text + '</span>');
}

function updateLabels() {
    var scores = retrieveScores(),
        best = {id: 0, value: 999999999},
        best5 = {id: 0, value: 999999999},
        best12 = {id: 0, value: 999999999};
    for (var i = 0; i < scores.length; i++) {
        if (scores[i].value < best.value) {
            best = scores[i];
        }
        if ((scores.length - i - 1) < 5 && scores[i].value < best5.value) {
            best5 = scores[i];
        }
        if ((scores.length - i - 1) < 12 && scores[i].value < best12.value) {
            best12 = scores[i];
        }
    }

    // Remove first
    $('#times .label').remove();

    // Then mark
    mark(best, 'best');
    mark(best5, 'best (5)');
    mark(best12, 'best (12)');
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
});
