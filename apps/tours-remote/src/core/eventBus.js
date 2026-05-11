const listeners = {};

export const emit = (event, payload) => {
    (listeners[event] || []).forEach((cb) => cb(payload));
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(event, { detail: payload }));
    }
};

export const on = (event, cb) => {
    listeners[event] = [...(listeners[event] || []), cb];

    return () => {
        listeners[event] = (listeners[event] || []).filter((listener) => listener !== cb);
    };
};

export const initEventBus = () => ({ emit, on });
