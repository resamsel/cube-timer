Core.register(
    'import',
    function(sandbox) {
        var module = {};
        var fr = new FileReader();

        module.init = function() {
            fr.onload = module.receivedText;

            $('#import-content').bind('click', function() {
                this.setSelectionRange(0, this.value.length);
                // Does not work on Chrome...
                // window.clipboardData.setData("Text", $(this).val());
            });
            $('#import').bind('click', function() {
                // Reset input field
                $('#import-content').val('');
                // Hide previous errors
                $('#import-error').hide();
                // Show dialog
                $('.import-dialog').modal('show');
            });
            $('#import-file').change(module.handleFileSelect);
            $('#import-from-file').bind('click', function() {
                $('#import-file').click();
            });
            $('#import-append')
                .bind('click', module.handleImportAppend);
            $('#import-replace')
                .bind('click', module.handleImportReplace);
        };

        module.handleImportAppend = function() {
            module.handleImport(false);
        };

        module.handleImportReplace = function() {
            module.handleImport(true);
        };

        module.handleImport = function(replace) {
            var content = $('#import-content').val().split('\n'),
                scores = [],
                game = config.activeGame,
                line, date, value;

            for(var i = 0; i < content.length; i++) {
                line = content[i].split(';');

                if(line.length != 2 || line[0] == 'Date' || line[1] == 'Duration') {
                    continue;
                }

                date = new Date(line[0]);
                value = Number(line[1]);
                if(date !== null && value !== null) {
                    scores.push({id: date.getTime(), value: value});
                }
            }

            if(!replace) {
                // Appending scores
                retrieveScores(game, function(s) {
                    storeScores(
                        game,
                        scores.concat(s),
                        function() {
                            sandbox.notify({
                                type: 'results-changed',
                                data: game
                            });
                        }
                    );
                });
            } else {
                storeScores(
                    game,
                    scores,
                    function() {
                        sandbox.notify({
                            type: 'results-changed',
                            data: game
                        });
                    }
                );
            }
        };

        module.showImportData = function(text) {
            $('#import-content').val(text);
            $('.import-dialog').modal('show');
        };

        module.receivedText = function() {
            module.showImportData(fr.result);
        };

        module.handleFileSelect = function() {
            if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
                alert('The File APIs are not fully supported in this browser.');
                return;
            }

            var input = document.getElementById('import-file');
            var files = input.files;
            if (!files) {
                alert(translate("importFilesUnsupported"));
            }
            else if (!files[0]) {
                alert(translate("importFilesEmpty"));
            }
            else {
                var file = new Blob([files[0]], {type: 'text/plain'});
                fr.readAsText(file);

                /*
                 * We need to reset the file input field, this seems to
                 * be the easiest way
                 */
                var control = $(input);
                control.replaceWith(control = control.clone(true));
            }
        };

        return module;
    }
);
