// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useRefreshOnActivation, { DATA_CHANGED_EVENT } from "./useRefreshOnActivation.js";

// run() defers the refresh by one microtask; flush before asserting.
const flush = () => act(async () => {});

describe("useRefreshOnActivation", () => {
  it("does not refresh on focus or page activation", async () => {
    const refresh = vi.fn().mockResolvedValue();
    renderHook(() =>
      useRefreshOnActivation(refresh, {
        minimumIntervalMs: 0,
        refreshOnMount: true,
      }),
    );
    await flush();
    expect(refresh).toHaveBeenCalledTimes(1); // mount load still happens

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("pageshow"));
    });
    await flush();
    expect(refresh).toHaveBeenCalledTimes(1); // clicking around costs nothing

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(DATA_CHANGED_EVENT, { detail: { resource: "enquiries" } }),
      );
    });
    await flush();
    expect(refresh).toHaveBeenCalledTimes(2); // real data changes always load
  });

  it("keeps focus changes free of backend refreshes", async () => {
    const refresh = vi.fn().mockResolvedValue();
    renderHook(() =>
      useRefreshOnActivation(refresh, { minimumIntervalMs: 0, refreshOnMount: true }),
    );
    await flush();
    expect(refresh).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    await flush();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("filters data-changed events by resource", async () => {
    const refresh = vi.fn().mockResolvedValue();
    renderHook(() =>
      useRefreshOnActivation(refresh, {
        resource: "enquiries",
        minimumIntervalMs: 0,
        refreshOnMount: false,
      }),
    );
    await flush();

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(DATA_CHANGED_EVENT, { detail: { resource: "payments" } }),
      );
    });
    await flush();
    expect(refresh).not.toHaveBeenCalled();

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(DATA_CHANGED_EVENT, { detail: { resource: "enquiries" } }),
      );
    });
    await flush();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("respects enabled: false entirely", async () => {
    const refresh = vi.fn().mockResolvedValue();
    renderHook(() => useRefreshOnActivation(refresh, { enabled: false, minimumIntervalMs: 0 }));
    await flush();

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(DATA_CHANGED_EVENT, { detail: { resource: "enquiries" } }),
      );
    });
    await flush();
    expect(refresh).not.toHaveBeenCalled();
  });
});
