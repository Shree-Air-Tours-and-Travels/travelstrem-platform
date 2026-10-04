import React from "react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import NoDataFound from "../components/NoDataFound/NoDataFound.jsx";

describe("NoDataFound", () => {
  it("renders backend-provided copy and action", () => {
    render(
      <NoDataFound
        icon="calendar"
        title="No bookings yet"
        description="Your bookings will appear here."
        actionLabel="Explore trips"
        actionHref="/trips"
        actionAriaLabel="Explore available trips"
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("No bookings yet");
    expect(screen.getByText("Your bookings will appear here.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore available trips" })).toHaveAttribute(
      "href",
      "/trips",
    );
  });
});
