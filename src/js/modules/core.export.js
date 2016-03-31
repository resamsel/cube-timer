var core = require('../core.js');
var dao = require('../dao.js');
var misc = require('../utils/misc.js');

core.register(
    'Export',
    function(sandbox) {
        var module = {};

        module.init = function() {
            $('#export-content').on('click', function() {
                this.setSelectionRange(0, this.value.length);
                // Does not work on Chrome...
                // window.clipboardData.setData("Text", $(this).val());
            });
            $('#export').on('click', function() {
                var game = sandbox.activeGame();
                console.log('Game: %s', game);
                dao.retrieveScores(game, function(results) {
                    $('#export-content').val(misc.toCsv(game, results));
                    $('#export-content').trigger('autoresize');
                });
            }).css('display', 'inline-block');
        };

        return module;
    }
);
