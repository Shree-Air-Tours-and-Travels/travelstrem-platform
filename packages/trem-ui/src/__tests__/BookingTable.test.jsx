import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
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

afterEach(cleanup);

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

  it("paginates client-side rows", () => {
    const manyRows = Array.from({ length: 12 }, (_, index) => ({
      ...rows[0],
      id: `#TR-${index + 1}`,
      service: { name: `Trip ${index + 1}`, type: "Adventure" },
    }));

    render(
      <BookingTable
        columns={columns}
        rows={manyRows}
        pagination={{ pageSize: 10, pageSizeOptions: [10, 20] }}
      />,
    );

    expect(screen.getByText("Trip 1")).toBeInTheDocument();
    expect(screen.queryByText("Trip 12")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Page 2" }));
    expect(screen.getByText("Trip 12")).toBeInTheDocument();
  });

  it("changes the client-side page size from the filter toolbar", () => {
    const manyRows = Array.from({ length: 12 }, (_, index) => ({
      ...rows[0],
      id: `#TR-${index + 1}`,
      service: { name: `Trip ${index + 1}`, type: "Adventure" },
    }));
    const { container } = render(
      <BookingTable
        table={{ title: "Booking List" }}
        columns={columns}
        rows={manyRows}
        pagination={{ pageSize: 10, pageSizeOptions: [10, 20] }}
      />,
    );

    expect(container.querySelector(".booking-table__controls .booking-table__page-size"))
      .toBeInTheDocument();
    expect(container.querySelector(".booking-table__pagination .booking-table__page-size"))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Trip 12")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Entries per page" }));
    fireEvent.click(screen.getByText("20"));

    expect(screen.getByText("Trip 12")).toBeInTheDocument();
  });

  it("owns and renders the page title and description", () => {
    render(
      <BookingTable
        pageHeader={{
          title: "Bookings",
          description: "Search, filter, and manage your travel bookings.",
        }}
        columns={columns}
        rows={rows}
        pagination={{ enabled: false }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Bookings", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Search, filter, and manage your travel bookings.")).toBeInTheDocument();
  });

  it("keeps empty state and pagination inside the stable table panel", () => {
    const { container } = render(
      <BookingTable
        table={{
          title: "Booking List",
          description: "Search and manage bookings.",
          viewportMinHeight: "420px",
          emptyState: {
            icon: "calendar",
            title: "No bookings found",
            description: "Bookings will appear here.",
          },
        }}
        columns={columns}
        rows={[]}
        pagination={{ pageSize: 10, pageSizeOptions: [10, 20] }}
      />,
    );

    const table = screen.getByRole("region", { name: "Booking List" });
    expect(screen.getByRole("heading", { name: "Booking List", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Search and manage bookings.")).toBeInTheDocument();
    expect(table.style.getPropertyValue("--booking-table-viewport-min-height")).toBe("420px");
    expect(screen.getByRole("status")).toHaveTextContent("No bookings found");
    expect(container.querySelector(".booking-table__panel .booking-table__pagination"))
      .toBeInTheDocument();
  });

  it("expands and collapses mobile booking controls", () => {
    render(
      <BookingTable
        table={{
          title: "Booking List",
          mobileCard: { titleAccessor: "service.name" },
          expandFiltersLabel: "Filters",
          collapseFiltersLabel: "Hide filters",
        }}
        columns={columns}
        rows={rows}
        actions={{ search: { placeholder: "Search bookings" } }}
        pagination={{ enabled: false }}
      />,
    );

    const toggle = screen.getByRole("button", { name: /Filters/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: /Hide filters/i }))
      .toHaveAttribute("aria-expanded", "true");
  });
});
