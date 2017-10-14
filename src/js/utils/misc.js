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
	return score.timestamp;
};

misc.scoreValue = function(score) {
	return score.value;
};

misc.compareNumbers = function(a, b) {
	return a - b;
};

misc.compareTimestamps = function(a, b) {
	return a.timestamp - b.timestamp;
}

misc.sortScores = function(scores) {
	return scores.sort(misc.compareTimestamps);
};

misc.toCsv = function(puzzle, scores) {
	var result = ['Puzzle;Date;Duration'];

	Object.keys(scores).forEach(function(key) {
		var score = scores[key];
		result.push(
			[
				puzzle,
				dateFormat(new Date(score.timestamp), "yyyy-mm-dd'T'HH:MM:ss.lo"),
				score.value
			].join(';')
		);
	});

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

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
misc.debounce = function(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

misc.encodeKey = function(decoded) {
	if(typeof decoded === 'undefined') {
		return decoded;
	}
	return encodeURIComponent(decoded).replace(/\./g, '%2E');
};

misc.decodeKey = function(encoded) {
	if(typeof encoded === 'undefined') {
		return encoded;
	}
    return decodeURIComponent(encoded.replace('%2E', '.'));
};

misc.encodeClass = function(decoded) {
	if(typeof decoded === 'undefined') {
		return decoded;
	}
	return decoded.replace(/[!"#\$%&'()\*\+ ,-\.\/:;<=>\?@\[\\\]\^`{\|}~]/g, '\\$&');
};

misc.updateWithTime = function($el, time, format) {
	if(typeof time !== 'undefined') {
		$el.attr('datetime', time.toISOString());
	} else {
		time = $el.attr('datetime');
	}
	if(typeof time !== 'undefined') {
		var m = moment(time);
		$el.text(m.fromNow()).attr('title', m.format($el.attr('format')));
	}
};

module.exports = misc;