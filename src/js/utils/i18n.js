var I18n = {
    messages: null,
    translate: function(key, params) {
        var translation;
        if(typeof(chrome) !== 'undefined' && typeof(chrome.i18n) !== 'undefined') {
            translation = chrome.i18n.getMessage(key, params);
            if (translation) {
                return translation;
            }
        }
        if(I18n.messages) {
            translation = I18n.messages[key];
            if (translation && typeof translation.message !== 'undefined') {
                var message = translation.message;
                if(typeof params !== 'undefined' && params.length > 0) {
                    for(var i = 0; i < params.length; i++) {
                        message = message.replace('\$' + (i+1), params[i]);
                    }
                }
                return message;
            }
        }

        return key;
    }
};

module.exports = I18n;