// src/components/booking/SummaryCard.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";

/**
 * BookingSummaryCard (inline styles, theme: #1c7578)
 *
 * Props:
 *  - tour: object
 *  - startDate, endDate: string (YYYY-MM-DD)
 *  - guests: number
 *  - priceSnapshot: object (perPerson, total, min, max, currency)
 */
export default function BookingSummaryCard({ tour, startDate, endDate, guests = 1, priceSnapshot = {} }) {
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
        root: {
            width: "100%",
            boxSizing: "border-box",
            borderRadius: 12,
            padding: 14,
            background: "#fff",
            border: "1px solid #eef2f3",
            boxShadow: "0 8px 20px rgba(8,12,16,0.06)",
            fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
            color: "#0f1724",
        },
        header: { marginBottom: 10 },
        titleRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
        title: { fontSize: 16, fontWeight: 700, color: "#0b1320", margin: 0 },
        sub: { fontSize: 12, color: "#64748b", margin: 0 },
        body: { marginTop: 10, display: "flex", flexDirection: "column", gap: 10 },
        row: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 },
        hr: { height: 1, background: "#f1f5f9", border: "none", margin: "6px 0" },
        small: { fontSize: 12, color: "#64748b" },
        totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 15, fontWeight: 800, color: "#0b1320" },
        pill: { display: "inline-block", padding: "6px 8px", borderRadius: 999, background: "#f3faf9", color: theme, fontWeight: 700, fontSize: 12 },
        stickyWrap: { position: "sticky", top: 18 },
    };

    return (
        <aside style={styles.root} aria-label="Booking summary">
            <div style={styles.header}>
                <div style={styles.titleRow}>
                    <h4 style={styles.title}>Summary</h4>
                    <div style={styles.pill}>{tour?.city?.from ? `${tour.city.from} → ${tour.city.to}` : ""}</div>
                </div>
                <div style={styles.sub}>{tour?.title}</div>
            </div>

            <div style={styles.body}>
                <div style={styles.row}>
                    <span style={{ color: "#475569" }}>Dates</span>
                    <strong style={{ fontSize: 13 }}>{startDate || "TBD"} → {endDate || "TBD"}</strong>
                </div>

                <div style={styles.row}>
                    <span style={{ color: "#475569" }}>Guests</span>
                    <strong style={{ fontSize: 13 }}>{Number(guests) || 1}</strong>
                </div>

                <hr style={styles.hr} />

                <div style={styles.row}>
                    <span style={{ color: "#475569" }}>Per person</span>
                    <strong>{formatter.format(Number(perPerson) || 0)}</strong>
                </div>

                <div style={styles.totalRow}>
                    <span>Total</span>
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
}

BookingSummaryCard.propTypes = {
    tour: PropTypes.object.isRequired,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    guests: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    priceSnapshot: PropTypes.object,
};
