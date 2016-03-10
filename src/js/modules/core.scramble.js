Core.register(
    'Scramble',
    function(sandbox) {
        var module = {};
        var scrambles = {
            '2x2x2': { len: 15 },
            '3x3x3': { len: 25 }
        };

        module.init = function() {
            sandbox.listen(
                ['game-changed'],
                module.handleGameChanged,
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

            cube.reset();

            module.scramble(sandbox.activeGame());
        };

        module.handleGameChanged = function(event) {
            module.scramble(event.data);
        };

        module.handleResultCreated = function(event) {
            module.scramble(sandbox.activeGame());
        };

        module.scramble = function(game) {
            if (Object.keys(scrambles).indexOf(game) > -1) {
                var i,
                    scrambled = cube.scramble(),
                    len = Math.min(scrambles[game].len, scrambled.length),
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
            module.scramble(sandbox.activeGame());
        };

        return module;
    }
);
