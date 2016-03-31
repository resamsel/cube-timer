var core = require('../core.js');
//var $ = require('jquery');
//var Materialize = require('materialize-css');

core.register(
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
            var gameList = sideNav.find('.game-list');
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
                .parent()
                .addClass('collapsible')
                .attr('data-collapsible', 'accordion');
            $('.collapsible').collapsible();
        };

        return module;
    }
);