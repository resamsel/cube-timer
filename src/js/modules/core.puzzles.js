import Module from './core.module';
import {
  encodeKey,
  encodeClass,
  updateWithTime
} from '../utils/misc';
import Debounce from 'debounce-decorator';
import * as moment from 'moment';

var dao = require('../dao');
var $ = require('jquery');

import '../../css/core.puzzles.css';

export default class Puzzles extends Module {
  static get id() {
    return 'Puzzles';
  }

  constructor(sandbox) {
    super(Puzzles.id, sandbox);

    // List of puzzle objects
    this.puzzles = [];
    this.$puzzleName = undefined;
    this.$puzzleList = undefined;
  }

  init() {
    this.$puzzleName = $('#puzzle-name');
    this.$puzzles = $('#puzzles-content');
    this.$puzzleList = $('#puzzles-content .puzzle-container');
    this.puzzlesButton = $('.puzzles-button');

    this.$puzzles.hide();

    this.listen(['puzzle-changed'], this.handlePuzzleSwitched);
    this.listen(['page-changed'], this.handlePageChanged);

    dao.subscribe(['puzzle-added'], null, this.handlePuzzleAdded, this);
    dao.subscribe(['puzzle-removed'], null, this.handlePuzzleRemoved, this);
    dao.subscribe(
      ['config-changed'],
      'language',
      this.handleLanguageChanged,
      this
    );

    this.puzzlesButton
      .css('display', 'block')
      .attr('href', '#!' + encodeKey(this.sandbox.activePuzzle()) + '/puzzles');

    $('#create-puzzle-button').click(this.handleCreatePuzzle.bind(this));

    this.updateTime();
  }

  handlePuzzleSwitched(event) {
    console.debug('handlePuzzleSwitched(event)', event);
    var puzzle = event.data;

    $('.puzzle-list .active').removeClass('active');
    $('.puzzle-list .puzzle-' + encodeClass(puzzle)).addClass('active');
    $('.active-puzzle .text').text(puzzle);
    $('.active-puzzle').attr('href', '#!' + encodeKey(puzzle) + '/' + this.sandbox.activePage());

    $('.puzzle-item.active').removeClass('active');
    $(document.getElementById('puzzle-' + encodeClass(puzzle))).addClass('active');
  }

  handlePageChanged(event) {
    if (event.data == 'puzzles') {
      this.puzzlesButton.parent().addClass('active');
    } else {
      this.puzzlesButton.parent().removeClass('active');
    }

    $('.active-puzzle').attr('href', '#!' + encodeKey(this.sandbox.activePuzzle()) + '/' + event.data);
    $('.puzzles-button').attr('href', '#!' + encodeKey(this.sandbox.activePuzzle()) + '/puzzles');
    $('.puzzle-list .puzzle:not(.puzzle-create) > a').each(function(index, el) {
      var $el = $(el);
      $el.attr('href', '#!' + encodeKey($el.data('puzzle')) + '/' + event.data);
    });
  }

  handlePuzzleAdded(puzzle) {
    console.debug('handlePuzzleAdded', puzzle, this.puzzles);

    if (this.puzzles.map(p => p.name).indexOf(puzzle.name) < 0) {
      this.puzzles.push(puzzle);
    }

    this.addPuzzle(puzzle);
    this.populatePuzzles();

    dao.subscribe(
      ['puzzle-changed'],
      encodeKey(puzzle.name),
      this.handlePuzzleChanged,
			this
    );
  }

  handlePuzzleRemoved(puzzle) {
    if (this.puzzles.map(p => p.name).indexOf(puzzle.name) >= 0) {
      this.puzzles = this.puzzles.filter(function(p) {
        return p.name !== puzzle.name;
      });
      if (puzzle.name === this.sandbox.activePuzzle()) {
        this.sandbox.activePuzzle(puzzles[0].name);
      }
    }

    $(document.getElementById('puzzle-' + encodeClass(puzzle.name))).fadeOut({
      complete: function() {
        $(this).remove();
      }
    });

    this.populatePuzzles();
  }

  handlePuzzleChanged(puzzle) {
    console.debug('handlePuzzleChanged(puzzle)', puzzle);
    if (puzzle) {
      this.updatePuzzle(puzzle, $(document.getElementById('puzzle-' + encodeClass(puzzle.name))));
    }
  }

  handleLanguageChanged(value) {
    moment.locale(value);
    this.updateTime();
  }

  handleCreatePuzzle() {
    const puzzle = this.$puzzleName.val();
    this.$puzzleName.val('');
    dao.storePuzzle(puzzle);
    this.sandbox.activePuzzle(puzzle);
  }

  addPuzzle(puzzle) {
    const row = this.updatePuzzle(puzzle, $('#puzzles-content .template').clone());

    let added = false;
    this.$puzzleList.children().each(function(index, item) {
      var $item = $(item);
      if (added === false && $item.data('puzzle') > puzzle.name) {
        $item.before(row);
        added = true;
      }
    });
    if (added === false) {
      this.$puzzleList.append(row);
    }

    this.$puzzles.show();
  }

  updatePuzzle(puzzle, row) {
    const self = this;

    row.attr('id', 'puzzle-' + encodeClass(puzzle.name));
    row.removeClass('template');
    row.data('puzzle', puzzle.name);
    if (puzzle.name === this.sandbox.activePuzzle()) {
      row.addClass('active');
    }
    row.find('.title').text(puzzle.name);
    if (typeof puzzle.lastActive !== 'undefined') {
      updateWithTime(
        row.find('.last-active'),
        new Date(puzzle.lastActive)
      );
    } else {
      row.find('.last-active').hide();
    }
    row
      .find('.select')
      .attr('href', '#!' + encodeKey(puzzle.name) + '/puzzles');
    row
      .find('.delete')
      .data('puzzle', puzzle.name)
      .on('click', function(event) {
        var puzzle = $(this).data('puzzle');
        $('#delete-puzzle-ok')
          .attr('href', '#!' + encodeKey(self.sandbox.activePuzzle()) + '/puzzles')
          .on('click', function() {
            dao.removePuzzle(puzzle);
          });
        $('#delete-puzzle-cancel')
          .attr('href', '#!' + encodeKey(self.sandbox.activePuzzle()) + '/puzzles')
          .on('click', function() {
            $('#delete-puzzle-ok').off('click');
          });
      });

    return row;
  }

  /*
   * Create the list of puzzles in the header bar.
   */
  @Debounce(250)
  populatePuzzles() {
    var activePuzzle = this.sandbox.activePuzzle();
    var puzzleList = $('.puzzle-list');
    var divider = $('.puzzle-list .divider');
    var template = puzzleList.find('.template'),
      clone;
		const self = this;

    puzzleList.find('[class^="puzzle puzzle-"]').remove();
    this.puzzles.sort();
    this.puzzles.forEach(function(puzzle) {
      // 1. Clone template
      clone = template.clone();

      // 2. Update clone
      clone.removeClass('template').addClass('puzzle-' + encodeClass(puzzle.name));
      var $a = clone.find('a')
        .attr('href', '#!' + encodeKey(puzzle.name) + '/' + self.sandbox.activePage())
        .data('puzzle', puzzle.name);
      $a.find('span').text(puzzle.name);

      if (puzzle.name == activePuzzle) {
        clone.addClass('active');
      }

      // 3. Add it to the puzzle list
      divider.before(clone);
    });
  };

  updateTime() {
    $('time.sync').each(function(index, el) {
      updateWithTime($(el));
    });

    setTimeout(this.updateTime, 10000);
  }
}
