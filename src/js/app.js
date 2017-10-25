//import './service-worker-loader.js'

import 'html-loader!../index.html';

import 'materialize-loader';
import '../css/content.css';
import '../css/nprogress.css';
import '../css/page.css';
import '../css/sharing.css';
import '../css/theme.css';
import '../css/timer.css';
import '../css/zmedia.css';

import './material';
import './utils/array';
import './utils/element';

import core from './core';

import Achievement from './modules/core.achievement';
import Chart from './modules/core.chart';
import Config from './modules/core.config';
import Discovery from './modules/core.discovery';
import Export from './modules/core.export';
import Firebase from './modules/core.firebase';
import I18n from './modules/core.i18n';
import Import from './modules/core.import';
import Navbar from './modules/core.navbar';
import Puzzles from './modules/core.puzzles';
import Results from './modules/core.results';
import Routes from './modules/core.routes';
import Scramble from './modules/core.scramble';
import Stopwatch from './modules/core.stopwatch';

core.register(Achievement.id, Achievement);
core.register(Chart.id, Chart);
core.register(Config.id, Config);
core.register(Discovery.id, Discovery);
core.register(Export.id, Export);
core.register(Firebase.id, Firebase);
core.register(I18n.id, I18n);
core.register(Import.id, Import);
core.register(Navbar.id, Navbar);
core.register(Puzzles.id, Puzzles);
core.register(Results.id, Results);
core.register(Routes.id, Routes);
core.register(Scramble.id, Scramble);
core.register(Stopwatch.id, Stopwatch);

core.init();
