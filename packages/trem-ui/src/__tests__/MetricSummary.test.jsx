import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import MetricSummary from "../components/MetricSummary/MetricSummary.jsx";

describe("MetricSummary", () => {
  it("renders shared card metrics with backend-authored detail and actions", () => {
    const onClick = vi.fn();
    const { container } = render(
      <MetricSummary
        variant="cards"
        ariaLabel="Customer relationship summary"
        items={[
          {
            id: "customers",
            icon: "usersRound",
            value: 11,
            label: "Customers",
            helper: "11 active",
            trailingIcon: "arrowUpRight",
            onClick,
          },
        ]}
      />,
    );

    expect(screen.getByRole("region", { name: "Customer relationship summary" })).toHaveClass(
      "trem-metric-summary--cards",
    );
    expect(screen.getByText("11 active")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /11 customers 11 active/i }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(container.querySelector(".trem-metric-summary__trailing")).toBeInTheDocument();
  });
});
