Core.register(
    "scramble",
    function(sandbox) {
        var module = {};

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

            cube.reset();

            module.scramble(config.game);
        };

        module.handleGameChanged = function(event) {
            module.scramble(event.data);
        };

        module.handleResultCreated = function(event) {
            module.scramble(config.game);
        }

        module.scramble = function(game) {
            if (Object.keys(config.scrambles).indexOf(game) > -1) {
                var i,
                    scrambled = cube.scramble(),
                    len = Math.min(config.scrambles[game].len, scrambled.length),
                    result = "";
                for (i = 0; i < len; i += 5) {
                    // Only allow a line break every 5 moves
                    result += scrambled.slice(i, i + 5).join("&nbsp;") + " ";
                }
                $('#scramble').html(translate('scrambleLabel', [result]));
            } else {
                $('#scramble').html(translate('scrambleLabelNone'));
            }
        };

        return module;
    }
);
