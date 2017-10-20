import 'reflect-metadata';

require('html-loader!../index.html');

require('materialize-loader');
require('../css/content.css');
require('../css/core.export.css');
require('../css/core.google.css');
require('../css/core.hint.css');
require('../css/core.import.css');
require('../css/core.navbar.css');
require('../css/core.puzzle.css');
require('../css/core.results.css');
require('../css/core.stopwatch.css');
require('../css/material.css');
require('../css/nprogress.css');
require('../css/page.css');
require('../css/sharing.css');
require('../css/theme.css');
require('../css/timer.css');
require('../css/zmedia.css');

const core = require('./core.js');

require('./utils/array.js');
require('./utils/modal.js');
require('./utils/element.js');

require('./modules/core.achievement.js');
require('./modules/core.stopwatch.js');
require('./modules/core.config.js');
require('./modules/core.chart.js');
require('./modules/core.i18n.js');
require('./modules/core.scramble.js');
require('./modules/core.puzzles.js');
require('./modules/core.navbar.js');
require('./modules/core.results.js');
require('./modules/core.export.js');
require('./modules/core.import.js');
require('./modules/core.routes.js');
require('./modules/core.discovery.js');

require('./modules/core.firebase.js');

core.init();
