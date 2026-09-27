import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ItineraryTimelineView from "../features/tourDetails/widgets/ItineraryTimeline/ItineraryTimeline.view.jsx";
import InclusionsExclusionsView from "../features/tourDetails/widgets/InclusionsExclusions/InclusionsExclusions.view.jsx";
import CancellationPolicyView from "../features/tourDetails/widgets/CancellationPolicy/CancellationPolicy.view.jsx";

describe("tour detail disclosure widgets", () => {
  it("keeps itinerary content collapsed until the traveller expands it", () => {
    render(
      <ItineraryTimelineView
        labels={{
          fullItinerary: "Full itinerary",
          plannedExperience: "Planned experience",
          expandAll: "Expand all",
          collapseAll: "Collapse all",
        }}
        itinerary={[
          {
            day: 1,
            title: "Arrival",
            summary: "Reach the hotel",
            activities: ["Airport pickup"],
          },
        ]}
        initialExpandedDays={0}
      />,
    );

    expect(screen.queryByText("Airport pickup")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getByText("Airport pickup")).toBeInTheDocument();
  });

  it("uses each more-count action to expand its inclusion column", () => {
    render(
      <InclusionsExclusionsView
        labels={{
          ariaLabel: "Tour inclusions and exclusions",
          inclusions: "Inclusions",
          exclusions: "Exclusions",
          inclusionsEmpty: "No inclusions",
          exclusionsEmpty: "No exclusions",
          viewAll: "View all",
          showLess: "Show less",
          moreItems: "+{count} more",
        }}
        inclusions={["One", "Two", "Three", "Four", "Five", "Six"]}
        exclusions={["A", "B", "C", "D", "E", "F"]}
        config={{ initialVisibleCount: 5, separateControlsBreakpoint: 640 }}
      />,
    );

    expect(screen.queryByText("Six")).not.toBeInTheDocument();
    expect(screen.queryByText("F")).not.toBeInTheDocument();
    const moreActions = screen.getAllByRole("button", { name: "+1 more" });
    expect(moreActions).toHaveLength(2);
    fireEvent.click(moreActions[0]);
    expect(screen.getByText("Six")).toBeInTheDocument();
    expect(screen.queryByText("F")).not.toBeInTheDocument();
    fireEvent.click(moreActions[1]);
    expect(screen.getByText("F")).toBeInTheDocument();
  });

  it("keeps inclusion controls separate on small screens", () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 480 });

    render(
      <InclusionsExclusionsView
        labels={{
          ariaLabel: "Tour inclusions and exclusions",
          inclusions: "Inclusions",
          exclusions: "Exclusions",
          inclusionsEmpty: "No inclusions",
          exclusionsEmpty: "No exclusions",
          viewAll: "View all",
          showLess: "Show less",
          moreItems: "+{count} more",
        }}
        inclusions={["One", "Two", "Three", "Four", "Five", "Six"]}
        exclusions={["A", "B", "C", "D", "E", "F"]}
        config={{ initialVisibleCount: 5, separateControlsBreakpoint: 640 }}
      />,
    );

    expect(screen.getAllByRole("button", { name: "+1 more" })).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "+1 more" })[0]);
    expect(screen.getByText("Six")).toBeInTheDocument();
    expect(screen.queryByText("F")).not.toBeInTheDocument();

    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
  });

  it("gives legacy free-text cancellation data the structured policy treatment", () => {
    render(
      <CancellationPolicyView
        labels={{
          cancellationPolicy: "Cancellation policy",
          policyTerms: "Cancellation terms",
          policyApplies: "Policy applies to this booking",
        }}
        policy="Cancel up to seven days before departure."
        config={{ headerIcon: "shieldCheck", policySummaryIcon: "info" }}
      />,
    );

    expect(screen.getByText("Cancellation terms")).toBeInTheDocument();
    expect(screen.getByText("Policy applies to this booking")).toBeInTheDocument();
    expect(screen.getByText("Cancel up to seven days before departure.")).toBeInTheDocument();
  });
});
