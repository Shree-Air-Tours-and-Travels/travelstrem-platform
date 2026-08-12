import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AgencyDetailsCard from "../components/AgencyDetailsCard/AgencyDetailsCard.jsx";

describe("AgencyDetailsCard", () => {
  it("shows both the tour agency and uploading agent", () => {
    render(
      <AgencyDetailsCard
        agency={{ name: "TravelsTREM Demo Agency" }}
        operator={{ name: "Akshat Goyal", email: "akshat@example.com" }}
        labels={{ eyebrow: "Operated by", travelPartner: "Uploaded by agent" }}
      />
    );

    expect(screen.getByText("TravelsTREM Demo Agency")).toBeInTheDocument();
    expect(screen.getByText("Uploaded by agent")).toBeInTheDocument();
    expect(screen.getByText("Akshat Goyal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "akshat@example.com" })).toHaveAttribute("href", "mailto:akshat@example.com");
  });

  it("shows provider-owned inventory when no uploader was recorded", () => {
    render(<AgencyDetailsCard agency={{ name: "TravelsTREM Demo Agency" }} />);

    expect(screen.getByText("Inventory owner")).toBeInTheDocument();
    expect(screen.getAllByText("TravelsTREM Demo Agency")).toHaveLength(2);
  });
});
