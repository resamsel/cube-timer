import Module from './core.module';
import I18nUtils from '../utils/i18n';
import {
  debounce
} from '../utils/misc';

var dao = require('../dao');
var $ = require('jquery');

import '../../css/core.config.css';

export default class Config extends Module {
  static get id() {
    return 'Config';
  }

  constructor(sandbox) {
    super(Config.id, sandbox);

    this.$language = null;
    this.$inspectionTime = null;
    this.$subtext = null;
    this.$soundAfterInspection = null;
    this.$windowSize = null;
    this.configButton = null;
    this.configListeners = {
      language: this.handleLanguageChanged,
      inspectionTime: this.handleInspectionTimeChanged,
      subtext: this.handleSubtextChanged,
      soundAfterInspection: this.handleSoundAfterInspectionChanged,
      windowSize: this.handleWindowSizeChanged
    };
  }

  init() {
    this.$language = $('#language');
    this.$inspectionTime = $('#inspectionTime');
    this.$subtext = $('#subtext');
    this.$soundAfterInspection = $('#soundAfterInspection');
    this.$windowSize = $('#windowSize');
    this.configButton = $('.config-button');
    const self = this;

    this.listen(['page-changed'], this.handlePageChanged);
    // this.listen(['puzzle-changed'], this.handlePuzzleChanged);

    I18nUtils.languages.forEach(function(language) {
      self.$language.append($('<option value="' + language + '" i18n-key="language_' + language + '">' + language + '</option>'));
    });

    this.$language.change(function() {
      console.debug('changeLanguage');
      dao.storeConfig('language', $(this).val());
    });
    this.$inspectionTime.change(function() {
      dao.storeConfig('inspectionTime', Number($(this).val()));
    });
    this.$subtext.on('click', function(e) {
      dao.storeConfig('subtext', e.target.checked);
    });
    this.$soundAfterInspection.on('click', function(e) {
      dao.storeConfig('soundAfterInspection', e.target.checked);
    });
    this.$windowSize.on('change', debounce(function(e) {
      dao.storeConfig('windowSize', self.$windowSize.val());
    }, 250));

    // this.handlePuzzleChanged();

    const configListeners = this.configListeners;
    Object.keys(configListeners).forEach(function(key) {
      var listener = configListeners[key];
      dao.unsubscribe(['config-changed'], listener);
      dao.subscribe(['config-changed'], key, listener, self);
    });

    this.configButton.css('display', 'block');
  }

  handlePageChanged(event) {
    if (event.data == 'config') {
      this.configButton.parent().addClass('active');
    } else {
      this.configButton.parent().removeClass('active');
    }
  }

  // handlePuzzleChanged(event) {
  //   const self = this;
  // 	const configListeners = this.configListeners;
  //   Object.keys(configListeners).forEach(function(key) {
  //     var listener = configListeners[key];
  //     dao.unsubscribe(['config-changed'], listener);
  //     dao.subscribe(['config-changed'], key, listener, self);
  //   });
  // }

  handleLanguageChanged(language) {
    console.debug('handleLanguageChanged');
    if (language === null) {
      language = 'en';
    }
    this.$language.val(language);
  }

  handleInspectionTimeChanged(inspectionTime) {
    if (inspectionTime === null) {
      inspectionTime = 0;
    }
    this.$inspectionTime.val(inspectionTime);
  }

  handleSubtextChanged(subtext) {
    if (subtext === null) {
      subtext = true;
    }
    this.$subtext.prop('checked', subtext);
  }

  handleSoundAfterInspectionChanged(soundAfterInspection) {
    if (soundAfterInspection === null) {
      soundAfterInspection = false;
    }
    this.$soundAfterInspection.prop('checked', soundAfterInspection);
  }

  handleWindowSizeChanged(windowSize) {
    if (windowSize === null) {
      windowSize = 50;
    }
    this.$windowSize.val(windowSize);
  }
}
