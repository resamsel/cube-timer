if(typeof console === 'undefined') {
    var console = {
        log: function() {}
    };
}

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

function hourMinuteFormatMilliseconds(millis) {
    var x, seconds, minutes;
    x = millis / 1000;
    seconds = Math.floor(x % 60);
    x /= 60;
    minutes = Math.floor(x % 60);
    return [pad2(minutes), pad2(seconds)].join(':');
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

function toCsv(game, scores) {
    var result = ['Game;Date;Duration'];

    for (var i = 0; i < scores.length; i++) {
        result.push([
            game,
            $.format.date(
                new Date(scores[i].id),
                'yyyy-MM-ddTHH:mm:ss.SSSZ'
            ),
            scores[i].value]
            .join(';')
        );
    }

    return result.join('\n');
}

function toDate(timestamp) {
    var interval = Math.floor((new Date().getTime() - timestamp) / 1000);
    return jintervals(interval, "{G.} ago");
}

function defaultCallback(key, defaultValue, callback) {
    return function (value) {
        if(value === null || typeof(value) === 'undefined') {
            value = defaultValue;
        }
        if(callback) {
            callback(value);
        }
    };
}
