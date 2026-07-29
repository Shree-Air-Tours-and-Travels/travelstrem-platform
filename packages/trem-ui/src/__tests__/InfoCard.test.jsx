import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import InfoCard from "../components/InfoCard/InfoCard.jsx";

describe("InfoCard", () => {
  it("renders compact record information and an action", () => {
    const onClick = vi.fn();
    render(
      <InfoCard
        title="Mountain Escape"
        subtitle="TREM-1001"
        badge={{ value: "Upcoming", tone: "upcoming" }}
        fields={[{ id: "price", label: "Amount", value: "₹50,000" }]}
        actionLabel="View booking"
        onClick={onClick}
      />,
    );

    expect(screen.getByText("TREM-1001")).toBeInTheDocument();
    expect(screen.getByText("Upcoming")).toBeInTheDocument();
    expect(screen.getByText("₹50,000")).toBeInTheDocument();
    screen.getByRole("button").click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
