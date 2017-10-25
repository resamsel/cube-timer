import Module from './core.module';
import {
  encodeKey
} from '../utils/misc';

var misc = require('../utils/misc');
var $ = require('jquery');
require('materialize-css');

import '../../css/core.navbar.css';

export default class Navbar extends Module {
  static get id() {
    return 'Navbar';
  }

  constructor(sandbox) {
    super(Navbar.id, sandbox);

    this.body = null;
  }

  init() {
    this.body = $('body');

    this.listen(['page-changed'], this.handlePageChanged);
    this.listen(['main-menu-click'], this.handleMainMenuClick);
    this.listen(['main-menu-closed'], this.handleMainMenuClosed);

    $('#main-menu').on('click', this.handleMainMenuClick.bind(this));
    $(".button-collapse").sideNav();
    $('.collapsible').collapsible();
  };

  handlePageChanged(event) {
    $('#main-menu').attr(
      'href',
      '#!' + encodeKey(this.sandbox.activePuzzle()) + '/' + event.data
    ).blur();
    if (document.activeElement.nodeName != 'BODY') {
      document.activeElement.blur();
    }
  }

  handleMainMenuClick() {
    if ($('#sidenav-overlay').length > 0) {
      this.handleMainMenuClosed();
    } else {
      this.handleMainMenuOpened();
    }
    if (document.activeElement.nodeName != 'BODY') {
      document.activeElement.blur();
    }
  }

  handleMainMenuOpened() {
    //this.body.addClass('menu-active');
  }

  handleMainMenuClosed() {
    //this.body.removeClass('menu-active');
  }
}
