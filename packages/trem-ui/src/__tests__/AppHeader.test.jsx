import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import AppHeader from "../components/AppHeader/AppHeader.jsx";

const config = {
  ariaLabel: "Dashboard application header",
  brand: { name: "TravelsTREM", subtitle: "JAI · WORLD", logoSrc: "/favicon.png" },
  mobileMenu: { openLabel: "Open navigation", closeLabel: "Close navigation" },
  search: {
    placeholder: "Search trips and services...",
    ariaLabel: "Search travel services",
    enabled: false,
  },
  primaryAction: { label: "New Booking", icon: "plus", enabled: false },
  notification: { label: "Notifications", icon: "bell", count: 3, enabled: false },
  themeAction: {
    lightLabel: "Switch to light mode",
    darkLabel: "Switch to dark mode",
    lightIcon: "sun",
    darkIcon: "moon",
  },
  user: {
    fallbackName: "Traveller",
    menuLabel: "Open user menu",
    menuEnabled: true,
    items: [
      { id: "about", label: "About Us", icon: "info", disabled: true },
      { id: "logout", label: "Sign Out", icon: "logout", action: "logout" },
    ],
  },
};

afterEach(cleanup);

describe("AppHeader", () => {
  it("renders backend-driven placeholder controls without activating them", () => {
    render(<AppHeader config={config} user={{ name: "Akshat Goyal" }} />);

    expect(screen.getByLabelText("Search travel services")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: "New Booking" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Notifications" })).toBeDisabled();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open user menu" })).toHaveTextContent("AG");
  });

  it("connects only theme and mobile navigation actions", () => {
    const onMenuToggle = vi.fn();
    const onToggleTheme = vi.fn();
    render(
      <AppHeader
        config={config}
        theme="dark"
        menuOpen
        onMenuToggle={onMenuToggle}
        onToggleTheme={onToggleTheme}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close navigation" }));
    fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(onMenuToggle).toHaveBeenCalledOnce();
    expect(onToggleTheme).toHaveBeenCalledOnce();
  });

  it("uses the shared dropdown for backend-driven user actions", () => {
    const onAction = vi.fn();
    render(<AppHeader config={config} onAction={onAction} />);

    fireEvent.click(screen.getByRole("button", { name: "Open user menu" }));
    expect(screen.getByText("About Us")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Sign Out"));
    expect(onAction).toHaveBeenCalledWith("logout", expect.objectContaining({ id: "logout" }));
  });

  it("applies the current sidebar width without coupling header state", () => {
    const { container, rerender } = render(<AppHeader config={config} sidebarCollapsed={false} />);
    expect(
      container
        .querySelector(".trem-app-header")
        .style.getPropertyValue("--trem-app-header-sidebar-offset"),
    ).toBe("260px");

    rerender(<AppHeader config={config} sidebarCollapsed />);
    expect(
      container
        .querySelector(".trem-app-header")
        .style.getPropertyValue("--trem-app-header-sidebar-offset"),
    ).toBe("76px");
  });

  it("does not render items flagged with hide", () => {
    const hiddenConfig = {
      ...config,
      primaryAction: { ...config.primaryAction, hide: true },
      notification: { ...config.notification, hide: true },
      productMenu: {
        label: "Products",
        ariaLabel: "Choose product",
        items: [
          { id: "visibleProduct", label: "Visible Product" },
          { id: "hiddenProduct", label: "Hidden Product", hide: true },
        ],
      },
      user: {
        ...config.user,
        items: [
          { id: "visibleAction", label: "Visible Action", action: "visible" },
          { id: "hiddenAction", label: "Hidden Action", action: "hidden", hide: true },
        ],
      },
    };

    render(<AppHeader config={hiddenConfig} />);

    expect(screen.queryByRole("button", { name: "New Booking" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Notifications" })).not.toBeInTheDocument();
    expect(screen.queryByText("Hidden Product")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Choose product" }));
    expect(screen.getByText("Visible Product")).toBeInTheDocument();
    expect(screen.queryByText("Hidden Product")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open user menu" }));
    expect(screen.getByText("Visible Action")).toBeInTheDocument();
    expect(screen.queryByText("Hidden Action")).not.toBeInTheDocument();
  });

  it("renders the journey dropdown from primary-action configuration", () => {
    const onPrimaryActionSelect = vi.fn();
    const journeyConfig = {
      ...config,
      primaryAction: {
        label: "New Booking",
        icon: "plus",
        enabled: true,
        menu: {
          variant: "journey-menu",
          title: "Plan a Journey",
          items: [
            {
              id: "trips",
              title: "Trips & Adventures",
              description: "Treks, expeditions & events",
              mobileIcon: "mountain",
              target: "trevio",
            },
            {
              id: "flights",
              title: "Flights & Hotels",
              description: "Flights, stays & transport",
              mobileIcon: "plane",
              disabled: true,
              comingSoon: true,
              comingSoonLabel: "Coming soon",
            },
          ],
        },
      },
    };

    render(<AppHeader config={journeyConfig} onPrimaryActionSelect={onPrimaryActionSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "New Booking" }));

    expect(screen.getByText("Plan a Journey")).toBeInTheDocument();
    expect(screen.getByText("Treks, expeditions & events")).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Flights & Hotels" })).toBeDisabled();

    fireEvent.click(screen.getByRole("menuitem", { name: "Trips & Adventures" }));
    expect(onPrimaryActionSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "trips", target: "trevio" }),
    );
  });

  it("switches the same journey dropdown to a bottom sheet on mobile", () => {
    const previousWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 430 });
    const journeyConfig = {
      ...config,
      primaryAction: {
        label: "New Booking",
        enabled: true,
        menu: {
          variant: "journey-menu",
          title: "Plan a Journey",
          items: [
            { id: "tours", title: "Tours & Packages", mobileIcon: "beach", target: "trevista" },
          ],
        },
      },
    };

    render(<AppHeader config={journeyConfig} />);
    fireEvent.click(screen.getByRole("button", { name: "New Booking" }));
    expect(screen.getByRole("dialog", { name: "Plan a Journey" })).toBeInTheDocument();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: previousWidth });
  });
});
