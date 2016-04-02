var hdate = require("human-date");
var dateFormat = require("dateformat");
var I18n = require('./i18n.js');

if(typeof console === 'undefined') {
    var console = {
        log: function() {}
    };
}

var misc = {};

misc.pad2 = function(number) {
    return (number < 10 ? '0' : '') + number;
};

misc.defaultFormatMilliseconds = function(millis) {
    var x, milliseconds, seconds, minutes;
    x = millis / 10;
    milliseconds = Math.floor(x % 100);
    x = millis / 1000;
    seconds = Math.floor(x % 60);
    x /= 60;
    minutes = Math.floor(x % 60);
    return [misc.pad2(minutes), misc.pad2(seconds)].join(':') + '.' + misc.pad2(milliseconds);
};

misc.hourMinuteFormatMilliseconds = function(millis) {
    var x, seconds, minutes;
    x = millis / 1000;
    seconds = Math.floor(x % 60);
    x /= 60;
    minutes = Math.floor(x % 60);
    return [misc.pad2(minutes), misc.pad2(seconds)].join(':');
};

misc.scoreKey = function(score) {
    return score.id;
};

misc.scoreValue = function(score) {
    return score.value;
};

misc.compareNumbers = function(a, b) {
    return a - b;
};

misc.toCsv = function(game, scores) {
    var result = ['Game;Date;Duration'];

    for (var i = 0; i < scores.length; i++) {
        result.push([
            game,
            dateFormat(
                new Date(scores[i].id),
                "yyyy-mm-dd'T'HH:MM:ss.lo"
            ),
            scores[i].value]
            .join(';')
        );
    }

    return result.join('\n');
};

misc.toDate = function(timestamp) {
    var interval = Math.floor((new Date().getTime() - timestamp) / 1000);
    return hdate.relativeTime(-interval);
};

misc.toIsoDate = function(timestamp) {
    return dateFormat(new Date(timestamp), 'isoDateTime');
}

misc.toGroupedDate = function(timestamp) {
    var dayFormat = 'yyyy-mm-dd';
    var date = new Date(timestamp);
    var now = new Date();
    if(dateFormat(date, dayFormat) == dateFormat(now, dayFormat)) {
        // date is today
        return I18n.translate('today');
    }
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if(dateFormat(date, dayFormat) == dateFormat(yesterday, dayFormat)) {
        // date is yesterday
        return I18n.translate('yesterday');
    }
    var weekFormat = 'yyyy-W';
    if(dateFormat(date, weekFormat) == dateFormat(now, weekFormat)) {
        // date is within this week
        return I18n.translate('thisWeek');
    }
    var yearFormat = 'yyyy';
    if(dateFormat(date, yearFormat) == dateFormat(now, yearFormat)) {
        // date is within this year
        return dateFormat(date, 'mmmm');
    }
    return dateFormat(date, 'mmmm yyyy');
};

module.exports = misc;