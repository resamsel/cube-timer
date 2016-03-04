/*
 * Create the list of games in the header bar.
 */
function populateGames() {
    retrieveGames(function(games) {
        retrieveActiveGame(function(activeGame) {
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
                clone.bind('click', handleActivateGame(game));

                if(game == activeGame) {
                    clone.addClass('active');
                }

                // 3. Add it to the game list
                gameList.append(clone);
            }

            populateActiveGame(activeGame);
        });
    });
}

function handleActivateGame(game) {
    return function() {
        storeActiveGame(game);
    };
}

function handleGameActivated(game) {
    config.activeGame = game;
    populateActiveGame(game);
    updateScores();
    scramble(game);
}

function populateActiveGame(game) {
    $('#game-list .active').removeClass('active');
    $('#game-list .game-' + game).addClass('active');
    $('#active-game .text').text(game);
    $('.panel-timer .panel-title > span').text(game);
}

function scramble(game) {
    console.log('scramble(game=%s)', game);
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
}
