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
				['game-changed'],
				module.handleGameChanged,
				module
			);

			$inspectionTime = $('#inspectionTime');
			$inspectionTime.change(function() {
				dao.storeConfig('inspectionTime', Number($(this).val()));
			});
			dao.getConfig('inspectionTime', 0, module.handleInspectionTimeChanged);

			$subtext = $('#subtext');
			$subtext.on('click', function(e) {
				dao.storeConfig(
					'subtext',
					e.target.checked,
					module.handleConfigStored(
						'subtext',
						e.target.checked
					)
				);
			});
			dao.getConfig('subtext', true, module.handleSubtextChanged);

			$soundAfterInspection = $('#soundAfterInspection');
			$soundAfterInspection.on('click', function(e) {
				dao.storeConfig('soundAfterInspection', e.target.checked);
			});
			dao.getConfig('soundAfterInspection', false, module.handleSoundAfterInspectionChanged);

			$('.config-button')
				.css('display', 'block');
		};

		module.handlePageChanged = function(event) {
			if(event.data == 'config') {
				$('.config-button').parent().addClass('active');
			} else {
				$('.config-button').parent().removeClass('active');
			}
		};

		module.handleGameChanged = function(event) {
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

		module.handleConfigStored = function(key, value) {
			return function() {
				sandbox.notify({
					type: 'config-' + key + '-changed',
					data: value
				});
			};
		};

		return module;
	}
);