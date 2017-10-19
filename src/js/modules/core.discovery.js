var core = require('../core.js');
var dao = require('../dao.js');
var $ = require('jquery');

core.register(
	'Hint',
	function(sandbox) {
		var module = {};

		module.init = function() {
			dao.listen(
				['config-changed'],
				'hintVisible',
				module.handleHintVisibleChanged
			);

			$('#hint-spacebar').hide();
			$('#hint-spacebar .btn-close').on(
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
				$('#hint-spacebar').fadeIn();
			} else {
				$('#hint-spacebar').fadeOut();
			}
		};

		return module;
	}
);
