import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PricingCardView from "../features/tourDetails/widgets/PricingCard/PricingCard.view.jsx";

const baseProps = {
  labels: { contactAgent: "Get a quote" },
  tour: { city: "Goa", priceInfo: { isFinal: true } },
  priceText: "₹12,999",
  cityDisplay: "Goa",
  onContact: vi.fn(),
  onShare: vi.fn(),
  isFavorited: () => false,
  onFavorite: vi.fn(),
};

describe("PricingCardView actions", () => {
  it("renders a single action in a one-column, full-width layout", () => {
    const { container } = render(<PricingCardView {...baseProps} showBookNow={false} />);

    expect(container.querySelector(".tour-detail__action-grid--1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /get a quote/i })).toHaveClass(
      "ui-button--full-width",
    );
  });

  it("renders backend-derived package prices without a booking action", () => {
    const { container } = render(
      <PricingCardView
        {...baseProps}
        priceDisplayMode="FINAL"
        packagePrices={[
          { key: "base", name: "Base", priceText: "₹12,999" },
          { key: "standard", name: "Standard", priceText: "₹16,999" },
          { key: "premium", name: "Premium", priceText: "₹21,999" },
        ]}
      />,
    );

    expect(screen.getByText("Final package prices")).toBeInTheDocument();
    expect(container.querySelectorAll(".tour-detail__package-price")).toHaveLength(3);
    expect(screen.getByRole("button", { name: /get a quote/i })).toBeInTheDocument();
  });
});
