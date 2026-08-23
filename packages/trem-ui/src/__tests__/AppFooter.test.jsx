import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import AppFooter from "../components/AppFooter/AppFooter.jsx";

afterEach(cleanup);

describe("AppFooter", () => {
  it("renders a compact backend-driven business footer", () => {
    const { container } = render(
      <AppFooter
        config={{
          productName: "Trevio by TravelsTrem",
          owner: "Travel Business",
          description: "Curated group adventures.",
          contacts: [{ id: "support", label: "Support", href: "mailto:help@example.com" }],
          legalLinks: [{ id: "privacy", label: "Privacy", href: "/privacy" }],
        }}
      />,
    );

    expect(screen.getByRole("contentinfo")).toHaveTextContent("Trevio by TravelsTrem");
    expect(screen.getByRole("link", { name: "Support" })).toHaveAttribute(
      "href",
      "mailto:help@example.com",
    );
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(container.querySelectorAll(".trem-app-footer > div")).toHaveLength(1);
  });
});
