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

		module.init = function() {
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
				.on('click', function(e) {
					sandbox.goToPage('config');
				})
				.css('display', 'block');
		};

		module.handleGameChanged = function(event) {
			dao.unlisten(['config-changed'], module.handleInspectionTimeChanged);

			dao.listen(
				['config-changed'],
				'inspectionTime',
				module.handleInspectionTimeChanged
			);
			dao.listen(
				['config-changed'],
				'subtext',
				module.handleSubtextChanged
			);
			dao.listen(
				['config-changed'],
				'soundAfterInspection',
				module.handleSoundAfterInspectionChanged
			);
		};

		module.handleInspectionTimeChanged = function(inspectionTime) {
			$inspectionTime.val(inspectionTime);
		};

		module.handleSubtextChanged = function(subtext) {
			$subtext.prop('checked', subtext);
		};

		module.handleSoundAfterInspectionChanged = function(soundAfterInspection) {
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