function translate(key, defaultValue) {
    if(typeof(chrome) !== 'undefined' && typeof(chrome.i18n) !== 'undefined') {
        var translation = chrome.i18n.getMessage(key);
        if (translation) {
            return translation;
        }
    }

    if (typeof(defaultValue) === 'undefined') {
        return key;
    }

    return defaultValue;
}

function i18n() {
    if(typeof(chrome) === 'undefined' || typeof(chrome.i18n) === 'undefined') {
        return;
    }

    $("*[i18n-key]").each(function() {
        var that = $(this);
        that.html(translate(that.attr('i18n-key')));
    });
}
