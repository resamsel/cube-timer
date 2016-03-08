Core.register(
    'i18n',
    function(sandbox) {
        var module = {};

        module.init = function() {
            module.i18n();
        };

        module.i18n = function() {
            if(typeof(chrome) === 'undefined' || typeof(chrome.i18n) === 'undefined') {
                return;
            }

            $("*[i18n-key]").each(function() {
                var that = $(this);
                that.html(translate(that.attr('i18n-key')));
            });
        };

        return module;
    }
);
