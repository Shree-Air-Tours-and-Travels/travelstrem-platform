import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import EnquiryCenter from "../components/EnquiryCenter/EnquiryCenter.jsx";

afterEach(cleanup);

describe("EnquiryCenter", () => {
  it("renders enquiries and bookings through the shared BookingTable", () => {
    const onSelect = vi.fn();
    render(<EnquiryCenter
      enquiries={[{
        id: "enquiry-1",
        enquiryRef: "ENQ-ABC123",
        recordType: "enquiry",
        title: "Leh tour",
        status: "new",
        createdLabel: "22 Aug 2026",
        counterpart: { name: "Travel specialist" },
        request: { travellers: "2", departure: "Flexible" },
      }]}
      bookings={[{
        id: "booking-1",
        bookingRef: "TRM-1001",
        recordType: "booking",
        title: "Goa holiday",
        status: "confirmed",
        createdDisplay: "21 Aug 2026",
        customer: { name: "Akshat" },
      }]}
      onSelect={onSelect}
    />);

    expect(screen.getByRole("region", { name: "All records" })).toBeInTheDocument();
    expect(screen.getAllByText("ENQ-ABC123").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TRM-1001").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByText("Goa holiday")[0]);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "booking-1", recordType: "booking" }));
  });
});
