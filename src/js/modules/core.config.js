var core = require('../core.js');
var dao = require('../dao.js');
//var $ = require('jquery');

core.register(
	'Config',
	function(sandbox) {
		var module = {};
		var $inspectionTime;
		var $subtext;
		var $soundAfterInspection;
		var $windowSize;
		var configListeners;

		module.init = function() {
			configListeners = {
				inspectionTime: module.handleInspectionTimeChanged,
				subtext: module.handleSubtextChanged,
				soundAfterInspection: module.handleSoundAfterInspectionChanged
			};

			sandbox.listen(
				['page-changed'],
				module.handlePageChanged,
				module
			);
			sandbox.listen(
				['puzzle-changed'],
				module.handlePuzzleChanged,
				module
			);

			$inspectionTime = $('#inspectionTime');
			$inspectionTime.change(function() {
				dao.storeConfig('inspectionTime', Number($(this).val()));
			});
			dao.listen(
				['config-changed'],
				'inspectionTime',
				module.handleInspectionTimeChanged
			);

			$subtext = $('#subtext');
			$subtext.on('click', function(e) {
				dao.storeConfig('subtext', e.target.checked);
			});
			dao.listen(
				['config-changed'],
				'subtext',
				module.handleSubtextChanged
			);

			$soundAfterInspection = $('#soundAfterInspection');
			$soundAfterInspection.on('click', function(e) {
				dao.storeConfig('soundAfterInspection', e.target.checked);
			});
			dao.listen(
				['config-changed'],
				'soundAfterInspection',
				module.handleSoundAfterInspectionChanged
			);

			$windowSize = $('#windowSize');
			$windowSize.on('change', function(e) {
				dao.storeConfig('windowSize', $(e.target).val());
			});
			dao.listen(
				['config-changed'],
				'windowSize',
				module.handleWindowSizeChanged
			);

			$('.config-button').css('display', 'block');
		};

		module.handlePageChanged = function(event) {
			if(event.data == 'config') {
				$('.config-button').parent().addClass('active');
			} else {
				$('.config-button').parent().removeClass('active');
			}
		};

		module.handlePuzzleChanged = function(event) {
			Object.keys(configListeners).forEach(function(key) {
				var listener = configListeners[key];
				dao.unlisten(['config-changed'], listener);
				dao.listen(['config-changed'], key, listener);
			});
		};

		module.handleInspectionTimeChanged = function(inspectionTime) {
			if(inspectionTime === null) {
				inspectionTime = 0;
			}
			$inspectionTime.val(inspectionTime);
		};

		module.handleSubtextChanged = function(subtext) {
			if(subtext === null) {
				subtext = true;
			}
			$subtext.prop('checked', subtext);
		};

		module.handleSoundAfterInspectionChanged = function(soundAfterInspection) {
			if(soundAfterInspection === null) {
				soundAfterInspection = false;
			}
			$soundAfterInspection.prop('checked', soundAfterInspection);
		};

		module.handleWindowSizeChanged = function(windowSize) {
			if(windowSize === null) {
				windowSize = 50;
			}
			$windowSize.val(windowSize);
		};

		return module;
	}
);