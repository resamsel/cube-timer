import Module from './core.module';
import I18nUtils from '../utils/i18n';

var dao = require('../dao');
var $ = require('jquery');

import '../../css/core.import.css';

export default class Import extends Module {
  static get id() {
    return 'Import';
  }

  constructor(sandbox) {
		super(Import.id, sandbox);

    this.fr = new FileReader();
  }

  init() {
    this.listen(['page-changed'], this.handlePageChanged);

    this.fr.onload = this.receivedText.bind(this);

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
    $('#import-file').change(this.handleFileSelect.bind(this));
    $('#import-from-file').on('click', function() {
      $('#import-file').click();
    });
    $('#import-append')
      .on('click', this.handleImportAppend.bind(this));
    $('#import-replace')
      .on('click', this.handleImportReplace.bind(this));
  }

  handlePageChanged(event) {
    if (event.data == 'results') {
      $('#import').css('display', 'inline-block');
    } else {
      $('#import').css('display', 'none');
    }
  }

  handleImportAppend() {
    this.handleImport(false);
  }

  handleImportReplace() {
    this.handleImport(true);
  }

  handleImport(replace) {
    var content = $('#import-content').val().split('\n'),
      scores = {},
      activePuzzle = this.sandbox.activePuzzle(),
      line, date, value, i, puzzle;

    for (i = 0; i < content.length; i++) {
      line = content[i].split(';');

      switch (line.length) {
        case 2:
          if (line[0] == 'Date' || line[1] == 'Duration') {
            continue;
          }
          puzzle = activePuzzle;
          date = new Date(line[0]);
          value = Number(line[1]);
          break;
        case 3:
          if (line[0] == 'Game' || line[1] == 'Date' || line[2] == 'Duration') {
            continue;
          }
          puzzle = line[0];
          date = new Date(line[1]);
          value = Number(line[2]);
          break;
        default:
          continue;
      }

      if (date !== null && value !== null) {
        if (typeof scores[puzzle] === 'undefined') {
          scores[puzzle] = [];
        }
        scores[puzzle].push({
          timestamp: date.getTime(),
          value: value
        });
      }
    }

    Object.keys(scores).forEach(function(puzzle) {
      if (!replace) {
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
  }

  showImportData(text) {
    $('#import-content').val(text);
    $('#import-content').trigger('autoresize');
  }

  receivedText() {
    this.showImportData(this.fr.result);
  }

  handleFileSelect() {
    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
      alert('The File APIs are not fully supported in this browser.');
      return;
    }

    var input = document.getElementById('import-file');
    var files = input.files;
    if (!files) {
      alert(I18nUtils.translate("importFilesUnsupported"));
    } else if (!files[0]) {
      alert(I18nUtils.translate("importFilesEmpty"));
    } else {
      var file = new Blob([files[0]], {
        type: 'text/plain'
      });
      this.fr.readAsText(file);

      /*
       * We need to reset the file input field, this seems to
       * be the easiest way
       */
      var control = $(input);
      control.replaceWith(control = control.clone(true));
    }
  }
}
