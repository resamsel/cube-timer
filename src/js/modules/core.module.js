export default class Module {
  constructor(id, sandbox) {
    this.id = id;
    this.sandbox = sandbox;
  }
  listen(types, handler) {
    this.sandbox.listen(types, handler.bind(this), this);
  }
  notify(event) {
    this.sandbox.notify(event);
  }
}
