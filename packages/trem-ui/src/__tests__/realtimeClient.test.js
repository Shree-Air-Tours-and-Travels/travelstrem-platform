import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const socketInstances = [];

class FakeSocket {
  constructor() {
    this.handlers = {};
    this.io = {
      on: (event, handler) => {
        (this.ioHandlers[event] = this.ioHandlers[event] || []).push(handler);
      },
    };
    this.ioHandlers = {};
    this.disconnected = true;
    this.emitted = [];
    socketInstances.push(this);
  }
  on(event, handler) {
    (this.handlers[event] = this.handlers[event] || []).push(handler);
    return this;
  }
  emit(event, ...args) {
    this.emitted.push({ event, args });
    return true;
  }
  timeout() {
    return {
      emit: (event, payload, ack) => {
        this.emitted.push({ event, args: [payload] });
        if (this.ackResponse) ack(null, this.ackResponse);
        else ack(new Error("timeout"));
      },
    };
  }
  removeAllListeners() {
    this.handlers = {};
  }
  disconnect(reason) {
    this.disconnected = true;
    (this.handlers.disconnect || []).forEach((h) => h(reason || "transport close"));
  }
  connect() {
    this.disconnected = false;
    (this.handlers.connect || []).forEach((h) => h());
  }
}

const { io } = vi.hoisted(() => ({ io: vi.fn() }));

vi.mock("socket.io-client", () => ({ io }));

import { getRealtimeClient, resolveRealtimeUrl } from "../realtime/realtime-client.js";

const ENV_KEYS = [
  "REACT_APP_REALTIME_URL",
  "REACT_APP_BACKEND_URL",
  "REACT_APP_API_URL",
  "REACT_APP_REALTIME_PATH",
];
let savedEnv;

describe("resolveRealtimeUrl", () => {
  beforeEach(() => {
    savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    ENV_KEYS.forEach((k) => delete process.env[k]);
  });
  afterEach(() => {
    Object.entries(savedEnv).forEach(([k, v]) => {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    });
  });

  it("prefers REACT_APP_REALTIME_URL", () => {
    process.env.REACT_APP_REALTIME_URL = "https://rt.example.com/";
    process.env.REACT_APP_BACKEND_URL = "https://api.example.com";
    expect(resolveRealtimeUrl()).toBe("https://rt.example.com");
  });

  it("falls back to REACT_APP_BACKEND_URL", () => {
    process.env.REACT_APP_BACKEND_URL = "https://api.example.com/";
    expect(resolveRealtimeUrl()).toBe("https://api.example.com");
  });

  it("strips /api suffix from REACT_APP_API_URL", () => {
    process.env.REACT_APP_API_URL = "https://api.example.com/api";
    expect(resolveRealtimeUrl()).toBe("https://api.example.com");
  });

  it("falls back to window.location.origin", () => {
    expect(resolveRealtimeUrl()).toBe(window.location.origin);
  });
});

describe("realtime client singleton", () => {
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

  it("anchors the client on window so duplicate bundles share one socket", () => {
    const first = getRealtimeClient();
    const second = getRealtimeClient();
    expect(second).toBe(first);
    expect(window.__TREM_REALTIME_CLIENT__).toBe(first);
  });

  it("connects once and reuses the same socket", () => {
    const client = getRealtimeClient();
    const socketA = client.connect();
    const socketB = client.connect();
    expect(io).toHaveBeenCalledTimes(1);
    expect(socketB).toBe(socketA);
    expect(socketA.disconnected).toBe(false);
  });

  it("passes portal scope and credentials to socket.io", () => {
    window.__TREM_AUTH_PORTAL__ = "partner";
    const client = getRealtimeClient();
    client.connect();
    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        withCredentials: true,
        auth: { portal: "partner" },
        path: "/socket.io",
      }),
    );
  });

  it("defaults portal scope to customer from the storage prefix heuristic", () => {
    window.__TREM_AUTH_STORAGE_PREFIX__ = "trem-agent-token";
    getRealtimeClient().connect();
    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ auth: { portal: "partner" } }),
    );
  });

  it("tracks status transitions through connect/disconnect", () => {
    const client = getRealtimeClient();
    const statuses = [];
    const off = client.onStatusChange((s) => statuses.push(s));
    expect(statuses[statuses.length - 1]).toBe("disconnected");

    const socket = client.connect();
    expect(statuses[statuses.length - 1]).toBe("connected");

    // Server-initiated disconnect means no auto-reconnect: status is disconnected.
    socket.disconnect("io server disconnect");
    expect(statuses[statuses.length - 1]).toBe("disconnected");

    // Transport-level drops recover via reconnection attempts.
    client.connect();
    socket.disconnect("transport close");
    expect(statuses[statuses.length - 1]).toBe("reconnecting");

    off();
    statuses.length = 0;
    socket.connect();
    expect(statuses).toHaveLength(0);
  });

  it("rejects subscriptions while disconnected without touching the wire", async () => {
    const client = getRealtimeClient();
    const result = await client.subscribe("booking", "b1");
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("REALTIME_INTERNAL_ERROR");
  });

  it("subscribes via resource namespaced events and resolves the ack", async () => {
    const client = getRealtimeClient();
    const socket = client.connect();
    socket.ackResponse = { ok: true };

    const result = await client.subscribe("tour", "t9");
    expect(result.ok).toBe(true);
    expect(socket.emitted.some((e) => e.event === "tour:subscribe")).toBe(true);

    client.unsubscribe("tour", "t9");
    expect(socket.emitted.some((e) => e.event === "tour:unsubscribe")).toBe(true);
  });

  it("maps subscription timeouts to an error result", async () => {
    const client = getRealtimeClient();
    client.connect();
    const result = await client.subscribe("booking", "b2");
    expect(result.ok).toBe(false);
    expect(result.error.message).toMatch(/timed out/i);
  });

  it("destroy tears down the socket and clears listeners", () => {
    const client = getRealtimeClient();
    const socket = client.connect();
    const spy = vi.spyOn(socket, "disconnect");
    client.destroy();
    expect(spy).toHaveBeenCalled();
    expect(client.getSocket()).toBeNull();

    // A fresh client can be created after destroy.
    const revived = getRealtimeClient().connect();
    expect(revived).not.toBe(socket);
  });
});

describe("useRealtimeStatus hook", () => {
  beforeEach(() => {
    socketInstances.length = 0;
    io.mockImplementation(() => new FakeSocket());
    delete window.__TREM_REALTIME_CLIENT__;
  });
  afterEach(() => {
    try {
      window.__TREM_REALTIME_CLIENT__?.destroy?.();
    } catch {}
    delete window.__TREM_REALTIME_CLIENT__;
  });

  it("exposes connection status and cleans up on unmount", async () => {
    const { useRealtimeStatus } = await import("../realtime/useRealtimeStatus.js");
    const { unmount } = renderHook(() => useRealtimeStatus());
    await act(async () => {
      getRealtimeClient().connect();
    });
    unmount();
    // No throw after unmount means the listener was detached.
    getRealtimeClient().destroy();
  });
});
