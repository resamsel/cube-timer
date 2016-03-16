Core.register(
    'Achievement',
    function(sandbox) {
        var module = {};
        var defaultTimeout = 7000;
        var sleepBetweenToasts = 400;

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

                module.toastAchievement(result, stats);

                setTimeout(
                    function() {
                        module.toastPercentile(result, stats);
                    },
                    sleepBetweenToasts
                );
            });
        };

        module.toastAchievement = function(result, stats) {
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
            if(result.value < stats.latest50.avg()) {
                Materialize.toast(
                    'Better than average of last 50',
                    defaultTimeout
                );
                return;
            }
            if(result.value < stats.avg80.avg()) {
                Materialize.toast(
                    'Better than average of best 80%',
                    defaultTimeout
                );
                return;
            }
            if(result.value < stats.avg) {
                Materialize.toast('Better than average', defaultTimeout);
                return;
            }
        };

        module.toastPercentile = function(result, stats) {
            var index = stats.values.binaryIndexOf(result.value);
            var normalized = Math.abs(index)/Math.max(stats.values.length-1, 1);
            var percent = Math.round(100-(normalized)*100);
            Materialize.toast(
                'Better than ' + percent + '% of previous results',
                defaultTimeout
            );
        };

        return module;
    }
);
