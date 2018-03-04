export default class Module {
  constructor(id, sandbox) {
    this.id = id;
    this.sandbox = sandbox;
  }
  listen(types, handler) {
    this.sandbox.listen(types, handler.bind(this), this);
  }
  notify(event) {
    console.debug('%s.notify(%s)', this.id, JSON.stringify(event));
    this.sandbox.notify(event);
  }
}
