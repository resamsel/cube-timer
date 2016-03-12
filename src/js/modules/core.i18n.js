Core.register(
    'I18n',
    function(sandbox) {
        var module = {};

        module.init = function() {
            sandbox.listen(
                ['i18n-started'],
                module.i18n,
                module
            );

            if(typeof(chrome) === 'undefined' || typeof(chrome.i18n) === 'undefined') {
                module.loadMessages('en');
            } else {
                module.i18n();
            }
        };

        module.i18n = function() {
            $("*[i18n-key]").each(function() {
                var that = $(this);
                that.html(I18n.translate(that.attr('i18n-key')));
            });
        };

        module.loadMessages = function(locale) {
            $.ajax({
                url: '_locales/' + locale + '/messages.json',
                dataType: 'json'
            }).done(function (data) {
                I18n.messages = data;
                sandbox.notify({type: 'i18n-started'});
            });
        };

        return module;
    }
);
