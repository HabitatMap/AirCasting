type Callback = (data: any) => void;

class PubSubManager {
  private subscribers: { [event: string]: Callback[] } = {};

  subscribe(event: string, callback: Callback): void {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);
  }

  publish(event: string, data: any): void {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach((callback) => callback(data));
    }
  }

  unsubscribe(event: string, callback: Callback): void {
    if (this.subscribers[event]) {
      const index = this.subscribers[event].indexOf(callback);
      if (index > -1) {
        this.subscribers[event].splice(index, 1);
      }
    }
  }
}

export const pubSub = new PubSubManager();
