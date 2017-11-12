import {
  encodeKey,
  decodeKey
} from './misc';

class Routes {
  encode(puzzle, page) {
    if (puzzle) {
      return `#!${page}/${encodeKey(puzzle)}`;
    }
    return `#!${page}`;
  }

  decode(route) {
    const r = {
      route,
      page: null,
      puzzle: null
    };
    const parts = route.split('/');
    if(parts.length > 0) {
      r.page = parts[0];
    }
    if (parts.length > 1) {
      r.puzzle = decodeKey(parts[1]);
    }
    return r;
  }
}

export default new Routes();
