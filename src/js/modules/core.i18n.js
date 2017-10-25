import Module from './core.module';
import I18nUtils from '../utils/i18n';

var dao = require('../dao');
var NProgress = require('nprogress');
var $ = require('jquery');
const messages = {
  en: require('!json-loader!../../_locales/en/messages.json'),
  de: require('!json-loader!../../_locales/de/messages.json')
};

const DEFAULT_LOCALE = 'en';

export default class I18n extends Module {
  static get id() {
    return 'I18n';
  }

  constructor(sandbox) {
    super(I18n.id, sandbox);
  }

  init() {
    this.listen(['i18n-started'], this.i18n);
    dao.subscribe(
      ['config-changed'],
      'language',
      this.handleLanguageChanged,
      this
    );

    if (typeof(chrome) === 'undefined' || typeof(chrome.i18n) === 'undefined') {
      this.loadMessages(DEFAULT_LOCALE);
    } else {
      this.i18n();
    }
  }

  i18n() {
    document.querySelectorAll("*[i18n-key]").forEach(el => {
      el.innerHTML = I18nUtils.translate(el.getAttribute('i18n-key'));
    });
    document.querySelectorAll('*[i18n-title]').forEach(el => {
      el.setAttribute('title', I18nUtils.translate(el.getAttribute('i18n-title')));
    });
    document.querySelectorAll('*[i18n-format]').forEach(el => {
      el.setAttribute('format', I18nUtils.translate(el.getAttribute('i18n-format')));
    });
    $('select').material_select();

    NProgress.done();
  }

  handleLanguageChanged(value) {
    this.loadMessages(value);
  }

  loadMessages(locale) {
    console.debug('loadMessages(locale=%s)', locale);
    if (I18nUtils.language === locale) {
      return;
    }
    NProgress.start();
    if (!messages.hasOwnProperty(locale)) {
      locale = DEFAULT_LOCALE;
    }
    I18nUtils.messages = messages[locale];
    I18nUtils.language = locale;
    this.notify({
      type: 'i18n-started'
    });
  }
}
