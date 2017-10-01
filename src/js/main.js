require('./utils/array.js');
require('./utils/modal.js');
var core = require('./core.js');

require('./modules/core.achievement.js');
require('./modules/core.stopwatch.js');
require('./modules/core.config.js');
require('./modules/core.chart.js');
require('./modules/core.i18n.js');
require('./modules/core.scramble.js');
require('./modules/core.puzzle.js');
require('./modules/core.navbar.js');
require('./modules/core.results.js');
require('./modules/core.export.js');
require('./modules/core.import.js');
require('./modules/core.routes.js');
require('./modules/core.discovery.js');

require('./modules/core.firebase.js');

core.init();