var core = require('../core.js');

core.register(
	'HashChange',
	function(sandbox) {
		var module = {};

		module.init = function() {
			window.onhashchange = module.handleHashChange;

			module.handleHashChange();

			if(!window.location.hash.startsWith('#!')) {
				var game = sandbox.activeGame();
				var page = sandbox.activePage();
				window.location.hash = '#!' + game + '/' + page;
			}
		};

		module.handleHashChange = function() {
			if(window.location.hash.startsWith('#!')) {
				sandbox.goToPage(window.location.hash.substring(2));
			}
		};

		return module;
	}
);
