import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OptionsModal } from "@packages/trem-modals";
import QuoteComparison from "../components/QuoteComparison/QuoteComparison.jsx";

describe("backend-driven pricing and hotel guidance", () => {
  it("guides the traveller before pricing inputs are complete", () => {
    render(
      <QuoteComparison
        labels={{
          intelligenceTag: "TREM intelligence",
          assistantTitle: "Build your intelligent trip price",
          detailsProgress: "Pricing details",
          waitingForDetails: "Complete the required choices to calculate.",
        }}
        requirements={[
          { id: "travellers", label: "Number of travellers", complete: true },
          { id: "dates", label: "Travel dates", complete: false },
        ]}
      />,
    );

    expect(screen.getByText("Build your intelligent trip price")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("Complete the required choices to calculate.")).toBeInTheDocument();
  });

  it("shows an accessible intelligence calculation state before replacing it with a price", () => {
    render(
      <QuoteComparison
        loading
        labels={{
          intelligenceTag: "TREM intelligence",
          calculating: "Calculating your TREM price…",
          calculatingDescription: "Comparing live package components.",
        }}
      />,
    );

    expect(screen.getByText("Calculating your TREM price…")).toBeInTheDocument();
    expect(screen.getByText("Comparing live package components.")).toBeInTheDocument();
    expect(screen.getByText("Calculating your TREM price…").closest("section")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("renders the intelligence badge exactly as supplied by the page contract", () => {
    render(
      <QuoteComparison
        labels={{ intelligenceTag: "TREM intelligence" }}
        preview={{
          currency: "INR",
          travellers: 2,
          rooms: 1,
          quoteMode: "PACKAGE",
          package: { packageName: "Premium", perPersonMinor: 3653600, totalMinor: 7307200 },
          customized: {
            packageName: "Premium",
            perPersonMinor: 3653600,
            totalMinor: 7307200,
          },
        }}
      />,
    );

    expect(screen.getByText("TREM intelligence")).toBeInTheDocument();
  });

  it("shows the supplied empty-state guidance and removes an unusable apply action", () => {
    render(
      <OptionsModal
        open
        onClose={vi.fn()}
        title="Hotel options · Jispa"
        options={[]}
        emptyTitle="No alternate hotels available yet"
        emptyDescription="An agent will confirm suitable choices in your quote."
        confirmLabel="Apply hotel"
        cancelLabel="Cancel"
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("No alternate hotels available yet")).toBeInTheDocument();
    expect(screen.getByText("An agent will confirm suitable choices in your quote.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Apply hotel" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});
