// @vitest-environment jsdom

import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import TourIntelligenceSummaryWidget from "../src/widgets/composites/TourIntelligenceSummaryWidget.jsx";

const widget = {
  path: "intelligence",
  featuredPath: "featured",
  trendingPath: "trending",
  verifiedPath: "tremVerified",
  featuredRequestPath: "featuredRequest",
  label: "TravelsTREM intelligence",
};

describe("TourIntelligenceSummaryWidget", () => {
  it("presents platform decisions without internal keys or disabled checkboxes", () => {
    const { container } = render(
      <TourIntelligenceSummaryWidget
        widget={widget}
        root={{
          intelligence: {
            qualityScore: 96,
            scoreVersion: "TREM_TOUR_INTELLIGENCE_V1",
            lastEvaluatedAt: "2026-08-24T10:33:18.022Z",
          },
          featured: false,
          trending: true,
          tremVerified: true,
          featuredRequest: { requested: true, status: "pending" },
        }}
      />,
    );

    expect(screen.getByLabelText("Quality score 96 out of 100")).toBeTruthy();
    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("Under review")).toBeTruthy();
    expect(screen.queryByText("TREM_TOUR_INTELLIGENCE_V1")).toBeNull();
    expect(container.querySelector("input")).toBeNull();
  });
});
