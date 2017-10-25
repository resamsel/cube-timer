import { relativeTime } from 'human-date';
import I18nUtils from './i18n';

if(typeof console === 'undefined') {
	var console = {
		log: function() {}
	};
}

export function pad2(number) {
	return (number < 10 ? '0' : '') + number;
};

export function defaultFormatMilliseconds(millis) {
	var x, milliseconds, seconds, minutes;
	x = millis / 10;
	milliseconds = Math.floor(x % 100);
	x = millis / 1000;
	seconds = Math.floor(x % 60);
	x /= 60;
	minutes = Math.floor(x % 60);
	return [pad2(minutes), pad2(seconds)].join(':') + '.' + pad2(milliseconds);
};

export function hourMinuteFormatMilliseconds(millis) {
	var x, seconds, minutes;
	x = millis / 1000;
	seconds = Math.floor(x % 60);
	x /= 60;
	minutes = Math.floor(x % 60);
	return [pad2(minutes), pad2(seconds)].join(':');
};

export function scoreKey(score) {
	return score.timestamp;
};

export function scoreValue(score) {
	return score.value;
};

export function compareNumbers(a, b) {
	return a - b;
};

export function compareTimestamps(a, b) {
	return a.timestamp - b.timestamp;
}

export function sortScores(scores) {
	return scores.sort(compareTimestamps);
};

export function toCsv(puzzle, scores) {
	const dateFormat = require('dateformat');
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

export function toDate(timestamp) {
	var interval = Math.floor((new Date().getTime() - timestamp) / 1000);
	return relativeTime(-interval);
};

export function toIsoDate(timestamp) {
	const dateFormat = require('dateformat');
	return dateFormat(new Date(timestamp), 'isoDateTime');
}

export function toGroupedDate(timestamp) {
	const dateFormat = require('dateformat');
	var dayFormat = 'yyyy-mm-dd';
	var date = new Date(timestamp);
	var now = new Date();
	if(dateFormat(date, dayFormat) == dateFormat(now, dayFormat)) {
		// date is today
		return I18nUtils.translate('today');
	}
	var yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	if(dateFormat(date, dayFormat) == dateFormat(yesterday, dayFormat)) {
		// date is yesterday
		return I18nUtils.translate('yesterday');
	}
	var weekFormat = 'yyyy-W';
	if(dateFormat(date, weekFormat) == dateFormat(now, weekFormat)) {
		// date is within this week
		return I18nUtils.translate('thisWeek');
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
export function debounce(func, wait, immediate) {
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

export function encodeKey(decoded) {
	if(typeof decoded === 'undefined') {
		return decoded;
	}
	return encodeURIComponent(decoded).replace(/\./g, '%2E');
};

export function decodeKey(encoded) {
	if(typeof encoded === 'undefined') {
		return encoded;
	}
  return decodeURIComponent(encoded.replace('%2E', '.'));
};

export function encodeClass(decoded) {
	if(typeof decoded === 'undefined') {
		return decoded;
	}
	return decoded.replace(/[!"#\$%&'()\*\+ ,-\.\/:;<=>\?@\[\\\]\^`{\|}~]/g, '\\$&');
};

export function updateWithTime($el, time, format) {
	if(typeof time !== 'undefined') {
		$el.attr('datetime', time.toISOString());
	} else {
		time = $el.attr('datetime');
	}
	if(typeof time !== 'undefined') {
		const moment = require('moment');
		var m = moment(time);
		$el.text(m.fromNow()).attr('title', m.format($el.attr('format')));
	}
};
