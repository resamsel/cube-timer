var core = require('../core');
var dao = require('../dao');
var I18n = require('../utils/i18n');
var $ = require('jquery');

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
				activePuzzle = sandbox.activePuzzle(),
				line, date, value, i, puzzle;

			for(i = 0; i < content.length; i++) {
				line = content[i].split(';');

				switch(line.length) {
				case 2:
					if(line[0] == 'Date' || line[1] == 'Duration') {
						continue;
					}
					puzzle = activePuzzle;
					date = new Date(line[0]);
					value = Number(line[1]);
					break;
				case 3:
					if(line[0] == 'Game' || line[1] == 'Date' || line[2] == 'Duration') {
						continue;
					}
					puzzle = line[0];
					date = new Date(line[1]);
					value = Number(line[2]);
					break;
				default:
					continue;
				}

				if(date !== null && value !== null) {
					if(typeof scores[puzzle] === 'undefined') {
						scores[puzzle] = [];
					}
					scores[puzzle].push({timestamp: date.getTime(), value: value});
				}
			}

			Object.keys(scores).forEach(function(puzzle) {
				if(!replace) {
					// Appending scores
					scores[puzzle].forEach(function(score) {
						dao.storeScore(puzzle, score);
					});
				} else {
					dao.resetScores(puzzle, function() {
						scores[puzzle].forEach(function(score) {
							dao.storeScore(puzzle, score);
						});
					});
				}
			});
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
