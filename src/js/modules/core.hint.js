Core.register(
    'Hint',
    function(sandbox) {
        var module = {};

        module.init = function() {
            getConfig('hintVisible', true, function(hintVisible) {
                if(hintVisible) {
                    $('#hint-spacebar').show();
                }
            });

            $('#hint-spacebar .btn-close').on(
                'click',
                module.handleSpacebarClose
            );
        };

        module.handleSpacebarClose = function() {
            storeConfig('hintVisible', false, function() {
                $('#hint-spacebar').css('display', 'none');
            });
        };

        return module;
    }
);
