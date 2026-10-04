import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

class FakeSocket {
  constructor() {
    this.handlers = {};
    this.disconnected = true;
  }
  on(event, handler) {
    (this.handlers[event] = this.handlers[event] || []).push(handler);
    return this;
  }
  connect() {
    this.disconnected = false;
  }
  fire(event, payload) {
    (this.handlers[event] || []).forEach((h) => h(payload));
  }
}

const envelope = (notify, data = {}) => ({
  eventId: "evt-1",
  event: "enquiry:created",
  timestamp: new Date().toISOString(),
  version: 1,
  data,
  ...(notify ? { notify } : {}),
});

const installClient = () => {
  const socket = new FakeSocket();
  const client = {
    connected: false,
    connect() {
      this.connected = true;
      return socket;
    },
  };
  client.getSocket = () => (client.connected ? socket : null);
  window.__TREM_REALTIME_CLIENT__ = client;
  return { client, socket };
};

// Fresh module state per test: the bridge keeps a page-level singleton guard.
const loadBridge = async () => {
  vi.resetModules();
  return import("../src/realtimeNotify.js");
};

describe("realtime notification bridge", () => {
  let toastSpy;
  let TREM_TOAST_EVENT;

  const toastDetails = () => toastSpy.mock.calls.map((call) => call[0].detail);

  beforeEach(async () => {
    ({ TREM_TOAST_EVENT } = await loadBridge());
    toastSpy = vi.fn();
    window.addEventListener(TREM_TOAST_EVENT, toastSpy);
    delete window.__TREM_REALTIME_CLIENT__;
    // Window-anchored dedupe registry persists across bundle copies/tests.
    delete window.__TREM_TOAST_SEEN_KEYS__;
  });
  afterEach(() => {
    window.removeEventListener(TREM_TOAST_EVENT, toastSpy);
    delete window.__TREM_REALTIME_CLIENT__;
    delete process.env.REACT_APP_REALTIME_ENABLED;
  });

  it("forwards a backend notify payload to the toast contract untouched", async () => {
    const { showRealtimeToast } = await loadBridge();
    const shown = showRealtimeToast({
      title: "New enquiry received",
      subtitle: "ENQ-ABC123 · Kashmir needs a response.",
      status: "info",
      dedupeKey: "enquiry:ENQ-ABC123",
    });
    expect(shown).toBe(true);
    expect(toastSpy).toHaveBeenCalledTimes(1);
    const detail = toastDetails()[0];
    expect(detail.title).toBe("New enquiry received");
    expect(detail.subtitle).toContain("ENQ-ABC123");
    expect(detail.status).toBe("info");
  });

  it("rejects payloads without a title", async () => {
    const { showRealtimeToast } = await loadBridge();
    expect(showRealtimeToast({ subtitle: "no title" })).toBe(false);
    expect(toastSpy).not.toHaveBeenCalled();
  });

  it("dedupes by key across channels within the window", async () => {
    const { showRealtimeToast } = await loadBridge();
    const notify = { title: "Enquiry created", dedupeKey: "enquiry:ENQ-1" };
    expect(showRealtimeToast(notify)).toBe(true);
    expect(showRealtimeToast(notify)).toBe(false); // HTTP twin already shown
    expect(toastSpy).toHaveBeenCalledTimes(1);
  });

  it("binds to the shared realtime client and forwards envelopes with notify only", async () => {
    const { initRealtimeNotifications } = await loadBridge();
    const { client, socket } = installClient();
    const dispose = initRealtimeNotifications();

    // The bridge connects eagerly through the client facade.
    expect(client.connected).toBe(true);

    socket.fire(
      "enquiry:created",
      envelope({ title: "New enquiry received", status: "info" }, { enquiryRef: "ENQ-X" }),
    );
    expect(toastSpy).toHaveBeenCalledTimes(1);

    // Envelopes without a backend notify block never become toasts.
    socket.fire("enquiry:created", envelope(null));
    socket.fire("enquiry:claimed", envelope({ title: "" }));
    expect(toastSpy).toHaveBeenCalledTimes(1);

    dispose();
  });

  it("does not initialize a socket when realtime is disabled", async () => {
    process.env.REACT_APP_REALTIME_ENABLED = "false";
    const { initRealtimeNotifications } = await loadBridge();
    const { client } = installClient();

    const dispose = initRealtimeNotifications();

    expect(client.connected).toBe(false);
    dispose();
  });

  it("waits for the realtime client when trem-ui has not created it yet", async () => {
    vi.useFakeTimers();
    const { initRealtimeNotifications } = await loadBridge();
    const dispose = initRealtimeNotifications();
    expect(window.__TREM_REALTIME_CLIENT__).toBeUndefined();

    const { client, socket } = installClient();
    await vi.advanceTimersByTimeAsync(700);

    expect(client.connected).toBe(true);
    socket.fire(
      "enquiry:claimed",
      envelope({ title: "Enquiry linked", status: "success" }, { enquiryRef: "ENQ-9" }),
    );
    expect(toastDetails()[0].title).toBe("Enquiry linked");

    dispose();
    vi.useRealTimers();
  });

  it("is idempotent per page — second init does not double-bind", async () => {
    const { initRealtimeNotifications } = await loadBridge();
    const { socket } = installClient();
    const disposeA = initRealtimeNotifications();
    const disposeB = initRealtimeNotifications();

    socket.fire("enquiry:created", envelope({ title: "Only once", status: "success" }));
    expect(toastSpy).toHaveBeenCalledTimes(1);

    disposeA();
    disposeB();
  });
});
