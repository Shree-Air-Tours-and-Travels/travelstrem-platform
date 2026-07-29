import React from "react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import Preloader from "../components/Preloader/Preloader.jsx";
import Spinner from "../components/Spinner/Spinner.jsx";

describe("Trem loading indicators", () => {
  it("announces spinner loading state", () => {
    render(<Spinner size="lg" label="Loading bookings" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading bookings");
  });

  it("renders the configured preloader layout and count", () => {
    const { container } = render(
      <Preloader variant="stats" count={4} label="Loading dashboard statistics" />,
    );

    expect(screen.getByRole("status", { name: "Loading dashboard statistics" }))
      .toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll(".trem-preloader__item")).toHaveLength(4);
  });
});
