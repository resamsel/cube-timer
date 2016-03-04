function translate(key, params) {
    if(typeof(chrome) !== 'undefined' && typeof(chrome.i18n) !== 'undefined') {
        var translation = chrome.i18n.getMessage(key, params);
        if (translation) {
            return translation;
        }
    }

    return key;
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
