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
                retrieveScores(config.activeGame, function(scores) {
                    $('#export-content').val(toCsv(config.activeGame, scores));
                });
                // Show dialog
                $('.export-dialog').modal('show');
            });
        };

        return module;
    }
);
