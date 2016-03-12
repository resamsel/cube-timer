Core.register(
    'Config',
    function(sandbox) {
        var module = {};

        module.init = function() {
            getConfig('subtext', true, function(subtext) {
                $('#subtext')
                    .prop('checked', subtext)
                    .on('click', function(e) {
                        storeConfig(
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
            getConfig('inspectionTime', 0, function(inspectionTime) {
                $('#inspectionTime')
                    .val(inspectionTime)
                    .change(function() {
                        storeConfig('inspectionTime', Number($(this).val()));
                    });
            });
            getConfig('soundAfterInspection', false, function(soundAfterInspection) {
                $('#soundAfterInspection')
                    .prop('checked', soundAfterInspection)
                    .on('click', function(e) {
                        storeConfig('soundAfterInspection', e.target.checked);
                    }
                );
            });

            $('.config-button').css('display', 'block');
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
