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

const core = require('./core');

require('./utils/array');
require('./utils/modal');
require('./utils/element');

require('./modules/core.achievement');
require('./modules/core.stopwatch');
require('./modules/core.config');
require('./modules/core.chart');
require('./modules/core.i18n');
require('./modules/core.scramble');
require('./modules/core.puzzles');
require('./modules/core.navbar');
require('./modules/core.results');
require('./modules/core.export');
require('./modules/core.import');
require('./modules/core.routes');
require('./modules/core.discovery');

require('./modules/core.firebase');

core.init();
