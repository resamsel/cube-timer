Core.register(
    'export',
    function(sandbox) {
        var module = {};

        module.init = function() {
            $('#export-content').bind('click', function() {
                this.setSelectionRange(0, this.value.length);
                // Does not work on Chrome...
                // window.clipboardData.setData("Text", $(this).val());
            });
            $('#export').bind('click', function() {
                var game = sandbox.activeGame();
                console.log('Game: %s', game);
                retrieveScores(game, function(results) {
                    $('#export-content').val(toCsv(game, results));
                });
                // Show dialog
                $('.export-dialog').modal('show');
            });
        };

        return module;
    }
);
