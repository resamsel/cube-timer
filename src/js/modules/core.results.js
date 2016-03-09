Core.register(
    "results",
    function(sandbox) {
        var module = {};

        module.init = function() {
            sandbox.listen(
                ['config-subtext-changed'],
                module.updateLabels,
                module
            );
            sandbox.listen(
                ['results-changed', 'game-changed'],
                module.handleResultsChanged,
                module
            );

            $('#results-button').css('display', 'block');

            module.updateResults(sandbox.activeGame());
        };

        module.handleResultsChanged = function(event) {
            module.updateResults(event.data);
        };

        module.showResult = function(result) {
            var row = $('#times .template').clone();

            row.attr('id', 'id-' + result.id);
            row.removeClass('template');
            row
                .find('.value')
                .text(defaultFormatMilliseconds(result.value));
            row
                .find('.date')
                .text(toDate(result.id)).data('date', result.id);
            row
                .find('.btn-remove')
                .data('game', sandbox.activeGame())
                .data('resultId', result.id)
                .bind('click', function(event) {
                    module.removeResult(this);
                });

            $('#times .times-content').prepend(row);
        };

        module.removeResult = function(element) {
            element = $(element);
            var game = element.data('game');
            var resultId = element.data('resultId');
            removeScore(
                game,
                resultId,
                module.handleRemoveResult(element, game, resultId)
            );
        };

        module.handleRemoveResult = function (element, game, resultId) {
            return function() {
                $('#id-' + resultId).fadeOut({
                    complete: function() {
                        element.remove();
                        sandbox.notify({
                            type: 'results-changed',
                            data: game
                        });
                    }
                });
            };
        };

        module.updateResults = function(game) {
            console.log(
                '%s.updateResults(game=%s)',
                module.id,
                game
            );
            $('#times .times-content > *').remove();
            retrieveScores(game, function(results) {
                for (var i = 0; i < results.length; i++) {
                    module.showResult(results[i]);
                }
                module.update(results);
            });
        };

        module.update = function(results) {
            module.updateIndex();
            module.updateDates();
            module.updateLabels(results);
        };

        module.updateIndex = function() {
            var max = $('#times .times-content > *').length + 1;
            for(var i = 0; i < max; i++) {
                $('#times .times-content *:nth-child(' + i + ') .index').
                    text((max - i) + '.');
            }
        };

        module.updateDates = function() {
            $('#times .times-content > * .date').each(function() {
                var that = $(this);
                that.text(toDate(that.data('date')));
            });
        };

        module.mark = function(result, text, type_) {
            $('#id-' + result.id + ' .tags')
                .append(' <span class="label label-' + type_ + '">' + text + '</span>');
        };

        module.updateLabels = function(results) {
            getConfig('subtext', true, function(markSubX) {
                var result,
                    best = {id: 0, value: 999999999},
                    best5 = {id: 0, value: 999999999},
                    best12 = {id: 0, value: 999999999},
                    sub;

                // Remove first
                $('#times .label').remove();

                for (var i = 0; i < results.length; i++) {
                    result = results[i];
                    if (result.value < best.value) {
                        best = result;
                    }
                    if ((results.length - i - 1) < 5 && result.value < best5.value) {
                        best5 = result;
                    }
                    if ((results.length - i - 1) < 12 && result.value < best12.value) {
                        best12 = result;
                    }
                    if(markSubX) {
                        sub = Category.fromValue(result.value);
                        if (sub > 0) {
                            module.mark(result, 'sub ' + sub, 'info');
                        }
                    }
                }

                // Then mark
                module.mark(best, 'best', 'success');
                module.mark(best5, 'best #5', 'success');
                module.mark(best12, 'best #12', 'success');
            });
        };

        return module;
    }
);
