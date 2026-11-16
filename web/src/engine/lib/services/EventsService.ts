export class MRIEventsService {
  private events: { [key: string]: Function[] } = {};

  on(eventName: string, fn: Function): Function {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(fn);
    return () => this.off(eventName, fn);
  }

  off(eventName: string, fn: Function): void {
    if (!this.events[eventName]) return;
    this.events[eventName] = this.events[eventName].filter((subscriber) => subscriber !== fn);
  }

  emit(eventName: string, data = {}): void {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach((fn) => fn(data));
  }
}

// Create the singleton instance and freeze it
const mriEventsService = new MRIEventsService();
Object.freeze(mriEventsService);

// Export the MRIEventsService singleton instance
export default mriEventsService;
