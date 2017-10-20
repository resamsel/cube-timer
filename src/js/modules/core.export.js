var core = require('../core');
var dao = require('../dao');
var misc = require('../utils/misc');
var $ = require('jquery');

core.register(
  'Export',
  function(sandbox) {
    var module = {};
    var $exportContent;
    var exportContent;
    var $export;

    module.init = function() {
      exportContent = document.getElementById('export-content');
      $exportContent = $(exportContent);
      $export = document.getElementById('export');

      sandbox.listen(['page-changed'], module.handlePageChanged, module);

      exportContent.on('click', function() {
        this.setSelectionRange(0, this.value.length);
        // Does not work on Chrome...
        // window.clipboardData.setData("Text", $(this).val());
      });
      $export.on('click', function() {
        var puzzle = sandbox.activePuzzle();
        dao.retrieveScores(puzzle, function(scores) {
          exportContent.value = misc.toCsv(puzzle, scores);
          // From materialize-css
          $exportContent.trigger('autoresize');
        });
      });
    };
    module.handlePageChanged = function(event) {
      if (event.data == 'results') {
        $export.style.display = 'inline-block';
      } else {
        $export.style.display = 'none';
      }
    };

    return module;
  }
);
