const subscribers = new Map();

export const EventBus = {
  on(eventName, handler) {
    const handlers = subscribers.get(eventName) || [];
    handlers.push(handler);
    subscribers.set(eventName, handlers);
  },

  async emit(eventName, payload = {}) {
    const handlers = subscribers.get(eventName) || [];
    await Promise.allSettled(handlers.map((handler) => handler(payload)));
    return { eventName, payload };
  },
};

export default EventBus;
