import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FloatingActionBar from "../components/FloatingActionBar/FloatingActionBar.jsx";

describe("FloatingActionBar mobile navigation variant", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders all configured actions and exposes the active destination", () => {
    const onNewBooking = vi.fn();
    render(<FloatingActionBar
      variant="mobile-navigation"
      sheetTitle="Primary navigation"
      actions={[
        { id: "home", label: "Home", iconLeft: "home", active: true },
        { id: "new", label: "New booking", iconLeft: "plus", emphasis: true, onClick: onNewBooking },
      ]}
    />);

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

    expect(container.firstChild.style.getPropertyValue("--dash-mobile-action-panel-rendered-height"))
      .toBe("86px");
  });
});
