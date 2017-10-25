class I18nUtils {
  constructor() {
    this.messages = null;
    this.language = null;
    this.languages = ['en', 'de'];
  }

  translate(key, params) {
    var translation;
    if (typeof(chrome) !== 'undefined' && typeof(chrome.i18n) !== 'undefined') {
      translation = chrome.i18n.getMessage(key, params);
      if (translation) {
        return translation;
      }
    }
    if (this.messages) {
      translation = this.messages[key];
      if (translation && typeof translation.message !== 'undefined') {
        var message = translation.message;
        if (typeof params !== 'undefined' && params.length > 0) {
          for (var i = 0; i < params.length; i++) {
            message = message.replace('\$' + (i + 1), params[i]);
          }
        }
        return message;
      }
    }

    return key;
  }
}

export default new I18nUtils();
