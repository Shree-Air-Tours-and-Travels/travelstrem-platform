import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PricingCardView from "../features/tourDetails/widgets/PricingCard/PricingCard.view.jsx";

const baseProps = {
  labels: { contactAgent: "Get a quote" },
  tour: { city: "Goa", priceInfo: { isFinal: true } },
  priceText: "₹12,999",
  cityDisplay: "Goa",
  onBook: vi.fn(),
  onContact: vi.fn(),
  onShare: vi.fn(),
  isFavorited: () => false,
  onFavorite: vi.fn(),
};

describe("PricingCardView actions", () => {
  it("renders a single action in a one-column, full-width layout", () => {
    const { container } = render(<PricingCardView {...baseProps} showBookNow={false} />);

    expect(container.querySelector(".tour-detail__action-grid--1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /get a quote/i })).toHaveClass("ui-button--full-width");
  });

  it("renders two actions in a two-action layout", () => {
    const { container } = render(<PricingCardView {...baseProps} showBookNow />);

    expect(container.querySelector(".tour-detail__action-grid--2")).toBeInTheDocument();
    expect(screen.getAllByRole("button").filter((button) => button.closest(".tour-detail__action-grid"))).toHaveLength(2);
  });
});
