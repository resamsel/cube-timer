Core.register(
    'Achievement',
    function(sandbox) {
        var module = {};
        var defaultTimeout = 4000;

        module.init = function() {
            sandbox.listen(
                ['result-created'],
                module.handleResultCreated,
                module
            );
        };

        module.handleResultCreated = function(event) {
            var result = event.data;
            retrieveScores(sandbox.activeGame(), function(results) {
                var stats = sandbox.createStats(results);
                if(result.value <= stats.best) {
                    Materialize.toast('New best!', defaultTimeout);
                    return;
                }
                stats.latest50.sort(compareNumbers);
                if(result.value <= stats.latest50.first()) {
                    Materialize.toast('Best of last 50!', defaultTimeout);
                    return;
                }
                stats.latest12.sort(compareNumbers);
                if(result.value <= stats.latest12.first()) {
                    Materialize.toast('Best of last 12!', defaultTimeout);
                    return;
                }
                stats.latest5.sort(compareNumbers);
                if(result.value <= stats.latest5.first()) {
                    Materialize.toast('Best of last 5!', defaultTimeout);
                    return;
                }
                if(result.value < stats.avg80.avg()) {
                    Materialize.toast(
                        'Better than average of best 80%',
                        defaultTimeout
                    );
                    return;
                }
                if(result.value < stats.latest50.avg()) {
                    Materialize.toast(
                        'Better than average of last 50',
                        defaultTimeout
                    );
                    return;
                }
                if(result.value < stats.avg) {
                    Materialize.toast('Better than average', defaultTimeout);
                    return;
                }
            });
        };

        return module;
    }
);
