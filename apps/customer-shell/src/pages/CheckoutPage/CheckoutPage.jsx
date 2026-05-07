// FILE: src/pages/CheckoutPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SummaryCard from "../../components/Cards/BookingSummaryCard/BookingSummaryCard.jsx";
import fetchData from "../../utils/fetchData.js";
import { useSelector } from "react-redux";

export default function CheckoutPage() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const user = useSelector(s => s.auth.user);
    const [booking, setBooking] = useState(null);
    const [tour, setTour] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        async function fetchBooking() {
            try {
                setLoading(true);
                setError("");

                const res = await fetchData(`/bookings/${bookingId}`);
                if (!res || res.status !== "success") {
                    const msg = (res && res.message) || "Failed to fetch booking";
                    throw new Error(msg);
                }

                const b = res.componentData && res.componentData.data;
                if (!b) throw new Error("No booking data returned from server");
                setBooking(b);

                // fetch tour if server returned tour id string
                if (b.tour && typeof b.tour === "string") {
                    const trRes = await fetchData(`/tours/${b.tour}`);
                    if (trRes && trRes.status === "success" && trRes.componentData && trRes.componentData.data) {
                        setTour(trRes.componentData.data);
                    } else {
                        setTour(null);
                    }
                } else {
                    setTour(b.tour || null);
                }
            } catch (err) {
                console.error(err);
                setError(err.message || "Unable to load booking");
            } finally {
                setLoading(false);
            }
        }

        fetchBooking();
    }, [bookingId]);

    // "Get my quote" flow -> navigates user to dashboard/status page
    async function handleGetQuote() {
        navigate("/bookings");
    }

    // Keep a 'pay now' dev flow for confirmed bookings (dummy)
    async function handlePay() {
        if (!booking) return;
        setProcessing(true);
        try {
            alert("This is a dummy Pay Now flow. Integrate Stripe/Razorpay here.");
        } catch (err) {
            console.error(err);
            setError(err.message || "Payment failed");
        } finally {
            setProcessing(false);
        }
    }

    // inline styles
    const colorPrimary = "#1c7578";
    const pageStyle = {
        fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
        color: colorPrimary,
        padding: 16,
        boxSizing: "border-box",
        minHeight: "100vh",
        background: "#fafafa"
    };

    const containerStyle = {
        maxWidth: 1100,
        margin: "0 auto",
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
    };

    const mainStyle = {
        flex: "1 1 640px",
        minWidth: 300,
        background: "#fff",
        borderRadius: 10,
        padding: 20,
        boxShadow: "0 8px 20px rgba(16,24,40,0.06)",
        boxSizing: "border-box",
    };

    const sideStyle = {
        width: 320,
        minWidth: 260,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 16,
    };

    const sectionStyle = { marginBottom: 18 };

    const headTitle = { margin: 0, fontSize: 22, lineHeight: 1.1, fontWeight: 600, color: colorPrimary };
    const headSub = { margin: "6px 0 0", fontSize: 13, color: "#6b7280" };

    const row = { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px dashed #e6e6e6", alignItems: "center" };
    const label = { fontSize: 14, color: "#475569", fontWeight: 600 };
    const value = { fontSize: 14, color: colorPrimary, textAlign: "right" };

    const travelersList = { display: "grid", gap: 10 };

    const actions = { display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" };

    const btnBase = {
        padding: "10px 14px",
        borderRadius: 8,
        cursor: "pointer",
        border: "none",
        fontWeight: 600,
        fontSize: 14,
    };

    const btnPrimary = {
        ...btnBase,
        background: colorPrimary,
        color: "#fff",
        boxShadow: "0 6px 14px rgba(28,117,120,0.14)"
    };

    const btnGhost = {
        ...btnBase,
        background: "transparent",
        color: colorPrimary,
        border: `1px solid ${colorPrimary}`
    };

    const muted = { color: "#6b7280", fontSize: 13 };

    if (loading) return <div style={pageStyle}>Loading...</div>;
    if (error) return <div style={pageStyle}>Error: {error}</div>;
    if (!booking) return <div style={pageStyle}>Booking not found.</div>;

    const { startDate, endDate, guestsCount, travelers, priceSnapshot, status } = booking;

    // small helpers
    function fmtDate(d) {
        try {
            return new Date(d).toLocaleDateString();
        } catch {
            return d;
        }
    }

    const formattedStart = startDate ? fmtDate(startDate) : "—";
    const formattedEnd = endDate ? fmtDate(endDate) : "—";
    const priceTotal = priceSnapshot?.total ?? 0;
    const currency = priceSnapshot?.currency ?? "INR";
    const isConfirmed = String(status).toLowerCase() === "confirmed";

    return (
        <main style={pageStyle} className="checkout-root">
            <div style={{ maxWidth: 1100, margin: "0 auto 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 26, color: colorPrimary }}>Checkout</h1>
                    <p style={{ margin: "6px 0 0", color: "#6b7280" }}>Review booking details and complete the next steps.</p>
                </div>

                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Booking ref</div>
                    <div style={{ fontWeight: 700, color: colorPrimary }}>{booking.bookingRef || "—"}</div>
                </div>
            </div>

            <div style={containerStyle}>
                <section style={mainStyle} className="checkout-main">
                    <div style={sectionStyle} className="checkout-head">
                        <h2 style={headTitle}>Booking details</h2>
                        <p style={headSub}>Check the dates, guests and status. Use the side panel for price summary.</p>
                    </div>

                    <div style={{ ...sectionStyle }}>
                        <div style={row}>
                            <div style={label}>Tour</div>
                            <div style={value}>{tour?.title || "—"}</div>
                        </div>

                        <div style={row}>
                            <div style={label}>Dates</div>
                            <div style={value}>{formattedStart} → {formattedEnd}</div>
                        </div>

                        <div style={row}>
                            <div style={label}>Guests</div>
                            <div style={value}>{guestsCount ?? 1}</div>
                        </div>

                        <div style={{ ...row, borderBottom: "none", paddingBottom: 0 }}>
                            <div style={label}>Status</div>
                            <div style={{ ...value, fontWeight: 700, textTransform: "capitalize" }}>{String(status || "—")}</div>
                        </div>
                    </div>

                    <div style={sectionStyle}>
                        <h3 style={{ margin: "8px 0 10px", color: colorPrimary }}>Travelers</h3>
                        {Array.isArray(travelers) && travelers.length > 0 ? (
                            <div style={travelersList}>
                                {travelers.map(t => (
                                    <div key={t._id || `${t.firstName}-${t.lastName}`} style={{ padding: 10, borderRadius: 8, background: "#fbfbfb", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: colorPrimary }}>{t.firstName} {t.lastName}</div>
                                            <div style={muted}>{t.email || ''} {t.email && t.phone ? "·" : ""} {t.phone || ''}</div>
                                        </div>
                                        <div style={{ textAlign: "right", fontSize: 13, color: "#6b7280" }}>
                                            {t._id ? "Saved" : "Not saved"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ margin: 0, color: "#6b7280" }}>No traveler details provided yet.</p>
                        )}
                    </div>

                    <div style={sectionStyle}>
                        <h3 style={{ margin: "8px 0 10px", color: colorPrimary }}>Next step</h3>
                        <p style={{ marginTop: 0, color: "#475569" }}>
                            Request a formal quote to get final pricing from agents. If your booking is confirmed you may proceed to pay.
                        </p>

                        <div style={actions}>
                            <button aria-label="Back" style={btnGhost} onClick={() => navigate(-1)}>Back</button>

                            {isConfirmed ? (
                                <button aria-label="Pay" style={btnPrimary} onClick={handlePay} disabled={processing}>
                                    {processing ? "Processing..." : `Pay ${currency} ${priceTotal}`}
                                </button>
                            ) : (
                                <button aria-label="Get quote" style={btnPrimary} onClick={handleGetQuote}>
                                    Get my quote
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                <aside style={sideStyle} className="checkout-side">
                    <div style={{ width: "100%" }}>
                        {/* SummaryCard remains a separate component; we pass ISO dates (same as before) */}
                        <SummaryCard
                            tour={tour}
                            startDate={startDate ? new Date(startDate).toISOString().slice(0, 10) : ""}
                            endDate={endDate ? new Date(endDate).toISOString().slice(0, 10) : ""}
                            guests={guestsCount || 1}
                            priceSnapshot={priceSnapshot}
                        />
                    </div>

                    <div style={{ background: "#fff", borderRadius: 10, padding: 14, boxShadow: "0 8px 20px rgba(16,24,40,0.06)" }}>
                        <h4 style={{ margin: "0 0 8px", color: colorPrimary }}>Cancellation policy</h4>
                        <p style={{ margin: 0, color: "#475569", fontSize: 13 }}>
                            {tour?.cancellationPolicy || "Standard cancellation rules apply. Please review before booking."}
                        </p>
                    </div>

                    <div style={{ background: "#fff", borderRadius: 10, padding: 12, boxShadow: "0 6px 18px rgba(16,24,40,0.04)", fontSize: 13 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6, color: colorPrimary }}>Need help?</div>
                        <div style={{ color: "#475569" }}>Contact our support or your agent to make changes.</div>
                        <div style={{ marginTop: 10 }}>
                            <button style={{ ...btnGhost, width: "100%" }} onClick={() => navigate("/about")}>Contact support</button>
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    );
}
