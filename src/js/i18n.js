function i18n() {
    if(typeof(chrome) === 'undefined' || typeof(chrome.i18n) === 'undefined') {
        return;
    }

    $("*[i18n-key]").each(function() {
        var that = $(this);
        that.html(chrome.i18n.getMessage(that.attr('i18n-key')));
    });
}
