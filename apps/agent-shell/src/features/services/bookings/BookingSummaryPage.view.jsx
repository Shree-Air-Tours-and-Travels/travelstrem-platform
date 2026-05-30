import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Breadcrumbs, Button, GlobalLoader, SubTitle, Paragraph } from "@packages/trem-ui";
import { getAgentBooking } from "../../../services/agentService";
import pageConfig from "./bookingSummaryPage.config.json";

const getNestedValue = (obj, path, fallback) => {
    if (!path) return fallback;
    const val = String(path).split(".").reduce((value, key) => value?.[key], obj);
    return val ?? fallback ?? "—";
};

export default function BookingSummaryPage() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const { summaryCards, buttons } = pageConfig;
    const parentBreadcrumbs = pageConfig.breadcrumbs.parent;

    useEffect(() => {
        if (!bookingId) return;
        setLoading(true);
        getAgentBooking(bookingId)
            .then((data) => setBooking(data || null))
            .catch((e) => setError(e.message || "Failed to load booking"))
            .finally(() => setLoading(false));
    }, [bookingId]);

    if (loading) return <GlobalLoader visible text={pageConfig.breadcrumbs.loadingLabel} />;

    if (error) return (
        <section className="services-bookings-page">
            <Breadcrumbs items={parentBreadcrumbs} />
            <Paragraph>{error}</Paragraph>
            <Button variant={buttons.back.variant} onClick={() => navigate("/agent/services/bookings")} text={buttons.back.text} />
        </section>
    );

    if (!booking) return (
        <section className="services-bookings-page">
            <Breadcrumbs items={parentBreadcrumbs} />
            <SubTitle text={pageConfig.breadcrumbs.notFoundLabel} />
            <Button variant={buttons.back.variant} onClick={() => navigate("/agent/services/bookings")} text={buttons.back.text} />
        </section>
    );

    const ref = booking.bookingRef || bookingId;
    const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 });

    return (
        <section className="services-bookings-page">
            <Breadcrumbs items={[...parentBreadcrumbs, { label: ref }]} />
            <SubTitle text={`Booking Summary — ${ref}`} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                {summaryCards.map((card) => {
                    const val = getNestedValue(booking, card.accessor, card.fallback);
                    const display = card.key === "price" ? formatter.format(val) : val;
                    return (
                        <div key={card.key} style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 8 }}>
                            <strong>{card.label}</strong>
                            <Paragraph>{display}</Paragraph>
                        </div>
                    );
                })}
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <Button variant={buttons.viewDetails.variant} onClick={() => navigate(`/agent/services/bookings/${bookingId}`)} text={buttons.viewDetails.text} />
                <Button variant={buttons.back.variant} onClick={() => navigate("/agent/services/bookings")} text={buttons.back.text} />
            </div>
        </section>
    );
}
