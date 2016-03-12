Core.register(
    'Navbar',
    function(sandbox) {
        var module = {};

        module.init = function() {
            sandbox.listen(
                ['game-list-created'],
                module.handleGameListCreated,
                module
            );

            $(".button-collapse").sideNav();
        };

        module.handleGameListCreated = function(event) {
            var sideNav = $('nav .side-nav');
            $('nav .main-nav > li').each(function(index) {
                sideNav.append($(this).clone());
            });
            var gameList = sideNav
                .find('.game-list')
                .removeAttr('id')
                .addClass('collapsible-body')
                .removeClass('dropdown-content');
            gameList.find('li').each(function() {
                var game = $(this).attr('class').replace('game-', '').replace('active', '').trim();
                $(this).on('click', function () {
                    sandbox.activeGame(game);
                });
            });

            sideNav
                .find('.active-game')
                .addClass('collapsible-header')
                .parent()
                .append(gameList)
                .parent()
                .addClass('collapsible')
                .attr('data-collapsible', 'accordion');
            $('.collapsible').collapsible();
        };

        return module;
    }
);
