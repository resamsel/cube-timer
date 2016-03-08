Core.register(
    "game",
    function(sandbox) {
        var module = {};

        module.init = function() {
            sandbox.listen(
                ['game-changed'],
                module.handleGameChanged,
                module
            );

            $('#active-game').css('display', 'block');

            module.populateGames();
        };

        module.handleGameChanged = function(event) {
            var game = event.data;

            $('#game-list .active').removeClass('active');
            $('#game-list .game-' + game).addClass('active');
            $('#active-game .text').text(game);
            $('.panel-timer .panel-title > span').text(game);
        };

        /*
         * Create the list of games in the header bar.
         */
        module.populateGames = function() {
            retrieveGames(function(games) {
                var activeGame = sandbox.activeGame();
                var gameList = $('#game-list');
                var template = gameList.find('.template'),
                    clone,
                    game;

                for(var i = 0; i < games.length; i++) {
                    game = games[i];

                    // 1. Clone template
                    clone = template.clone();

                    // 2. Update clone
                    clone.removeClass('template').addClass('game-' + game);
                    clone.find('a').text(game);
                    clone.bind('click', module.activateGame(game));

                    if(game == activeGame) {
                        clone.addClass('active');
                    }

                    // 3. Add it to the game list
                    gameList.append(clone);
                }
            });
        };

        module.activateGame = function(game) {
            return function() {
                sandbox.activeGame(game);
            };
        };

        return module;
    }
);
