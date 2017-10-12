var core = require('../core.js');
var misc = require('../utils/misc.js');

core.register(
	'HashChange',
	function(sandbox) {
		var module = {};

		module.init = function() {
			window.onhashchange = module.handleHashChange;

			module.handleHashChange();

			if(!window.location.hash.startsWith('#!')) {
				var puzzle = sandbox.activePuzzle();
				var page = sandbox.activePage();
				window.location.hash = '#!' + misc.encodeKey(puzzle) + '/' + page;
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
