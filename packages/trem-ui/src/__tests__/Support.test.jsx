import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { SupportActionCard, SupportCategoryCard, SupportTicketCard } from "../components/Support/Support.jsx";

test("support action renders backend fields and forwards the record", () => {
  const onSelect = vi.fn();
  const action = { id: "a", label: "Backend action", icon: "support", enabled: true };
  render(<SupportActionCard action={action} onSelect={onSelect} />);
  fireEvent.click(screen.getByRole("button", { name: "Backend action" }));
  expect(onSelect).toHaveBeenCalledWith(action);
});

test("support ticket uses the supplied status label", () => {
  render(<SupportTicketCard ticket={{ reference: "SUP-1", subject: "Issue", status: { id: "CUSTOM", label: "Waiting on team" } }} />);
  expect(screen.getByText("Waiting On Team")).toBeInTheDocument();
});

test("support category stays configured but does not render when hide is enabled", () => {
  const { container } = render(<SupportCategoryCard item={{ id: "future-service", label: "Future service", hide: true }} />);
  expect(container).toBeEmptyDOMElement();
});
