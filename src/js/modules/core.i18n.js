var core = require('../core.js');
var dao = require('../dao.js');
var I18n = require('../utils/i18n.js');
var NProgress = require('nprogress');
var $ = require('jquery');
const messages = {
	en: require('!json-loader!../../_locales/en/messages.json'),
	de: require('!json-loader!../../_locales/de/messages.json')
};

core.register(
	'I18n',
	function(sandbox) {
		var module = {};

		module.init = function() {
			sandbox.listen(
				['i18n-started'],
				module.i18n,
				module
			);
			dao.listen(
				['config-changed'],
				'language',
				module.handleLanguageChanged
			);

			if(typeof(chrome) === 'undefined' || typeof(chrome.i18n) === 'undefined') {
				module.loadMessages('en');
			} else {
				module.i18n();
			}
		};

		module.i18n = function() {
			$("*[i18n-key]").each(function() {
				var that = $(this);
				that.html(I18n.translate(that.attr('i18n-key')));
			});
			$('*[i18n-title]').each(function() {
				var that = $(this);
				that.attr('title', I18n.translate(that.attr('i18n-title')));
			});
			$('*[i18n-format]').each(function() {
				var that = $(this);
				that.attr('format', I18n.translate(that.attr('i18n-format')));
			});
			$('select').material_select();

			NProgress.done();
		};

		module.handleLanguageChanged = function(value) {
			module.loadMessages(value);
		};

		module.loadMessages = function(locale) {
			console.debug('loadMessages(locale=%s)', locale);
			if(I18n.language === locale) {
				return;
			}
			NProgress.start();
			if(!messages.hasOwnProperty(locale)) {
				locale = 'en';
			}
			I18n.messages = messages[locale];
			I18n.language = locale;
			sandbox.notify({type: 'i18n-started'});
		};

		return module;
	}
);
