export default class DefaultDAO {
  get(key, callback, context) {
    return new Promise(function(resolve, reject) {
      resolve(null);
    });
  }
  set(key, value, callback, context) {
    return new Promise(function(resolve, reject) {
      resolve(value);
    });
  }
  remove(key, callback, context) {
    return new Promise(function(resolve, reject) {
      resolve();
    });
  }
}
