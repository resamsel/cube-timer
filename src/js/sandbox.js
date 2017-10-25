import * as Category from './utils/category';
import { scoreValue, compareNumbers } from './utils/misc';

export default class Sandbox {
  constructor(core) {
    this.core = core;
  }
  notify(event) {
    this.core.notify(event);
  }
  listen(types, handler, module) {
    this.core.listen(types, handler, module);
  }
  activePuzzle(puzzle) {
    return this.core.activePuzzle(puzzle);
  }
  goToPage(page) {
    this.core.goToPage(page);
  }
  activePage() {
    return this.core.activePage();
  }

  // FIXME: Helper function, move to utils
  createStats(scores) {
    if (!scores) {
      scores = [];
    }

    var stats = {
      scores: scores
    };

    if (!scores || scores.length < 1) {
      return stats;
    }

    stats.values = scores.map(scoreValue);
    stats.latest = stats.values.last();
    stats.latest5 = stats.values.slice(-5).sort(compareNumbers);
    stats.latest12 = stats.values.slice(-12).sort(compareNumbers);
    stats.latest50 = stats.values.slice(-50).sort(compareNumbers);
    stats.best3of5 = stats.latest5.slice(0, 3).sort(compareNumbers);
    stats.best10of12 = stats.latest12.slice(0, 10).sort(compareNumbers);

    stats.values.sort(compareNumbers);

    stats.best = stats.values.first();
    stats.avg = stats.values.avg();
    stats.avg80 = stats.values.slice(
      0,
      Math.max(1, Math.floor(scores.length * 0.8))
    );

    stats.categories = this.createCategories(stats.values);

    return stats;
  }

  // FIXME: Helper function, move to utils
  createCategories(values) {
    var categories = {};

    values.forEach(function(value) {
      var category = Category.fromValue(value);
      if (!(category in categories)) {
        categories[category] = 0;
      }
      categories[category]++;
    });

    return categories;
  }
}
