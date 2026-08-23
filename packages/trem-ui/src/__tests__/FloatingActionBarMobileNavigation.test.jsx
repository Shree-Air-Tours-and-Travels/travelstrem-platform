import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FloatingActionBar from "../components/FloatingActionBar/FloatingActionBar.jsx";

describe("FloatingActionBar mobile navigation variant", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders all configured actions and exposes the active destination", () => {
    const onNewBooking = vi.fn();
    render(
      <FloatingActionBar
        variant="mobile-navigation"
        sheetTitle="Primary navigation"
        actions={[
          { id: "home", label: "Home", iconLeft: "home", active: true },
          {
            id: "new",
            label: "New booking",
            iconLeft: "plus",
            emphasis: true,
            onClick: onNewBooking,
          },
        ]}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Home" }).getAttribute("aria-current")).toBe("page");
    fireEvent.click(screen.getByRole("button", { name: "New booking" }));
    expect(onNewBooking).toHaveBeenCalledOnce();
  });

  it("publishes its rendered height to the containing shell layout", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ height: 86 });
    const { container } = render(
      <div className="dash-layout--mobile-action-panel">
        <FloatingActionBar
          variant="mobile-navigation"
          actions={[{ id: "new", label: "New booking", iconLeft: "plus", emphasis: true }]}
        />
      </div>,
    );

    expect(
      container.firstChild.style.getPropertyValue("--dash-mobile-action-panel-rendered-height"),
    ).toBe("86px");
  });
});

describe("FloatingActionBar action overflow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.style.removeProperty("--trem-floating-action-clearance");
  });

  it("publishes enough clearance for viewport utilities to sit above it", () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 900,
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 700,
      height: 80,
    });

    const { unmount } = render(
      <FloatingActionBar actions={[{ label: "Continue", variant: "primary" }]} />,
    );

    expect(
      document.documentElement.style.getPropertyValue("--trem-floating-action-clearance"),
    ).toBe("212px");
    unmount();
    expect(
      document.documentElement.style.getPropertyValue("--trem-floating-action-clearance"),
    ).toBe("");
  });

  it("keeps one action on each side and moves secondary actions into a bottom sheet", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 800 });
    const onPaste = vi.fn();
    const { container } = render(
      <FloatingActionBar
        align="left-right"
        sheetTitle="Builder actions"
        actions={[
          { label: "Back", variant: "outline", align: "left" },
          { label: "Exit", variant: "ghost", align: "left" },
          { label: "Paste JSON", variant: "ghost", align: "right", onClick: onPaste },
          { label: "Cancel", variant: "ghost", align: "right" },
          { label: "Save & continue", variant: "primary", align: "right", primary: true },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save & continue" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Paste JSON" })).toBeNull();
    const rightButtons = container.querySelectorAll(".trem-fab__group--right button");
    expect(rightButtons[rightButtons.length - 1].getAttribute("aria-label")).toBe("More actions");

    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(screen.getByRole("dialog", { name: "Builder actions" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Paste JSON" }));
    expect(onPaste).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog", { name: "Builder actions" })).toBeNull();
  });

  it("shows every action without overflow above the mini-tablet breakpoint", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    });
    render(
      <FloatingActionBar
        align="left-right"
        actions={[
          { label: "Exit", variant: "ghost", align: "left" },
          { label: "Paste JSON", variant: "ghost", align: "right", overflowMobile: true },
          { label: "Cancel", variant: "ghost", align: "right", overflowMobile: true },
          { label: "Save & continue", variant: "primary", align: "right", primary: true },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Exit" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Paste JSON" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save & continue" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "More actions" })).toBeNull();
  });
});
