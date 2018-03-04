export default class LocalDAO {
  get(key) {
    return new Promise(function(resolve, reject) {
      var value = localStorage.getItem(key);
      if (typeof(value) !== 'undefined') {
        value = JSON.parse(value);
      }
      resolve(value);
    });
  }
  set(key, value) {
    return new Promise(function(resolve, reject) {
      localStorage.setItem(key, JSON.stringify(value));
      resolve(value);
    });
  }
  remove(key) {
    return new Promise(function(resolve, reject) {
      localStorage.removeItem(key);
      resolve();
    });
  }
}
