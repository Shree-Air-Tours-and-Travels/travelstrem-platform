import React from "react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import PlanCards from "../components/PlanCards/PlanCards.jsx";

const items = [
  {
    id: "holiday-packages",
    title: "Holiday Packages",
    description: "Domestic & international",
    productName: "Trevista",
    image: "https://images.example.com/holiday.jpg",
    imageAlt: "Tropical holiday destination",
    href: "https://trevista.example.com",
    ariaLabel: "Explore holiday packages on Trevista",
  },
];

describe("PlanCards", () => {
  it("renders backend-provided card content and destination", () => {
    render(<PlanCards title="Plan a Journey" ariaLabel="Plan a journey" items={items} />);

    expect(screen.getByRole("heading", { name: "Plan a Journey" })).toBeInTheDocument();
    expect(screen.getByText("Trevista")).toBeInTheDocument();
    expect(screen.getByText("Holiday Packages")).toBeInTheDocument();
    expect(screen.getByText("Domestic & international")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Explore holiday packages on Trevista" }),
    ).toHaveAttribute("href", "https://trevista.example.com");
    expect(screen.getByRole("img", { name: "Tropical holiday destination" })).toHaveAttribute(
      "src",
      "https://images.example.com/holiday.jpg",
    );
  });

  it("renders nothing when the backend supplies no cards", () => {
    const { container } = render(<PlanCards title="Plan a Journey" items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("omits cards hidden by backend configuration", () => {
    render(
      <PlanCards
        title="Plan a Journey"
        items={[items[0], { ...items[0], id: "hidden", title: "Hidden product", hide: true }]}
      />,
    );

    expect(screen.getByText("Holiday Packages")).toBeInTheDocument();
    expect(screen.queryByText("Hidden product")).not.toBeInTheDocument();
  });

  it("renders a coming-soon card as disabled and non-navigable", () => {
    render(
      <PlanCards
        title="Plan a Journey"
        items={[
          {
            ...items[0],
            disabled: true,
            comingSoon: true,
            comingSoonLabel: "Coming soon",
            ariaLabel: "Holiday Packages, coming soon",
          },
        ]}
      />,
    );

    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Holiday Packages, coming soon" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(
      screen.queryByRole("link", { name: "Holiday Packages, coming soon" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the configured grid width and can hide unavailable cards on mobile", () => {
    const { container } = render(
      <PlanCards
        title="Plan a Journey"
        columns={4}
        hideUnavailableOnMobile
        items={[
          items[0],
          {
            ...items[0],
            id: "coming-soon",
            title: "Coming soon product",
            disabled: true,
            comingSoon: true,
          },
        ]}
      />,
    );

    const section = container.querySelector(".trem-plan-cards");
    expect(section.style.getPropertyValue("--trem-plan-cards-columns")).toBe("4");
    expect(section).toHaveClass("trem-plan-cards--hide-unavailable-mobile");
    expect(container.querySelector(".trem-plan-card--disabled")).toBeInTheDocument();
  });
});
