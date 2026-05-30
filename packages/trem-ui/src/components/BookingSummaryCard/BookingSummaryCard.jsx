import React, { useMemo } from "react";
import PropTypes from "prop-types";
import "./BookingSummaryCard.styles.scss";

/**
 * BookingSummaryCard (inline styles, theme: #1c7578)
 *
 * Props:
 *  - tour: object
 *  - startDate, endDate: string (YYYY-MM-DD)
 *  - guests: number
 *  - priceSnapshot: object (perPerson, total, min, max, currency)
 */
const BookingSummaryCard = React.memo(function BookingSummaryCard({ tour, startDate, endDate, guests = 1, priceSnapshot = {} }) {
    const theme = "#1c7578";

    const perPerson = useMemo(() => {
        if (typeof priceSnapshot.perPerson === "number") return priceSnapshot.perPerson;
        const min = Number(priceSnapshot.min || priceSnapshot.min === 0 ? priceSnapshot.min : null);
        const max = Number(priceSnapshot.max || priceSnapshot.max === 0 ? priceSnapshot.max : null);
        if (!Number.isNaN(min) && !Number.isNaN(max)) return Math.round((min + max) / 2);
        if (!Number.isNaN(min)) return min;
        if (!Number.isNaN(max)) return max;
        return 0;
    }, [priceSnapshot]);

    const total = useMemo(() => {
        if (typeof priceSnapshot.total === "number") return priceSnapshot.total;
        return perPerson * (Number(guests) || 1);
    }, [priceSnapshot, perPerson, guests]);

    const currency = priceSnapshot.currency || (priceSnapshot?.currencyCode) || "INR";

    const formatter = useMemo(() => {
        try {
            return new Intl.NumberFormat("en-IN", { style: "currency", currency });
        } catch {
            return { format: (v) => `${v} ${currency}` };
        }
    }, [currency]);

    const styles = {
        header: { marginBottom: 10 },
        titleRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
        title: { fontSize: 16, fontWeight: 700, color: "var(--title)", margin: 0 },
        sub: { fontSize: 12, color: "var(--muted)", margin: 0 },
        body: { marginTop: 10, display: "flex", flexDirection: "column", gap: 10 },
        row: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 },
        hr: { height: 1, background: "var(--border)", border: "none", margin: "6px 0" },
        small: { fontSize: 12, color: "var(--muted)" },
        totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 15, fontWeight: 800, color: "var(--title)" },
        pill: { display: "inline-block", padding: "6px 8px", borderRadius: 999, background: "var(--primary-soft)", color: "var(--color-primary-dark)", fontWeight: 700, fontSize: 12 },
        stickyWrap: { position: "sticky", top: 18 },
    };

    return (
        <aside className="booking-summary-card" aria-label="Booking summary">
            <div style={styles.header}>
                <div style={styles.titleRow}>
                    <h4 style={styles.title}>Summary</h4>
                    <div style={styles.pill}>{tour?.city?.from ? `${tour.city.from} → ${tour.city.to}` : ""}</div>
                </div>
                <div style={styles.sub}>{tour?.title}</div>
            </div>

            <div style={styles.body}>
                <div style={styles.row}>
                    <span style={{ color: "var(--muted)" }}>Dates</span>
                    <strong style={{ fontSize: 13 }}>{startDate || "TBD"} → {endDate || "TBD"}</strong>
                </div>

                <div style={styles.row}>
                    <span style={{ color: "var(--muted)" }}>Guests</span>
                    <strong style={{ fontSize: 13 }}>{Number(guests) || 1}</strong>
                </div>

                <hr style={styles.hr} />

                <div style={styles.row}>
                    <span style={{ color: "var(--muted)" }}>Per person</span>
                    <strong>{formatter.format(Number(perPerson) || 0)}</strong>
                </div>

                <div style={styles.totalRow}>
                    <span>Estimate Cost</span>
                    <strong>{formatter.format(Number(total) || 0)}</strong>
                </div>

                <div style={styles.small}>
                    <p style={{ margin: "6px 0 0 0" }}>
                        Final price, taxes and payment options will appear on the checkout page.
                    </p>
                </div>
            </div>
        </aside>
    );
});

BookingSummaryCard.displayName = "BookingSummaryCard";
BookingSummaryCard.propTypes = {
    tour: PropTypes.object.isRequired,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    guests: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    priceSnapshot: PropTypes.object,
};
export default BookingSummaryCard;
