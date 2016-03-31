var core = require('../core.js');
var dao = require('../dao.js');
//var $ = require('jquery');

core.register(
    'Config',
    function(sandbox) {
        var module = {};

        module.init = function() {
            dao.getConfig('subtext', true, function(subtext) {
                $('#subtext')
                    .prop('checked', subtext)
                    .on('click', function(e) {
                        dao.storeConfig(
                            'subtext',
                            e.target.checked,
                            module.handleConfigStored(
                                'subtext',
                                e.target.checked
                            )
                        );
                    }
                );
            });
            dao.getConfig('inspectionTime', 0, function(inspectionTime) {
                $('#inspectionTime')
                    .val(inspectionTime)
                    .change(function() {
                        dao.storeConfig('inspectionTime', Number($(this).val()));
                    });
            });
            dao.getConfig('soundAfterInspection', false, function(soundAfterInspection) {
                $('#soundAfterInspection')
                    .prop('checked', soundAfterInspection)
                    .on('click', function(e) {
                        dao.storeConfig('soundAfterInspection', e.target.checked);
                    }
                );
            });

            $('.config-button')
                .on('click', function(e) {
                    sandbox.goToPage('config');
                })
                .css('display', 'block');

            if(window.location.hash == '#config') {
                sandbox.goToPage('config');
            }
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