import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DestinationCard from "../components/DestinationCard/DestinationCard.jsx";

const baseCard = {
  id: "jaipur",
  title: "Jaipur",
  location: "Rajasthan, India",
  image: {
    src: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=85",
    alt: "Jaipur cityscape",
  },
  description: "Pink city of India with forts, palaces and bazaars.",
  duration: { days: 5, nights: 4 },
  rating: 4.6,
  reviewCount: 124,
  price: { amount: 19000, currency: "INR" },
};

describe("DestinationCard", () => {
  it("renders destination title, location and description", () => {
    render(<DestinationCard {...baseCard} />);
    expect(screen.getByText("Jaipur")).toBeInTheDocument();
    expect(screen.getByText("Rajasthan, India")).toBeInTheDocument();
    expect(screen.getByText(/Pink city/)).toBeInTheDocument();
  });

  it("renders duration and price", () => {
    render(<DestinationCard {...baseCard} />);
    expect(screen.getByText("5d 4n")).toBeInTheDocument();
    expect(screen.getByText(/19,000/)).toBeInTheDocument();
  });

  it("renders rating with review count when provided", () => {
    render(<DestinationCard {...baseCard} />);
    expect(screen.getByText("4.6")).toBeInTheDocument();
    expect(screen.getByText("(124)")).toBeInTheDocument();
  });

  it("renders an anchor when href is provided", () => {
    render(<DestinationCard {...baseCard} href="/trevista/tours/jaipur" />);
    const link = screen.getByRole("link", { name: "Jaipur" });
    expect(link.getAttribute("href")).toBe("/trevista/tours/jaipur");
  });

  it("invokes onClick when clicked", () => {
    const onClick = vi.fn();
    render(<DestinationCard {...baseCard} onClick={onClick} />);
    fireEvent.click(screen.getByText("Jaipur"));
    expect(onClick).toHaveBeenCalledWith({ id: "jaipur", title: "Jaipur" });
  });

  it("renders favorite button and toggles on click without navigating", () => {
    const onFavorite = vi.fn();
    render(
      <DestinationCard
        {...baseCard}
        favorite
        href="/trevista/tours/jaipur"
        onFavorite={onFavorite}
      />,
    );
    const button = screen.getByRole("button", { name: "Remove from favorites" });
    fireEvent.click(button);
    expect(onFavorite).toHaveBeenCalledWith({ id: "jaipur", title: "Jaipur" });
  });

  it("renders badges", () => {
    render(<DestinationCard {...baseCard} badges={[{ label: "Trending" }, "Bestseller"]} />);
    expect(screen.getByText("Trending")).toBeInTheDocument();
    expect(screen.getByText("Bestseller")).toBeInTheDocument();
  });

  it("applies variant, size and aspect ratio classes", () => {
    render(<DestinationCard {...baseCard} variant="overlay" size="large" aspectRatio="portrait" />);
    const card = screen.getByLabelText("Jaipur");
    expect(card.className).toContain("trem-destination-card--overlay");
    expect(card.className).toContain("trem-destination-card--large");
    expect(card.className).toContain("trem-destination-card--portrait");
  });

  it("renders a loading skeleton while loading", () => {
    render(<DestinationCard {...baseCard} loading />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading destination card")).toBeInTheDocument();
  });

  it("does not invoke onClick when disabled", () => {
    const onClick = vi.fn();
    render(<DestinationCard {...baseCard} disabled onClick={onClick} />);
    fireEvent.click(screen.getByText("Jaipur"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("falls back to the placeholder when the image fails", () => {
    render(<DestinationCard {...baseCard} />);
    const img = screen.getByRole("img", { name: "Jaipur cityscape" });
    fireEvent.error(img);
    expect(screen.getByText("Jaipur")).toBeInTheDocument();
  });
});
