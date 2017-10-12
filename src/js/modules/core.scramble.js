var core = require('../core.js');
var I18n = require('../utils/i18n.js');
var Cube = require('../external/rubiks-cube-scrambler.js');
//var $ = require('jquery');

core.register(
    'Scramble',
    function(sandbox) {
        var module = {};
        var scrambles = {
            '2x2x2': { cube: Cube['3x3x3'], len: 15 },
            '3x3x3': { cube: Cube['3x3x3'], len: 25 }
        };

        module.init = function() {
            sandbox.listen(
                ['puzzle-changed'],
                module.handlePuzzleChanged,
                module
            );
            sandbox.listen(
                ['result-created'],
                module.handleResultCreated,
                module
            );
            sandbox.listen(
                ['i18n-started'],
                module.handleI18nStarted,
                module
            );

            Cube['3x3x3'].reset();

            module.scramble(sandbox.activePuzzle());
        };

        module.handlePuzzleChanged = function(event) {
            module.scramble(event.data);
        };

        module.handleResultCreated = function(event) {
            module.scramble(sandbox.activePuzzle());
        };

        module.scramble = function(puzzle) {
            if (Object.keys(scrambles).indexOf(puzzle) > -1) {
                var scramble = scrambles[puzzle];
                var i,
                    scrambled = scramble.cube.scramble(),
                    len = Math.min(scramble.len, scrambled.length),
                    result = "";
                for (i = 0; i < len; i += 5) {
                    // Only allow a line break every 5 moves
                    result += scrambled.slice(i, i + 5).join("&nbsp;") + " ";
                }
                $('#scramble').html(I18n.translate('scrambleLabel', [result]));
            } else {
                $('#scramble').html(I18n.translate('scrambleLabelNone'));
            }
        };

        module.handleI18nStarted = function(event) {
            module.scramble(sandbox.activePuzzle());
        };

        return module;
    }
);