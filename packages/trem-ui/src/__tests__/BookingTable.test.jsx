import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BookingTable from "../components/BookingTable/BookingTable.jsx";

const rows = [
  { id: "#TR-1", service: { name: "Mountain Escape", type: "Adventure tourism" }, status: "Upcoming", price: "$1,200", priceValue: 1200 },
  { id: "#TR-2", service: { name: "City Stay", type: "Hotel booking" }, status: "Completed", price: "$900", priceValue: 900 },
];

const columns = [
  { id: "id", label: "ID" },
  { id: "service", label: "Service", type: "mediaText", titleAccessor: "service.name", subtitleAccessor: "service.type" },
  { id: "price", label: "Price", sortAccessor: "priceValue", sortable: true },
  { id: "status", label: "Status", type: "status" },
];

describe("BookingTable", () => {
  it("renders an optional hero banner with actions", () => {
    render(
      <BookingTable
        heroBanner={{
          title: "Tour",
          subtitle: "No of Booking : 2",
          actions: [{ id: "export", icon: "share", label: "Export" }],
        }}
        columns={columns}
        rows={rows}
        pagination={{ enabled: false }}
      />
    );

    expect(screen.getByText("Tour")).toBeInTheDocument();
    expect(screen.getByText("No of Booking : 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("renders configurable columns and rows", () => {
    render(<BookingTable table={{ title: "Booking List" }} columns={columns} rows={rows} pagination={{ enabled: false }} />);

    expect(screen.getByText("Booking List")).toBeInTheDocument();
    expect(screen.getByText("Mountain Escape")).toBeInTheDocument();
    expect(screen.getByText("Hotel booking")).toBeInTheDocument();
  });

  it("filters rows through the configured search keys", () => {
    render(
      <BookingTable
        columns={columns}
        rows={rows}
        actions={{ search: { placeholder: "Search", keys: ["service.name"] } }}
        pagination={{ enabled: false }}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "city" } });

    expect(screen.getByText("City Stay")).toBeInTheDocument();
    expect(screen.queryByText("Mountain Escape")).not.toBeInTheDocument();
  });
});
