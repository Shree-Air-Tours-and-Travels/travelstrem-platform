import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookingTable, Breadcrumbs, Button, SubTitle } from "@packages/trem-ui";
import { fetchAgentBookings } from "../../../services/agentService";
import { statusLabel, statusTone } from "./bookings.constants";
import pageConfig from "./bookingsListPage.config.json";
import "./BookingsPage.styles.scss";

const normalizeBookingRow = (booking = {}) => {
    const tour = booking.tour || {};
    const start = booking.startDate ? new Date(booking.startDate) : null;
    const end = booking.endDate ? new Date(booking.endDate) : null;
    const days = start && end ? `${Math.round((end - start) / 86400000)} Days` : "";
    const price = booking.priceSnapshot?.total ?? booking.paymentSummary?.total ?? booking.tripSelection?.amount ?? 0;
    const currency = booking.priceSnapshot?.currency || booking.paymentSummary?.currency || booking.tripSelection?.currency || "INR";
    const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 });
    const bookingId = booking._id || booking.id;

    return {
        id: bookingId || booking.bookingRef,
        bookingId,
        displayId: booking.bookingRef || bookingId,
        tour: tour.title || booking.tourTitle || "Tour booking",
        type: Array.isArray(tour.tags) ? tour.tags[0] || "tour" : "tour",
        travellers: `${booking.guestsCount || booking.travelers?.length || 1} Guests`,
        days,
        price: formatter.format(price),
        date: start ? start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
        status: statusLabel(booking.status),
        statusTone: statusTone(booking.status),
    };
};

export default function BookingsListPage() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const { breadcrumbs, pageTitle, columns: columnDefs, table, actions, sortingHeader, pagination, refreshButton } = pageConfig;

    useEffect(() => { loadBookings(); }, []);

    async function loadBookings() {
        setLoading(true);
        try {
            const data = await fetchAgentBookings();
            setBookings(Array.isArray(data) ? data.map(normalizeBookingRow) : []);
        } catch {
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }

    const handleBookingClick = useCallback((row) => {
        const id = row.bookingId || row.id;
        if (!id) return;
        navigate(`/agent/services/bookings/${id}`, {
            state: {
                from: { label: "Bookings Management", path: "/agent/services/bookings" },
                bookingId: id,
            },
        });
    }, [navigate]);

    const columns = useMemo(() =>
        columnDefs.map((col) => {
            if (col.id === "displayId" || col.id === "tour") {
                return { ...col, clickable: true, onClick: handleBookingClick };
            }
            return col;
        }),
    [columnDefs, handleBookingClick]);

    return (
        <section className="services-bookings-page">
            <div className="services-bookings-page__inner">
                <Breadcrumbs items={breadcrumbs} />
                <div className="services-bookings-page__header">
                    <SubTitle text={pageTitle} />
                    <Button
                        variant={refreshButton.variant}
                        iconLeft={refreshButton.iconLeft}
                        onClick={loadBookings}
                        text={refreshButton.text}
                        disabled={loading}
                    />
                </div>
                <BookingTable
                    table={{ ...table, loading }}
                    columns={columns}
                    rows={bookings}
                    onRowClick={handleBookingClick}
                    actions={actions}
                    sortingHeader={sortingHeader}
                    pagination={pagination}
                    className="services-bookings-table"
                />
            </div>
        </section>
    );
}
