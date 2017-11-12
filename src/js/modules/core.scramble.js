import Module from './core.module';
import I18nUtils from '../utils/i18n';
import * as dao from '../dao';

var Cube = require('../external/rubiks-cube-scrambler');
var $ = require('jquery');

const scrambles = {
  '2x2x2': {
    cube: Cube['3x3x3'],
    len: 15
  },
  '3x3x3': {
    cube: Cube['3x3x3'],
    len: 25
  }
};

export default class Scramble extends Module {
  static get id() {
    return 'Scramble';
  }

  constructor(sandbox) {
    super(Scramble.id, sandbox);
  }

  init() {
    this.listen(['puzzle-changed'], this.handlePuzzleChanged);
    this.listen(['i18n-started'], this.handleI18nStarted);
    dao.subscribe(['score-added'], null, this.handleResultCreated, this);

    Cube['3x3x3'].reset();

    this.scramble(this.sandbox.activePuzzle());
  }

  handlePuzzleChanged(event) {
    this.scramble(event.data);
  }

  handleResultCreated(event) {
    this.scramble(this.sandbox.activePuzzle());
  }

  scramble(puzzle) {
    const options = Object.keys(scrambles).filter(scramble => puzzle.indexOf(scramble) !== -1);
    if (options.length > 0) {
      var scramble = scrambles[options[0]];
      var i,
        scrambled = scramble.cube.scramble(),
        len = Math.min(scramble.len, scrambled.length),
        result = "";
      for (i = 0; i < len; i += 5) {
        // Only allow a line break every 5 moves
        result += scrambled.slice(i, i + 5).join("&nbsp;") + " ";
      }
      $('#scramble').html(I18nUtils.translate('scrambleLabel', [result]));
    } else {
      $('#scramble').html(I18nUtils.translate('scrambleLabelNone'));
    }
  }

  handleI18nStarted(event) {
    this.scramble(this.sandbox.activePuzzle());
  }
}
