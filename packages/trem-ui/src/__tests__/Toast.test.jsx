import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import Toaster, { showToast, TREM_TOAST_EVENT } from "../components/Toast/Toast.jsx";

const fire = (detail) =>
  act(() => {
    window.dispatchEvent(new CustomEvent(TREM_TOAST_EVENT, { detail }));
  });

describe("Toaster", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Window-anchored guards persist across bundles/tests.
    delete window.__TREM_TOASTER_OWNER__;
    delete window.__TREM_TOAST_SEEN_KEYS__;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders a backend-authored success toast with title and subtitle", () => {
    render(<Toaster />);
    fire({
      title: "Enquiry created",
      subtitle: "Your enquiry ID is ENQ-ABC123.",
      status: "success",
    });
    expect(screen.getByText("Enquiry created")).toBeInTheDocument();
    expect(screen.getByText(/ENQ-ABC123/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("data-status", "success");
  });

  it("renders error toasts with alert semantics", () => {
    render(<Toaster />);
    fire({ title: "Payment failed", status: "error" });
    expect(screen.getByRole("alert")).toHaveAttribute("data-status", "error");
  });

  it("falls back to the info variant for unknown statuses", () => {
    render(<Toaster />);
    fire({ title: "Heads up", status: "urgent" });
    expect(screen.getByRole("status")).toHaveAttribute("data-status", "info");
  });

  it("ignores payloads without a title", () => {
    render(<Toaster />);
    fire({ subtitle: "no title" });
    expect(document.querySelector(".trem-toast")).toBeNull();
  });

  it("dedupes identical dedupeKeys within the window but allows later repeats", () => {
    render(<Toaster />);
    const detail = { title: "Enquiry created", dedupeKey: "enquiry:ENQ-ABC123" };
    fire(detail);
    fire(detail);
    expect(document.querySelectorAll(".trem-toast")).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(11000);
    });
    fire({ ...detail, id: `second-${Date.now()}` });
    // The old toast auto-dismissed after its duration, and the repeat renders again.
    expect(document.querySelectorAll(".trem-toast")).toHaveLength(1);
  });

  it("auto-dismisses after the duration", () => {
    render(<Toaster />);
    fire({ title: "Transient", durationMs: 3000 });
    expect(document.querySelectorAll(".trem-toast")).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(document.querySelectorAll(".trem-toast")).toHaveLength(0);
  });

  it("dismisses via the close button", () => {
    render(<Toaster />);
    fire({ title: "Dismissible" });
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(document.querySelectorAll(".trem-toast")).toHaveLength(0);
  });

  it("renders exactly one stack when several Toasters share a document (embedded remotes)", () => {
    render(
      <div>
        <Toaster />
        <Toaster />
      </div>,
    );
    fire({ title: "New enquiry received", status: "info" });
    expect(screen.getAllByText("New enquiry received")).toHaveLength(1);
    expect(document.querySelectorAll(".trem-toast")).toHaveLength(1);
    expect(window.__TREM_TOASTER_OWNER__).toBe(true);
  });

  it("showToast dispatches the shared window contract", () => {
    const spy = vi.fn();
    window.addEventListener(TREM_TOAST_EVENT, spy);
    const id = showToast({ title: "Via helper", status: "info" });
    window.removeEventListener(TREM_TOAST_EVENT, spy);
    expect(id).toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].detail.title).toBe("Via helper");
  });
});
