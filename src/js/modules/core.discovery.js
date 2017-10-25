import Module from './core.module';
var dao = require('../dao');
import '../../css/core.discovery.css';

export default class Discovery extends Module {
	static get id() {
    return 'Discovery';
  }

  constructor(sandbox) {
		super(Discovery.id, sandbox);
    this.$hintSpacebar = null;
    this.hintSpacebar = null;
  }

  init() {
    this.$hintSpacebar = document.getElementById('hint-spacebar');
    this.$hintSpacebar.hide();

    dao.subscribe(
      ['config-changed'],
      'hintVisible',
      this.handleHintVisibleChanged,
			this
    );
    document.querySelector('#hint-spacebar .btn-close').on(
      'click',
      this.handleSpacebarClose.bind(this)
    );
  }

  handleSpacebarClose() {
    dao.storeConfig(
      'hintVisible',
      false,
      this.handleHintVisibleChanged.bind(this)
    );
  }

  handleHintVisibleChanged(hintVisible) {
    if (hintVisible === null) {
      hintVisible = true;
    }
    if (hintVisible) {
      this.$hintSpacebar.fadeIn();
    } else {
      this.$hintSpacebar.fadeOut();
    }
  }
}
