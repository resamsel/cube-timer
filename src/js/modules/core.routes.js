import Module from './core.module';
import routes from '../utils/routes';

export default class HashChange extends Module {
	static get id() {
    return 'HashChange';
  }

	constructor(sandbox) {
		super(HashChange.id, sandbox);
	}

	init() {
		window.onhashchange = this.handleHashChange.bind(this);

		this.handleHashChange();

		if(!window.location.hash.startsWith('#!')) {
			var puzzle = this.sandbox.activePuzzle();
			var page = this.sandbox.activePage();
			window.location.hash = routes.encode(puzzle, page);
		}
	}

	handleHashChange() {
		if(window.location.hash.startsWith('#!')) {
			this.sandbox.goToPage(window.location.hash.substring(2));
		}
	}
}
