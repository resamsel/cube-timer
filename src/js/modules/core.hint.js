var core = require('../core.js');
var dao = require('../dao.js');
//var $ = require('jquery');

core.register(
    'Hint',
    function(sandbox) {
        var module = {};

        module.init = function() {
            dao.getConfig('hintVisible', true, function(hintVisible) {
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
            dao.storeConfig('hintVisible', false, function() {
                $('#hint-spacebar').css('display', 'none');
            });
        };

        return module;
    }
);