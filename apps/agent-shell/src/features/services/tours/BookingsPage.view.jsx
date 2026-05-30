import React from "react";
import { BookingTable, Button } from "@packages/trem-ui";
import { BOOKING_COLUMN_BASE } from "../bookings/bookings.constants";

export default function BookingsPage({ bookings, bookingLoading, fetchBookings, onBookingClick }) {
    const columns = React.useMemo(() => BOOKING_COLUMN_BASE.map((col) =>
        col.id === "id"
            ? { ...col, clickable: true, onClick: (row) => onBookingClick?.(row) }
            : col
    ), [onBookingClick]);

    return (
        <section className="agent-main-widget agent-bookings-widget">
            <BookingTable
                table={{
                    title: "My Bookings",
                    loading: bookingLoading,
                    emptyState: { title: "No assigned bookings", description: "Bookings assigned to this agent will appear here." },
                    contentMinWidth: 980,
                }}
                columns={columns}
                rows={bookings}
                onRowClick={onBookingClick}
                actions={{
                    search: { placeholder: "Search bookings", keys: ["id", "tour", "type", "status"] },
                    filters: [{ id: "status", label: "Status", options: ["all", "Pending", "Confirmed", "Completed", "Cancelled"] }],
                }}
                sortingHeader={{
                    label: "Sort By :",
                    defaultValue: "recommended",
                    options: [
                        { label: "Recommended", value: "recommended" },
                        { label: "Newest", value: "newest", sort: { columnId: "date", direction: "desc" } },
                    ],
                }}
                pagination={{ pageSizeOptions: [8, 16, 24], pageSize: 8 }}
                className="agent-booking-table"
            />
            <div className="agent-bookings-footer">
                <Button primaryClassName="btn" variant="outline" onClick={fetchBookings} text="Refresh" />
            </div>
        </section>
    );
}
