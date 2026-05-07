// src/components/booking/BookingModal.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import BookingSummaryCard from "../components/Cards/BookingSummaryCard/BookingSummaryCard";
import fetchData from "../utils/fetchData";

/**
 * BookingModal (inline styles, responsive, persisted open state)
 *
 * Props:
 *  - open: boolean (request to open; component also remembers last-opened state in localStorage)
 *  - onClose: function
 *  - tour: object (tour json)
 *
 * Persistence: localStorage key 'bookingModalOpen:<tourId>' — set to "open" when open.
 */

export default function BookingModal({ open = false, onClose = () => { }, tour }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        try {
            const rawUser = window.localStorage.getItem("auth_user");
            setUser(rawUser ? JSON.parse(rawUser) : null);
        } catch (error) {
            setUser(null);
        }
    }, []);

    // unique storage key per tour so opening one tour won't reopen another
    const tourId = tour && (tour._id || tour.id || String(tour));
    const storageKey = useMemo(() => `bookingModalOpen:${tourId}`, [tourId]);

    // internal open state — initialize from prop OR localStorage
    const [isOpen, setIsOpen] = useState(() => {
        try {
            if (typeof window === "undefined") return Boolean(open);
            const saved = window.localStorage.getItem(storageKey);
            if (saved === "open") return true;
        } catch (e) {
            /* ignore */
        }
        return Boolean(open);
    });

    // step + UX state
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // dates & guests
    const defaultStart = tour?.startDate ? new Date(tour.startDate).toISOString().slice(0, 10) : "";
    const defaultEnd = tour?.endDate ? new Date(tour.endDate).toISOString().slice(0, 10) : "";
    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [guests, setGuests] = useState(1);

    // traveler's richer shape: firstName,lastName,email,phone,age,passport
    const emptyTraveler = useCallback(() => ({ firstName: "", lastName: "", email: "", phone: "", age: "", passport: "" }), []);
    const [travelers, setTravelers] = useState([emptyTraveler()]);

    // contact info (booking contact)
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [pricePreview, setPricePreview] = useState(null);

    // sync open prop: if parent asks to open, open and persist
    useEffect(() => {
        if (open) {
            setIsOpen(true);
            try { window.localStorage.setItem(storageKey, "open"); } catch (e) { }
        }
    }, [open, storageKey]);

    // when modal closes (internal close), clear persisted state and call onClose
    const closeModal = useCallback(() => {
        setIsOpen(false);
        setError("");
        setStep(1);
        try { window.localStorage.removeItem(storageKey); } catch (e) { }
        onClose && onClose();
    }, [onClose, storageKey]);

    // when user navigates to a tour with different id, reset fields but keep open if persisted
    useEffect(() => {
        setStartDate(defaultStart);
        setEndDate(defaultEnd);
        setGuests(1);
        setTravelers([emptyTraveler()]);
        setContactEmail("");
        setContactPhone("");
        setPricePreview(null);

        // If a persisted "open" exists for new tour, ensure isOpen true
        try {
            const saved = window.localStorage.getItem(storageKey);
            if (saved === "open") setIsOpen(true);
        } catch (e) { }
    }, [tourId, defaultStart, defaultEnd, emptyTraveler, storageKey]);

    // maintain travelers array length based on guests
    useEffect(() => {
        setTravelers((prev) => {
            const next = [...prev];
            while (next.length < guests) next.push(emptyTraveler());
            while (next.length > guests) next.pop();
            return next;
        });
    }, [guests, emptyTraveler]);

    // price preview (same as before)
    useEffect(() => {
        async function fetchPreview() {
            if (!tour || !startDate) return;
            try {
                const id = tour._id || tour.id || tour;
                const q = new URLSearchParams({ date: startDate, guests: String(guests) });
                const res = await fetchData(`/tours/${id}/price?${q.toString()}`);
                if (res && res.status === "success") {
                    const data = res.componentData && res.componentData.data;
                    if (data && data.priceSnapshot) setPricePreview(data.priceSnapshot);
                    else if (data && (data.perPerson || data.total || data.min)) setPricePreview(data);
                }
            } catch (err) {
                // ignore preview errors
            }
        }
        fetchPreview();
    }, [tour, startDate, guests]);

    // simple validators
    function validDates() {
        if (!startDate || !endDate) return false;
        const s = new Date(startDate);
        const e = new Date(endDate);
        return s <= e;
    }

    function validatePhoneNumber(p) {
        if (!p) return false;
        // naive validation: 7-15 digits allowed, optional + at start
        return /^(\+?\d{7,15})$/.test(p.trim());
    }

    function validateStep1() {
        if (!validDates()) {
            setError("Please select valid start and end dates.");
            return false;
        }
        if (Number(guests) < 1) {
            setError("Guests must be at least 1.");
            return false;
        }
        if (tour?.availability?.seatsAvailable != null) {
            const seats = Number(tour.availability.seatsAvailable);
            if (!Number.isNaN(seats) && guests > seats) {
                setError(`Only ${seats} seats left for this tour.`);
                return false;
            }
        }
        setError("");
        return true;
    }

    function validateStep2() {
        // at least one contact email or traveler email
        const hasEmail = Boolean(contactEmail) || travelers.some((t) => t.email);
        if (!hasEmail) {
            setError("Please provide a contact email or fill traveler email.");
            return false;
        }
        // require phone: either contact phone or each traveler must have phone
        const contactPhoneOk = validatePhoneNumber(contactPhone);
        const travelerPhonesOk = travelers.every((t) => !t.phone || validatePhoneNumber(t.phone)); // optional but if provided must be valid
        if (!contactPhoneOk && !travelers.some((t) => validatePhoneNumber(t.phone))) {
            setError("Please provide a valid contact phone number or a phone for at least one traveler (digits only, +/- allowed).");
            return false;
        }
        if (!travelerPhonesOk) {
            setError("Please ensure traveler phone numbers are valid (7–15 digits).");
            return false;
        }
        setError("");
        return true;
    }

    const goNext = () => {
        if (step === 1) {
            if (!validateStep1()) return;
            setStep(2);
        } else if (step === 2) {
            if (!validateStep2()) return;
            setStep(3);
        }
    };
    const goBack = () => setStep((s) => Math.max(1, s - 1));

    function updateTraveler(index, field, value) {
        setTravelers((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    }

    // Reserve logic (similar but includes new traveler fields)
    async function handleReserve() {
        setLoading(true);
        setError("");
        try {
            const payload = {
                tourId: tour._id || tour.id || tour,
                startDate,
                endDate,
                guests,
                travelers: travelers.map((t) => ({
                    firstName: t.firstName || "-",
                    lastName: t.lastName || "",
                    email: t.email || contactEmail || "",
                    phone: t.phone || contactPhone || "",
                    age: t.age || "",
                    passport: t.passport || "",
                })),
                contact: {
                    email: contactEmail,
                    phone: contactPhone,
                },
                specialRequests: "",
                user: user ? { id: user._id || user.id, name: user.name, email: user.email } : undefined,
            };

            const res = await fetchData("/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload,
            });

            if (!res || res.status !== "success") {
                const msg = (res && res.message) || "Booking failed";
                throw new Error(msg);
            }
            const booking = res.componentData && res.componentData.data ? res.componentData.data : null;
            if (!booking) throw new Error("Booking created but no booking data returned.");

            // persist modal open state cleared before navigation
            try { window.localStorage.removeItem(storageKey); } catch (e) { }
            onClose && onClose();
            // navigate to checkout or booking depending on booking status
            const id = booking.id || booking._id;
            const target = booking.status === "confirmed" ? `/bookings/${id}` : `/checkout/${id}`;
            // small delay to let UI update/unmount
            setTimeout(() => navigate(target), 80);
        } catch (err) {
            console.error("Reserve error:", err);
            setError(err.message || "Failed to create booking");
        } finally {
            setLoading(false);
        }
    }

    // if modal is not open, return null
    if (!isOpen) return null;

    // inline styles (theme color: #1c7578)
    const theme = "#1c7578";
    const styles = {
        overlay: {
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.42)",
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            WebkitOverflowScrolling: "touch",
        },
        modal: {
            width: "100%",
            maxWidth: 980,
            maxHeight: "96vh",
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 20px 60px rgba(5,10,20,0.4)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
        },
        header: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px",
            borderBottom: "1px solid #eee",
            background: "linear-gradient(90deg, rgba(28,117,120,0.06), rgba(28,117,120,0.02))",
        },
        title: { margin: 0, fontSize: 18, fontWeight: 700, color: "#0f1724" },
        sub: { margin: 0, fontSize: 12, color: "#5b6b6b" },
        closeBtn: {
            background: "transparent",
            border: "none",
            fontSize: 22,
            cursor: "pointer",
            color: "#556",
        },
        body: {
            display: "flex",
            flexDirection: "row",
            gap: 18,
            padding: 18,
            alignItems: "flex-start",
            overflow: "auto",
        },
        left: { flex: "1 1 560px", minWidth: 260 },
        right: { width: 320, flexShrink: 0 },
        panel: { marginBottom: 14, background: "transparent" },
        label: { display: "block", fontSize: 13, marginBottom: 6, color: "#475569" },
        input: {
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #e6e6e6",
            marginBottom: 10,
            fontSize: 14,
        },
        smallRow: { display: "flex", gap: 8, alignItems: "center" },
        qtyBtn: {
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #ddd",
            cursor: "pointer",
            background: "#fff",
        },
        btnPrimary: {
            background: theme,
            color: "#fff",
            border: "none",
            padding: "10px 14px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 600,
        },
        btnGhost: {
            background: "transparent",
            border: "1px solid #d1d5db",
            padding: "8px 12px",
            borderRadius: 8,
            cursor: "pointer",
        },
        error: { background: "#fff5f5", color: "#7f1d1d", padding: 10, borderRadius: 8, marginBottom: 12, border: "1px solid #fecaca" },
        stepsRow: { display: "flex", gap: 8, marginBottom: 12 },
        stepDot: (active) => ({ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", background: active ? theme : "#f3f4f6", color: active ? "#fff" : "#94a3b8", fontWeight: 700 }),
        footer: { display: "flex", justifyContent: "space-between", gap: 12, padding: 14, borderTop: "1px solid #eee", alignItems: "center" },
        travelerCard: { border: "1px solid #eef2f6", padding: 12, borderRadius: 10, marginBottom: 10 },
        trList: { display: "flex", flexDirection: "column", gap: 10 },
        note: { fontSize: 13, color: "#64748b" },
    };

    return (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-label={`Booking — ${tour?.title || ""}`}>
            <div style={styles.modal}>
                <header style={styles.header}>
                    <div>
                        <h3 style={styles.title}>Reserve — {tour?.title}</h3>
                        <p style={styles.sub}>Quick reservation · {tour?.city?.from} → {tour?.city?.to}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", }}>
                       
                        <button
                            style={styles.closeBtn}
                            onClick={closeModal}
                            aria-label="Close reservation"
                        >
                            ×
                        </button>
                    </div>
                </header>

                <div style={styles.body}>
                    {/* LEFT: steps & inputs */}
                    <div style={styles.left}>
                        <div style={styles.stepsRow}>
                            <div style={styles.stepDot(step === 1)}>1</div>
                            <div style={styles.stepDot(step === 2)}>2</div>
                            <div style={styles.stepDot(step === 3)}>3</div>
                        </div>

                        {error && <div style={styles.error}>{error}</div>}

                        {/* Step 1 - dates & guests */}
                        {step === 1 && (
                            <section style={styles.panel}>
                                <label style={styles.label}>Start date</label>
                                <input style={styles.input} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

                                <label style={styles.label}>End date</label>
                                <input style={styles.input} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

                                <label style={styles.label}>Guests</label>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                    <button style={{ ...styles.qtyBtn, color: "teal" }} onClick={() => setGuests((g) => Math.max(1, Number(g) - 1))} aria-label="Decrease">-</button>
                                    <div style={{ minWidth: 36, textAlign: "center", fontWeight: 700 }}>{guests}</div>
                                    <button style={{ ...styles.qtyBtn, color: "teal" }} onClick={() => setGuests((g) => Number(g) + 1)} aria-label="Increase">+</button>
                                    <div style={{ marginLeft: 10, ...styles.note }}>
                                        {tour?.maxGroupSize ? `${tour.maxGroupSize} max` : "Flexible group size"}
                                        {tour?.availability?.seatsAvailable != null && ` · ${tour.availability.seatsAvailable} seats available`}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Step 2 - Travelers & contact */}
                        {step === 2 && (
                            <section style={styles.panel}>
                                <p style={styles.note}>Add traveler details (you can edit later on checkout). Contact phone or traveler phone required.</p>

                                <div style={styles.trList}>
                                    {travelers.map((t, i) => (
                                        <div key={i} style={styles.travelerCard}>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <input style={{ ...styles.input, flex: "1 1 50%" }} placeholder="First name" value={t.firstName} onChange={(e) => updateTraveler(i, "firstName", e.target.value)} />
                                                <input style={{ ...styles.input, flex: "1 1 50%" }} placeholder="Last name" value={t.lastName} onChange={(e) => updateTraveler(i, "lastName", e.target.value)} />
                                            </div>

                                            <div style={{ display: "flex", gap: 8 }}>
                                                <input style={{ ...styles.input, flex: "1 1 40%" }} placeholder="Email" value={t.email} onChange={(e) => updateTraveler(i, "email", e.target.value)} />
                                                <input style={{ ...styles.input, flex: "1 1 30%" }} placeholder="Phone (e.g. +919876543210)" value={t.phone} onChange={(e) => updateTraveler(i, "phone", e.target.value)} />
                                                <input style={{ ...styles.input, flex: "1 1 20%" }} placeholder="Age" value={t.age} onChange={(e) => updateTraveler(i, "age", e.target.value)} />
                                            </div>

                                            <div>
                                                <input style={{ ...styles.input }} placeholder="Passport / ID (optional)" value={t.passport} onChange={(e) => updateTraveler(i, "passport", e.target.value)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: 8 }}>
                                    <label style={styles.label}>Contact email</label>
                                    <input style={styles.input} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />

                                    <label style={styles.label}>Contact phone</label>
                                    <input style={styles.input} type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                                </div>
                            </section>
                        )}

                        {/* Step 3 - review */}
                        {step === 3 && (
                            <section style={styles.panel}>
                                <h4 style={{ margin: "6px 0 10px 0" }}>Review</h4>

                                <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><strong>Tour</strong><span>{tour.title}</span></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><strong>Dates</strong><span>{startDate || "TBD"} → {endDate || "TBD"}</span></div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}><strong>Guests</strong><span>{guests}</span></div>
                                </div>

                                <div>
                                    <h5 style={{ margin: "6px 0" }}>Travelers</h5>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {travelers.map((t, i) => (
                                            <div key={i} style={{ padding: 8, borderRadius: 8, background: "#fafafa", display: "flex", justifyContent: "space-between" }}>
                                                <div>
                                                    <div style={{ fontWeight: 700 }}>{t.firstName || "-"} {t.lastName}</div>
                                                    <div style={{ fontSize: 13, color: "#556" }}>{t.email || "No email"} · {t.phone || "No phone"}</div>
                                                </div>
                                                <div style={{ textAlign: "right", fontSize: 13 }}>
                                                    <div>Age: {t.age || "—"}</div>
                                                    <div style={{ marginTop: 6 }}>{t.passport || "No ID"}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <p style={{ marginTop: 12, ...styles.note }}>Final price & payment will be on the checkout page.</p>

                                <div style={{ marginTop: 14 }}>
                                    <button style={styles.btnPrimary} onClick={handleReserve} disabled={loading}>
                                        {loading ? "Reserving..." : "Reserve & Continue"}
                                    </button>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* RIGHT: booking summary card */}
                    <aside style={styles.right}>
                        <div style={{ position: "sticky", top: 18 }}>
                            <BookingSummaryCard
                                tour={tour}
                                startDate={startDate}
                                endDate={endDate}
                                guests={guests}
                                priceSnapshot={pricePreview || (tour?.price || tour?.priceInfo || {})}
                            />

                            <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid #eef2f6" }}>
                                <div style={{ fontSize: 13, color: "#334155", fontWeight: 700 }}>Need help?</div>
                                <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
                                    Contact support at <a href="tel:+911234567890" style={{ color: theme, textDecoration: "none" }}>+91 9602225763</a>
                                </div>
                                <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                                    Cancellation: {tour?.cancellationPolicy || "Check terms on checkout"}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

                <footer style={styles.footer}>
                    <div>
                        {step > 1 && <button style={{ ...styles.btnGhost, color: "teal" }} onClick={goBack}>Back</button>}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                        {step < 3 && <button style={styles.btnPrimary} onClick={goNext}>Next</button>}
                     
                    </div>
                </footer>
            </div>
        </div>
    );
}

BookingModal.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    tour: PropTypes.object.isRequired,
};
