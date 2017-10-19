var core = require('../core.js');
var dao = require('../dao.js');
var misc = require('../utils/misc.js');
var $ = require('jquery');

core.register(
    'Export',
    function(sandbox) {
        var module = {};

        module.init = function() {
            sandbox.listen(
                ['page-changed'],
                module.handlePageChanged,
                module
            );

            $('#export-content').on('click', function() {
                this.setSelectionRange(0, this.value.length);
                // Does not work on Chrome...
                // window.clipboardData.setData("Text", $(this).val());
            });
            $('#export').on('click', function() {
                var puzzle = sandbox.activePuzzle();
                dao.retrieveScores(puzzle, function(scores) {
                    $('#export-content').val(misc.toCsv(puzzle, scores));
                    $('#export-content').trigger('autoresize');
                });
            });
        };

        module.handlePageChanged = function(event) {
            if(event.data == 'results') {
                $('#export').css('display', 'inline-block');
            } else {
                $('#export').css('display', 'none');
            }
        };

        return module;
    }
);
