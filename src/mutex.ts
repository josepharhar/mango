export class Mutex {
  queue: Array<Function>;
  blocked: boolean;

  constructor() {
    this.queue = [];
    this.blocked = false;
  }

  acquire(): Promise<any> {
    if (!this.blocked) {
      this.blocked = true;
      return Promise.resolve();
    }

    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  }

  release() {
    if (!this.queue.length) {
      this.blocked = false;
      return;
    }

    const next = this.queue.shift();
    next();
  }
}
