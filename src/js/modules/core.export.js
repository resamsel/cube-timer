import Module from './core.module';
import dao from '../dao';
import {
  toCsv
} from '../utils/misc';
var $ = require('jquery');

import '../../css/core.export.css';

export default class Export extends Module {
  static get id() {
    return 'Export';
  }

  constructor(sandbox) {
    super(Export.id, sandbox);

    this.exportContent = null;
    this.$exportContent = null;
    this.$export = null;
  }

  init() {
    this.exportContent = document.getElementById('export-content');
    this.$exportContent = $(this.exportContent);
    this.$export = document.getElementById('export');

    this.listen(['page-changed'], this.handlePageChanged);

    this.exportContent.on('click', function() {
      this.setSelectionRange(0, this.value.length);
      // Does not work on Chrome...
      // window.clipboardData.setData("Text", $(this).val());
    });
    const self = this;
    this.$export.on('click', function() {
      const puzzle = self.sandbox.activePuzzle();
      dao.retrieveScores(puzzle, function(scores) {
        self.exportContent.value = toCsv(puzzle, scores);
        // From materialize-css
        self.$exportContent.trigger('autoresize');
      });
    });
  }

  handlePageChanged(event) {
    if (event.data == 'results') {
      this.$export.style.display = 'inline-block';
    } else {
      this.$export.style.display = 'none';
    }
  };
}
