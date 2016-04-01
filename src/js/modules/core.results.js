var core = require('../core.js');
var dao = require('../dao.js');
var misc = require('../utils/misc.js');
var Category = require('../utils/category.js');

core.register(
    'Results',
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

            if(window.location.hash == '#results') {
                sandbox.goToPage('results');
            }

            $('.results-button')
                .css('display', 'block')
                .on('click', function(e) {
                    module.updateDates();
                    sandbox.goToPage('results');
                });

            module.updateResults(sandbox.activeGame());
        };

        module.handleResultsChanged = function(event) {
            module.updateResults(event.data);
        };

        module.removeResult = function(element) {
            element = $(element);
            var game = element.data('game');
            var resultId = element.data('resultId');
            dao.removeScore(
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

        module.createContainer = function() {
            var container = $('#results-content .template.result-container')
                .clone()
                .removeClass('template');
            $('#results-content .times-content').append(container);
            return container;
        };

        module.createResult = function(result, index) {
            var row = $('#results-content .template.result-item').clone();

            row.attr('id', 'id-' + result.id);
            row.removeClass('template');
            row
                .find('.value')
                .text(misc.defaultFormatMilliseconds(result.value));
            row
                .find('.index')
                .text('#' + index);
            row
                .find('.date')
                .text(misc.toDate(result.id)).data('date', result.id);
            row
                .find('.btn-remove')
                .data('game', sandbox.activeGame())
                .data('resultId', result.id)
                .on('click', function(event) {
                    module.removeResult(this);
                });

            return row;
        };

        module.createDate = function(date) {
            return $('#results-content .template.result-header')
                .clone()
                .removeClass('template')
                .html(date);
        };

        module.updateResults = function(game) {
            console.log(
                '%s.updateResults(game=%s)',
                module.id,
                game
            );
            $('#results-content .times-content > *').remove();
            dao.retrieveScores(game, function(results) {
                var result;
                var latestDate = '', date;
                var parentContainer = $('#results-content .times-content');
                var container;
                for (var i = 0; i < results.length; i++) {
                    result = results[results.length - i - 1];
                    date = misc.toDate(result.id);
                    if(date !== latestDate) {
                        parentContainer.append(module.createDate(date));
                        container = module.createContainer();
                        latestDate = date;
                    }
                    container.append(
                        module.createResult(result, results.length - i)
                    );
                }
                module.update(results);
            });
        };

        module.update = function(results) {
            module.updateDates();
            module.updateLabels(results);
        };

        module.updateDates = function() {
            $('#results-content .times-content > * .date').each(function() {
                var that = $(this);
                that.text(misc.toDate(that.data('date')));
            });
        };

        module.mark = function(result, text, type_) {
            $('#id-' + result.id + ' .tags')
                .append(' <span class="label label-' + type_ + '">' + text + '</span>');
        };

        module.updateLabels = function(results) {
            dao.getConfig('subtext', true, function(markSubX) {
                var result,
                    best = {id: 0, value: 999999999},
                    best5 = {id: 0, value: 999999999},
                    best12 = {id: 0, value: 999999999},
                    sub;

                // Remove first
                $('#results-content .label').remove();

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