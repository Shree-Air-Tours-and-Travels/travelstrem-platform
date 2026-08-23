import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TourCard from "../components/TourCard/TourCard.jsx";

const baseTour = {
  _id: "tour-1",
  title: "Himalayan Adventure",
  photo: "/photos/himalaya.jpg",
  desc: "An amazing trek through the Himalayas with breathtaking views and unforgettable experiences.",
  avgRating: 4.5,
  maxGroupSize: 12,
  period: { days: 7, nights: 6 },
  tags: ["trekking"],
  address: { city: "Manali", country: "India" },
  city: { from: "Delhi", to: "Manali" },
  priceInfo: { min: 15000, max: 25000, currency: "INR" },
  reviews: [{ rating: 5 }, { rating: 4 }, { rating: 5 }],
};

describe("TourCard", () => {
  describe("Rendering", () => {
    it("renders tour title and description", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} />
        </MemoryRouter>,
      );
      expect(screen.getByText("Himalayan Adventure")).toBeInTheDocument();
      expect(screen.getByText(/amazing trek/)).toBeInTheDocument();
    });

    it("renders as a link when path is provided", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} path="/tours/tour-1" />
        </MemoryRouter>,
      );
      expect(screen.getByRole("link")).toBeInTheDocument();
    });

    it("renders as article when no path", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} />
        </MemoryRouter>,
      );
      const articles = screen.getAllByRole("button");
      expect(articles.length).toBeGreaterThanOrEqual(1);
      expect(articles[0].className).toContain("tour-card");
    });
  });

  describe("Featured State", () => {
    it("shows featured badge when featured", () => {
      render(
        <MemoryRouter>
          <TourCard tour={{ ...baseTour, featured: true }} />
        </MemoryRouter>,
      );
      expect(screen.getByText("Featured")).toBeInTheDocument();
    });

    it("shows the TREM verified badge for an admin-verified tour", () => {
      render(
        <MemoryRouter>
          <TourCard tour={{ ...baseTour, tremVerified: true }} />
        </MemoryRouter>,
      );
      expect(screen.getByText("TREM verified")).toBeInTheDocument();
    });
  });

  describe("Admin Actions", () => {
    it("marks a draft and changes Edit to Continue", () => {
      render(
        <MemoryRouter>
          <TourCard tour={{ ...baseTour, status: "draft" }} isAdmin onEdit={vi.fn()} />
        </MemoryRouter>,
      );
      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.getByText("Continue")).toBeInTheDocument();
      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    });

    it("shows admin actions when isAdmin and handlers provided", () => {
      const onView = vi.fn();
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} isAdmin onView={onView} onEdit={onEdit} onDelete={onDelete} />
        </MemoryRouter>,
      );
      expect(screen.getByText("View")).toBeInTheDocument();
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    it("does not duplicate the customer View tour button for admin cards", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} isAdmin onView={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
        </MemoryRouter>,
      );
      expect(screen.queryByText("View tour")).not.toBeInTheDocument();
      expect(screen.getByText("View")).toBeInTheDocument();
    });

    it("does not show Edit button if onEdit is not provided", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} isAdmin onDelete={vi.fn()} />
        </MemoryRouter>,
      );
      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    });
  });

  describe("Favorite Button", () => {
    it("shows heart when favorited and onFavorite provided", () => {
      const onFavorite = vi.fn();
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} favorited={false} onFavorite={onFavorite} />
        </MemoryRouter>,
      );
      expect(screen.getByLabelText("Add to favorites")).toBeInTheDocument();
    });

    it("shows Remove from favorites when favorited is true", () => {
      const onFavorite = vi.fn();
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} favorited={true} onFavorite={onFavorite} />
        </MemoryRouter>,
      );
      expect(screen.getByLabelText("Remove from favorites")).toBeInTheDocument();
    });

    it("does not show heart if favorited prop is not boolean", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} onFavorite={vi.fn()} />
        </MemoryRouter>,
      );
      expect(screen.queryByLabelText("Add to favorites")).not.toBeInTheDocument();
    });
  });

  describe("Location & Route", () => {
    it("shows location text", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} />
        </MemoryRouter>,
      );
      expect(screen.getByText(/Manali, India/)).toBeInTheDocument();
    });

    it("shows route text (origin to destination)", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} variant="list" />
        </MemoryRouter>,
      );
      expect(screen.getByText(/Delhi to Manali/)).toBeInTheDocument();
    });
  });

  describe("Price Display", () => {
    it("displays price range", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} />
        </MemoryRouter>,
      );
      expect(screen.getByText("From")).toBeInTheDocument();
      expect(screen.getByText("₹15,000 – ₹25,000")).toBeInTheDocument();
    });

    it("displays single price when min equals max", () => {
      render(
        <MemoryRouter>
          <TourCard
            tour={{ ...baseTour, priceInfo: { min: 15000, max: 15000, currency: "INR" } }}
          />
        </MemoryRouter>,
      );
      expect(screen.getByText("₹15,000")).toBeInTheDocument();
    });

    it('shows "Price on request" when no price info', () => {
      render(
        <MemoryRouter>
          <TourCard tour={{ ...baseTour, priceInfo: null, price: null }} />
        </MemoryRouter>,
      );
      expect(screen.getByText("Price on request")).toBeInTheDocument();
    });
  });

  describe("Rating", () => {
    it("displays rating value", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} />
        </MemoryRouter>,
      );
      expect(screen.getByText("4.5")).toBeInTheDocument();
    });

    it("displays review count", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} />
        </MemoryRouter>,
      );
      expect(screen.getByText("(3)")).toBeInTheDocument();
    });

    it("displays 0.0 when no rating", () => {
      render(
        <MemoryRouter>
          <TourCard tour={{ ...baseTour, avgRating: null }} />
        </MemoryRouter>,
      );
      expect(screen.getByText("0.0")).toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("renders with grid variant class", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} variant="grid" />
        </MemoryRouter>,
      );
      const card = screen.getByRole("button");
      expect(card.className).toContain("tour-card--grid");
    });

    it("renders with compact variant class", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} variant="compact" />
        </MemoryRouter>,
      );
      const card = screen.getByRole("button");
      expect(card.className).toContain("tour-card--compact");
    });

    it("renders with featured variant class", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} variant="featured" />
        </MemoryRouter>,
      );
      const card = screen.getByRole("button");
      expect(card.className).toContain("tour-card--featured");
    });

    it("renders with list variant class by default", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} />
        </MemoryRouter>,
      );
      const card = screen.getByRole("button");
      expect(card.className).toContain("tour-card--list");
    });
  });

  describe("Facts (Duration & Group Size)", () => {
    it("displays period", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} />
        </MemoryRouter>,
      );
      expect(screen.getByText("7d 6n")).toBeInTheDocument();
    });

    it("displays max group size", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} />
        </MemoryRouter>,
      );
      expect(screen.getByText(/Max 12/)).toBeInTheDocument();
    });
  });

  describe("View Tour Button", () => {
    it("shows View tour button in list variant when onView is provided", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} variant="list" onView={vi.fn()} />
        </MemoryRouter>,
      );
      expect(screen.getByText("View tour")).toBeInTheDocument();
    });

    it("does not show View tour button when showActions is false", () => {
      render(
        <MemoryRouter>
          <TourCard tour={baseTour} variant="list" onView={vi.fn()} showActions={false} />
        </MemoryRouter>,
      );
      expect(screen.queryByText("View tour")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles missing tour gracefully", () => {
      render(
        <MemoryRouter>
          <TourCard tour={null} />
        </MemoryRouter>,
      );
      expect(screen.getByText("Untitled Tour")).toBeInTheDocument();
    });

    it("handles missing image with placeholder", () => {
      render(
        <MemoryRouter>
          <TourCard tour={{ ...baseTour, photo: null, photos: [] }} />
        </MemoryRouter>,
      );
      const img = screen.queryByRole("img", { name: /tour/i });
      expect(img).not.toBeInTheDocument();
    });

    it("truncates long description", () => {
      const longDesc = "a".repeat(300);
      render(
        <MemoryRouter>
          <TourCard tour={{ ...baseTour, desc: longDesc }} />
        </MemoryRouter>,
      );
      const descEl = screen.getByText(/^a+/);
      expect(descEl).toBeInTheDocument();
    });
  });
});
