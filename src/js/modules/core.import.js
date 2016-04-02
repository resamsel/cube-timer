var core = require('../core.js');
var dao = require('../dao.js');
var I18n = require('../utils/i18n.js');

core.register(
    'Import',
    function(sandbox) {
        var module = {};
        var fr = new FileReader();

        module.init = function() {
            sandbox.listen(
                ['page-changed'],
                module.handlePageChanged,
                module
            );

            fr.onload = module.receivedText;

            $('#import-content').on('click', function() {
                this.setSelectionRange(0, this.value.length);
                // Does not work on Chrome...
                // window.clipboardData.setData("Text", $(this).val());
            });
            $('#import').on('click', function() {
                // Reset input field
                $('#import-content').val('').trigger('autoresize');
                // Hide previous errors
                $('#import-error').hide();
            });
            $('#import-file').change(module.handleFileSelect);
            $('#import-from-file').on('click', function() {
                $('#import-file').click();
            });
            $('#import-append')
                .on('click', module.handleImportAppend);
            $('#import-replace')
                .on('click', module.handleImportReplace);
        };

        module.handlePageChanged = function(event) {
            if(event.data == 'results') {
                $('#import').css('display', 'inline-block');
            } else {
                $('#import').css('display', 'none');
            }
        };

        module.handleImportAppend = function() {
            module.handleImport(false);
        };

        module.handleImportReplace = function() {
            module.handleImport(true);
        };

        module.handleImport = function(replace) {
            var content = $('#import-content').val().split('\n'),
                scores = {},
                activeGame = sandbox.activeGame(),
                line, date, value, i;

            for(i = 0; i < content.length; i++) {
                line = content[i].split(';');

                switch(line.length) {
                case 2:
                    if(line[0] == 'Date' || line[1] == 'Duration') {
                        continue;
                    }
                    game = activeGame;
                    date = new Date(line[0]);
                    value = Number(line[1]);
                    break;
                case 3:
                    if(line[0] == 'Game' || line[1] == 'Date' || line[2] == 'Duration') {
                        continue;
                    }
                    game = line[0];
                    date = new Date(line[1]);
                    value = Number(line[2]);
                    break;
                default:
                    continue;
                }

                if(date !== null && value !== null) {
                    if(typeof scores[game] === 'undefined') {
                        scores[game] = [];
                    }
                    scores[game].push({id: date.getTime(), value: value});
                }
            }

            // TODO: Refactor and simplify this code
            var callback = function(game, applier) {
                return function(s) {
                    dao.storeScores(
                        game,
                        applier(s, scores[game]),
                        function() {
                            if(game == activeGame) {
                                sandbox.notify({
                                    type: 'results-changed',
                                    data: game
                                });
                            }
                        }
                    );
                };
            };
            var applier;
            var games = Object.keys(scores);
            if(!replace) {
                // Appending scores
                applier = function(a, b) {
                    return b.concat(a);
                };
                for(i = 0; i < games.length; i++) {
                    game = games[i];
                    dao.retrieveScores(game, callback(game, applier));
                }
            } else {
                applier = function(a, b) {
                    return b;
                };
                for(i = 0; i < games.length; i++) {
                    game = games[i];
                    callback(game, applier)(scores[game]);
                }
            }
        };

        module.showImportData = function(text) {
            $('#import-content').val(text);
            $('#import-content').trigger('autoresize');
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
                alert(I18n.translate("importFilesUnsupported"));
            }
            else if (!files[0]) {
                alert(I18n.translate("importFilesEmpty"));
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