export default class ChromeDAO {
  get(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, function(v) {
        var value = v[key];
        if (typeof(value) !== 'undefined') {
          value = JSON.parse(v[key]);
        }
        resolve(value);
      });
    });
  }

  set(key, value) {
    return new Promise((resolve, reject) => {
      var obj = {};
      obj[key] = JSON.stringify(value);
      chrome.storage.local.set(obj, resolve);
    })
  }

  remove(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(key, resolve);
    });
  }
}
