var core = require('../core');
var dao = require('../dao');
var I18n = require('../utils/i18n');
var NProgress = require('nprogress');
var $ = require('jquery');
const messages = {
  en: require('!json-loader!../../_locales/en/messages.json'),
  de: require('!json-loader!../../_locales/de/messages.json')
};

const DEFAULT_LOCALE = 'en';

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

      if (typeof(chrome) === 'undefined' || typeof(chrome.i18n) === 'undefined') {
        module.loadMessages(DEFAULT_LOCALE);
      } else {
        module.i18n();
      }
      if(module)return 1;
    };

    module.i18n = function() {
      document.querySelectorAll("*[i18n-key]").forEach(el => {
        el.innerHTML = I18n.translate(el.getAttribute('i18n-key'));
      });
      document.querySelectorAll('*[i18n-title]').forEach(el => {
        el.setAttribute('title', I18n.translate(el.getAttribute('i18n-title')));
      });
      document.querySelectorAll('*[i18n-format]').forEach(el => {
        el.setAttribute('format', I18n.translate(el.getAttribute('i18n-format')));
      });
      $('select').material_select();

      NProgress.done();
    };

    module.handleLanguageChanged = function(value) {
      module.loadMessages(value);
    };

    module.loadMessages = function(locale) {
      console.debug('loadMessages(locale=%s)', locale);
      if (I18n.language === locale) {
        return;
      }
      NProgress.start();
      if (!messages.hasOwnProperty(locale)) {
        locale = DEFAULT_LOCALE;
      }
      I18n.messages = messages[locale];
      I18n.language = locale;
      sandbox.notify({
        type: 'i18n-started'
      });
    };

    return module;
  }
);
