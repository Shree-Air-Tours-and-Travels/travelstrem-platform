import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import SideBar from "../components/SideBar/SideBar.jsx";

afterEach(cleanup);

const config = {
  ariaLabel: "Customer navigation",
  brand: {
    logoSrc: "/favicon.png",
    name: "TravelsTREM",
    subtitle: "JAI · WORLD",
    href: "/",
  },
  sections: [
    { id: "main", items: [{ id: "overview", label: "Home", icon: "home", target: "overview" }] },
    {
      id: "plan",
      title: "Plan a Journey",
      items: [
        {
          id: "holidays",
          label: "Holiday Packages",
          icon: "globe",
          disabled: true,
          comingSoon: true,
        },
      ],
    },
  ],
  profile: { fallbackMeta: "TravelsTREM Member", actionTarget: "profile" },
};

describe("SideBar", () => {
  it("renders backend configuration and routes enabled items", () => {
    const onNavigate = vi.fn();
    render(
      <SideBar
        config={config}
        user={{ name: "Akshat Goyal" }}
        activeId="overview"
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByLabelText("Customer navigation")).toBeInTheDocument();
    expect(screen.getByText("Plan a Journey")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Holiday Packages" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(onNavigate).toHaveBeenCalledWith(
      "overview",
      expect.objectContaining({ id: "overview" }),
    );
  });

  it("opens the same sidebar as a mobile drawer and closes from its backdrop", () => {
    const onClose = vi.fn();
    const { container } = render(<SideBar config={config} mobileOpen onClose={onClose} />);

    expect(container.querySelector(".trem-sidebar")).toHaveClass("is-mobile-open");
    fireEvent.click(container.querySelector(".trem-sidebar__backdrop"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("supports a controlled desktop collapse rail", () => {
    const onCollapsedChange = vi.fn();
    const { container, rerender } = render(
      <SideBar config={config} collapsed={false} onCollapsedChange={onCollapsedChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(onCollapsedChange).toHaveBeenCalledWith(true);

    rerender(<SideBar config={config} collapsed onCollapsedChange={onCollapsedChange} />);
    expect(container.querySelector(".trem-sidebar")).toHaveClass("is-collapsed");
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeInTheDocument();
  });

  it("does not render items flagged with hide and skips empty sections", () => {
    const hiddenConfig = {
      ...config,
      sections: [
        {
          id: "main",
          items: [{ id: "overview", label: "Home", icon: "home", target: "overview" }],
        },
        {
          id: "plan",
          title: "Plan a Journey",
          items: [
            {
              id: "holidays",
              label: "Holiday Packages",
              icon: "globe",
              disabled: true,
              comingSoon: true,
            },
            { id: "secret", label: "Secret Option", icon: "globe", hide: true },
          ],
        },
        {
          id: "support",
          title: "Support & More",
          items: [{ id: "hiddenSupport", label: "Hidden Support", icon: "bell", hide: true }],
        },
      ],
    };

    render(<SideBar config={hiddenConfig} />);

    expect(screen.getByText("Holiday Packages")).toBeInTheDocument();
    expect(screen.queryByText("Secret Option")).not.toBeInTheDocument();
    expect(screen.queryByText("Hidden Support")).not.toBeInTheDocument();
    expect(screen.queryByText("Support & More")).not.toBeInTheDocument();
  });
});
