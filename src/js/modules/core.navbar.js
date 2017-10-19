var core = require('../core.js');
var misc = require('../utils/misc.js');
var $ = require('jquery');
var Materialize = require('materialize-css');

core.register(
    'Navbar',
    function(sandbox) {
        var module = {};

        module.init = function() {
            sandbox.listen(
                ['page-changed'],
                module.handlePageChanged,
                module
            );
            sandbox.listen(
                ['main-menu-click'],
                module.handleMainMenuClick,
                module
            );
            sandbox.listen(
                ['main-menu-closed'],
                module.handleMainMenuClosed,
                module
            );

            $('#main-menu').on('click', module.handleMainMenuClick);
            $(".button-collapse").sideNav();
            $('.collapsible').collapsible();
        };

        module.handlePageChanged = function(event) {
            $('#main-menu').attr('href', '#!'+misc.encodeKey(sandbox.activePuzzle())+'/'+event.data).blur();
            if(document.activeElement.nodeName != 'BODY') {
                document.activeElement.blur();
            }
        };

        module.handleMainMenuClick = function() {
            var body = $('body');
            if($('#sidenav-overlay').length > 0) {
                module.handleMainMenuClosed();
            } else {
                module.handleMainMenuOpened();
            }
            if(document.activeElement.nodeName != 'BODY') {
                document.activeElement.blur();
            }
        };

        module.handleMainMenuOpened = function() {
            //$('body').addClass('menu-active');
        };

        module.handleMainMenuClosed = function() {
            //$('body').removeClass('menu-active');
        };

        return module;
    }
);
