import React from "react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import OverviewRail from "../components/OverviewRail/OverviewRail.jsx";

describe("OverviewRail", () => {
  it("renders backend widget data in the supplied order", () => {
    render(
      <OverviewRail
        ariaLabel="Travel tools"
        widgets={[
          {
            id: "actions",
            type: "quickActions",
            title: "Quick Actions",
            items: [{
              id: "support",
              title: "Contact support",
              description: "We are here",
              icon: "phoneCall",
              href: "mailto:help@example.com",
            }],
          },
          {
            id: "trip",
            type: "upcomingTrip",
            title: "Upcoming Trip",
            emptyState: {
              icon: "calendar",
              title: "No upcoming trip",
              description: "Check again soon.",
            },
            trip: null,
          },
        ]}
      />,
    );

    expect(screen.getByRole("complementary", { name: "Travel tools" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact support" })).toHaveAttribute(
      "href",
      "mailto:help@example.com",
    );
    expect(screen.getByText("No upcoming trip")).toBeInTheDocument();
  });

  it("renders disabled quick actions without navigation", () => {
    render(
      <OverviewRail
        widgets={[{
          id: "actions",
          type: "quickActions",
          title: "Quick Actions",
          items: [{
            id: "documents",
            title: "Upload documents",
            description: "Coming later",
            icon: "passport",
            href: "/documents",
            disabled: true,
          }],
        }]}
      />,
    );

    expect(screen.queryByRole("link", { name: "Upload documents" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Upload documents")).toHaveAttribute("aria-disabled", "true");
  });

  it("can omit disabled and explicitly hidden quick actions from backend configuration", () => {
    render(
      <OverviewRail
        widgets={[{
          id: "actions",
          type: "quickActions",
          title: "Quick Actions",
          hideDisabled: true,
          items: [
            { id: "support", title: "Contact support", icon: "phoneCall", href: "mailto:help@example.com" },
            { id: "documents", title: "Upload documents", icon: "passport", disabled: true },
            { id: "hidden", title: "Hidden action", icon: "eye", hide: true },
          ],
        }]}
      />,
    );

    expect(screen.getByRole("link", { name: "Contact support" })).toBeInTheDocument();
    expect(screen.queryByText("Upload documents")).not.toBeInTheDocument();
    expect(screen.queryByText("Hidden action")).not.toBeInTheDocument();
  });
});
