import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "react-dom/test-utils";

const socketInstances = [];

class FakeSocket {
  constructor() {
    this.handlers = {};
    this.io = { on: () => {} };
    this.disconnected = true;
    socketInstances.push(this);
  }
  on(event, handler) {
    (this.handlers[event] = this.handlers[event] || []).push(handler);
    return this;
  }
  off(event, handler) {
    this.handlers[event] = (this.handlers[event] || []).filter((h) => h !== handler);
  }
  emit() {}
  timeout() {
    return { emit: (_e, _p, ack) => ack(new Error("timeout")) };
  }
  removeAllListeners() {
    this.handlers = {};
  }
  disconnect() {}
  connect() {
    this.disconnected = false;
    (this.handlers.connect || []).forEach((h) => h());
  }
  fire(event, payload) {
    (this.handlers[event] || []).forEach((h) => h(payload));
  }
}

const { io } = vi.hoisted(() => ({ io: vi.fn() }));
vi.mock("socket.io-client", () => ({ io }));

import { RealtimeProvider, useEnquiryRealtime } from "../realtime/index.js";

const envelope = (event) => ({
  eventId: "e1",
  event,
  timestamp: new Date().toISOString(),
  version: 1,
  data: { enquiryRef: "ENQ-ABC123", status: "new" },
});

describe("useEnquiryRealtime", () => {
  beforeEach(() => {
    socketInstances.length = 0;
    io.mockImplementation(() => new FakeSocket());
    delete window.__TREM_REALTIME_CLIENT__;
    delete window.__TREM_AUTH_PORTAL__;
    delete window.__TREM_AUTH_STORAGE_PREFIX__;
  });
  afterEach(() => {
    try {
      window.__TREM_REALTIME_CLIENT__?.destroy?.();
    } catch {}
    delete window.__TREM_REALTIME_CLIENT__;
  });

  const renderWithProvider = (handler) =>
    renderHook(handler, {
      wrapper: ({ children }) => <RealtimeProvider>{children}</RealtimeProvider>,
    });

  it("receives enquiry:created via identity rooms without subscribing", async () => {
    const created = vi.fn();
    const { rerender } = renderWithProvider(() => useEnquiryRealtime(created));
    rerender();

    const socket = window.__TREM_REALTIME_CLIENT__.getSocket();
    await act(async () => {
      socket.connect();
      socket.fire("enquiry:created", envelope("enquiry:created"));
    });
    expect(created).toHaveBeenCalledTimes(1);
    expect(created.mock.calls[0][0].data.enquiryRef).toBe("ENQ-ABC123");
  });

  it("receives enquiry:claimed and detaches on unmount", async () => {
    const handler = vi.fn();
    const { unmount } = renderWithProvider(() => useEnquiryRealtime(handler));

    const socket = window.__TREM_REALTIME_CLIENT__.getSocket();
    await act(async () => {
      socket.connect();
      socket.fire("enquiry:claimed", envelope("enquiry:claimed"));
    });
    expect(handler).toHaveBeenCalledTimes(1);

    unmount();
    await act(async () => {
      socket.fire("enquiry:created", envelope("enquiry:created"));
      socket.fire("enquiry:claimed", envelope("enquiry:claimed"));
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
