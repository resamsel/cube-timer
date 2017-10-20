var core = require('../core.js');
var dao = require('../dao.js');

core.register(
	'Hint',
	function(sandbox) {
		var module = {};
		var $hintSpacebar;
		var hintSpacebar;

		module.init = function() {
			$hintSpacebar = document.getElementById('hint-spacebar');
			$hintSpacebar.hide();

			dao.listen(
				['config-changed'],
				'hintVisible',
				module.handleHintVisibleChanged
			);
			document.querySelector('#hint-spacebar .btn-close').on(
				'click',
				module.handleSpacebarClose
			);
		};

		module.handleSpacebarClose = function() {
			dao.storeConfig(
				'hintVisible',
				false,
				module.handleHintVisibleChanged
			);
		};

		module.handleHintVisibleChanged = function(hintVisible) {
			if(hintVisible === null) {
				hintVisible = true;
			}
			if(hintVisible) {
				$hintSpacebar.fadeIn();
			} else {
				$hintSpacebar.fadeOut();
			}
		};

		return module;
	}
);
