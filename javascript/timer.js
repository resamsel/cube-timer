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

function start() {
    $('#timer').stopwatch({
        updateInterval: 30,
        formatter: defaultFormatMilliseconds,
//        format: '{mm}:{ss}'
    }).stopwatch('reset').stopwatch('start');
    $('body').removeClass('stopped').addClass('started');
}

function stop() {
    var sw, elapsed;
    sw = $('#timer').stopwatch();
    sw.stopwatch('stop');
    elapsed = sw.data('stopwatch').elapsed;
    $('#times').prepend($('<li/>').text(defaultFormatMilliseconds(elapsed)));
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
});
