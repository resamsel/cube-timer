function translate(key, params) {
    if(typeof(chrome) !== 'undefined' && typeof(chrome.i18n) !== 'undefined') {
        var translation = chrome.i18n.getMessage(key, params);
        if (translation) {
            return translation;
        }
    }

    return key;
}
