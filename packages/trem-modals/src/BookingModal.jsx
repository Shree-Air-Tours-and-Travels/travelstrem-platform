// src/components/booking/BookingModal.jsx
import "./BookingModal.scss";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { BookingSummaryCard } from "@packages/trem-ui";
import { fetchData, validateFields } from "@packages/trem-utils";

const bookingFields = {
    trip: {
        startDate: { name: "startDate", type: "date", required: true, messages: { required: "Start date is required" } },
        endDate: { name: "endDate", type: "date", required: true, messages: { required: "End date is required" } },
        guests: { name: "guests", type: "number", required: true, min: 1, integer: true, messages: { min: "Add at least one guest" } },
    },
    contact: {
        contactEmail: { name: "contactEmail", type: "email", required: true, messages: { required: "Contact email is required" } },
        contactPhone: { name: "contactPhone", type: "tel", required: true, messages: { required: "Contact phone is required" } },
    },
    traveler: {
        firstName: { name: "firstName", type: "text", required: true, minLength: 2, messages: { required: "First name is required" } },
        lastName: { name: "lastName", type: "text", required: true, messages: { required: "Last name is required" } },
        email: { name: "email", type: "email", required: true, messages: { required: "Traveler email is required" } },
        phone: { name: "phone", type: "tel", required: true, messages: { required: "Traveler phone is required" } },
        age: { name: "age", type: "number", required: true, min: 1, max: 120, integer: true, messages: { required: "Age is required" } },
        passport: { name: "passport", type: "text", required: true, minLength: 3, messages: { required: "Passport / ID is required" } },
        nationality: { name: "nationality", type: "text", required: true, messages: { required: "Nationality is required" } },
        passportExpiryDate: { name: "passportExpiryDate", type: "date", required: true, messages: { required: "Passport expiry is required" } },
        emergencyContactName: { name: "emergencyContactName", type: "text", required: true, messages: { required: "Emergency contact is required" } },
        emergencyContactNumber: { name: "emergencyContactNumber", type: "tel", required: true, messages: { required: "Emergency phone is required" } },
    },
};

const readStoredUser = () => {
    try {
        const rawUser = window.localStorage.getItem("auth_user");
        return rawUser ? JSON.parse(rawUser) : null;
    } catch (error) {
        return null;
    }
};

const getDateInputValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
};

export default function BookingModal({ open = false, onClose = () => { }, tour }) {
    const navigate = useNavigate();
    const tourId = tour && (tour._id || tour.id || String(tour));
    const storageKey = useMemo(() => `bookingModalOpen:${tourId}`, [tourId]);
    const defaultStart = getDateInputValue(tour?.startDate);
    const defaultEnd = getDateInputValue(tour?.endDate);
    const emptyTraveler = useCallback(() => ({
        travellerType: "adult",
        title: "",
        firstName: "",
        middleName: "",
        lastName: "",
        gender: "",
        dob: "",
        email: "",
        phone: "",
        age: "",
        nationality: "",
        countryOfResidence: "",
        passport: "",
        passportIssueCountry: "",
        passportExpiryDate: "",
        emergencyContactName: "",
        emergencyContactRelation: "",
        emergencyContactNumber: "",
        dietaryPreferences: "",
        medicalConditions: "",
        wheelchairRequired: false,
        visaStatus: "",
    }), []);

    const [user, setUser] = useState(null);
    const [isOpen, setIsOpen] = useState(() => {
        try {
            if (typeof window === "undefined") return Boolean(open);
            return open || window.localStorage.getItem(storageKey) === "open";
        } catch (error) {
            return Boolean(open);
        }
    });
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [guests, setGuests] = useState(1);
    const [travelers, setTravelers] = useState([emptyTraveler()]);
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [pricePreview, setPricePreview] = useState(null);

    useEffect(() => {
        const storedUser = readStoredUser();
        setUser(storedUser);
        setContactEmail(storedUser?.email || "");
        setContactPhone(storedUser?.phone || storedUser?.mobile || "");
    }, []);

    useEffect(() => {
        if (!open) return;
        setIsOpen(true);
        try { window.localStorage.setItem(storageKey, "open"); } catch (error) { }
    }, [open, storageKey]);

    useEffect(() => {
        const storedUser = readStoredUser();
        setUser(storedUser);
        setStep(1);
        setStartDate(defaultStart);
        setEndDate(defaultEnd);
        setGuests(1);
        setTravelers([emptyTraveler()]);
        setContactEmail(storedUser?.email || "");
        setContactPhone(storedUser?.phone || storedUser?.mobile || "");
        setPricePreview(null);
        setFieldErrors({});
        setError("");
        try {
            if (window.localStorage.getItem(storageKey) === "open") setIsOpen(true);
        } catch (error) { }
    }, [tourId, defaultStart, defaultEnd, emptyTraveler, storageKey]);

    useEffect(() => {
        setTravelers((prev) => {
            const next = [...prev];
            while (next.length < guests) next.push(emptyTraveler());
            while (next.length > guests) next.pop();
            return next;
        });
    }, [guests, emptyTraveler]);

    useEffect(() => {
        async function fetchPreview() {
            if (!tour || !startDate) return;
            try {
                const id = tour._id || tour.id || tour;
                const q = new URLSearchParams({ date: startDate, guests: String(guests) });
                const res = await fetchData(`/tours/${id}/price?${q.toString()}`);
                if (res?.status === "success") {
                    const data = res.componentData?.data;
                    if (data?.priceSnapshot) setPricePreview(data.priceSnapshot);
                    else if (data && (data.perPerson || data.total || data.min)) setPricePreview(data);
                }
            } catch (error) {
                // price preview is optional
            }
        }
        fetchPreview();
    }, [tour, startDate, guests]);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setError("");
        setFieldErrors({});
        setStep(1);
        try { window.localStorage.removeItem(storageKey); } catch (error) { }
        onClose && onClose();
    }, [onClose, storageKey]);

    const clearFieldError = (fieldName) => {
        setFieldErrors((prev) => {
            const copy = { ...prev };
            delete copy[fieldName];
            return copy;
        });
    };

    const validateTripStep = () => {
        const nextErrors = { ...validateFields({ startDate, endDate, guests }, bookingFields.trip).errors };
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (!nextErrors.startDate && !nextErrors.endDate && start > end) {
            nextErrors.startDate = "Start date must be before end date";
            nextErrors.endDate = "End date must be after start date";
        }
        if (tour?.availability?.seatsAvailable != null) {
            const seats = Number(tour.availability.seatsAvailable);
            if (Number.isFinite(seats) && Number(guests) > seats) nextErrors.guests = `Only ${seats} seats left for this tour`;
        }

        setFieldErrors(nextErrors);
        setError(Object.keys(nextErrors).length ? "Please fix the highlighted fields." : "");
        return Object.keys(nextErrors).length === 0;
    };

    const validateTravelerStep = () => {
        const nextErrors = { ...validateFields({ contactEmail, contactPhone }, bookingFields.contact).errors };
        travelers.forEach((traveler, index) => {
            const result = validateFields(traveler, bookingFields.traveler);
            Object.entries(result.errors).forEach(([field, message]) => {
                nextErrors[`travelers.${index}.${field}`] = message;
            });
        });

        setFieldErrors(nextErrors);
        setError(Object.keys(nextErrors).length ? "Please complete traveler and contact details." : "");
        return Object.keys(nextErrors).length === 0;
    };

    const validateCurrentStep = () => {
        if (step === 1) return validateTripStep();
        if (step === 2) return validateTravelerStep();
        return validateTripStep() && validateTravelerStep();
    };

    const goNext = () => {
        if (!validateCurrentStep()) return;
        setStep((current) => Math.min(3, current + 1));
    };

    const goBack = () => setStep((current) => Math.max(1, current - 1));

    const updateTraveler = (index, field, value) => {
        setTravelers((prev) => prev.map((traveler, travelerIndex) => travelerIndex === index ? { ...traveler, [field]: value } : traveler));
        clearFieldError(`travelers.${index}.${field}`);
    };

    const handleReserve = async () => {
        const tripOk = validateTripStep();
        const travelersOk = validateTravelerStep();
        if (!tripOk || !travelersOk) {
            setStep(tripOk ? 2 : 1);
            return;
        }

        setLoading(true);
        setError("");
        try {
            const payload = {
                tourId: tour._id || tour.id || tour,
                startDate,
                endDate,
                guests,
                travelers: travelers.map((traveler) => ({
                    firstName: traveler.firstName.trim(),
                    lastName: traveler.lastName.trim(),
                    email: traveler.email.trim() || contactEmail.trim(),
                    phone: traveler.phone.trim() || contactPhone.trim(),
                    age: traveler.age,
                    travellerType: traveler.travellerType,
                    title: traveler.title,
                    middleName: traveler.middleName,
                    gender: traveler.gender,
                    dob: traveler.dob,
                    nationality: traveler.nationality,
                    countryOfResidence: traveler.countryOfResidence,
                    passportNumber: traveler.passport || "",
                    passportIssueCountry: traveler.passportIssueCountry,
                    passportExpiryDate: traveler.passportExpiryDate,
                    emergencyContactName: traveler.emergencyContactName,
                    emergencyContactRelation: traveler.emergencyContactRelation,
                    emergencyContactNumber: traveler.emergencyContactNumber,
                    dietaryPreferences: traveler.dietaryPreferences,
                    medicalConditions: traveler.medicalConditions,
                    wheelchairRequired: traveler.wheelchairRequired,
                    visaStatus: traveler.visaStatus,
                })),
                contact: {
                    name: user?.name || `${travelers[0]?.firstName || ""} ${travelers[0]?.lastName || ""}`.trim(),
                    email: contactEmail.trim(),
                    phone: contactPhone.trim(),
                },
                adultCount: travelers.filter((traveler) => traveler.travellerType === "adult").length || guests,
                childCount: travelers.filter((traveler) => traveler.travellerType === "child").length,
                infantCount: travelers.filter((traveler) => traveler.travellerType === "infant").length,
                roomType: "",
                pickupCity: "",
                specialRequests: "",
                termsAccepted: true,
                cancellationPolicyAccepted: true,
                user: user ? { id: user._id || user.id, name: user.name, email: user.email, phone: user.phone } : undefined,
            };

            const res = await fetchData("/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload,
            });

            if (res?.status !== "success") {
                const serverErrors = res?.componentData?.config?.validation?.errors;
                if (serverErrors && Object.keys(serverErrors).length) {
                    const mappedErrors = Object.entries(serverErrors).reduce((acc, [key, value]) => {
                        acc[key.replace(/\.passportNumber$/, ".passport")] = value;
                        return acc;
                    }, {});
                    setFieldErrors(mappedErrors);
                }
                throw new Error(res?.message || "Booking failed");
            }
            const booking = res.componentData?.data;
            if (!booking) throw new Error("Booking created but no booking data returned.");

            try { window.localStorage.removeItem(storageKey); } catch (error) { }
            onClose && onClose();
            setTimeout(() => navigate("/bookings"), 80);
        } catch (err) {
            setError(err.message || "Failed to create booking");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const theme = "#1c7578";
    const fieldError = (name) => fieldErrors[name] ? <div style={styles.fieldError}>{fieldErrors[name]}</div> : null;
    const inputStyle = (name, extra = {}) => ({ ...styles.input, ...(fieldErrors[name] ? styles.inputError : {}), ...extra });

    return (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-label={`Booking - ${tour?.title || ""}`}>
            <div style={styles.modal}>
                <header style={styles.header}>
                    <div>
                        <h3 style={styles.title}>Reserve - {tour?.title}</h3>
                        <p style={styles.sub}>Quick reservation · {tour?.city?.from || "Flexible"} → {tour?.city?.to || "Route"}</p>
                    </div>
                    <button style={styles.closeBtn} onClick={closeModal} aria-label="Close reservation">×</button>
                </header>

                <div style={styles.body}>
                    <div style={styles.left}>
                        <div style={styles.stepsRow} aria-label="Booking steps">
                            {[1, 2, 3].map((item) => <div key={item} style={styles.stepDot(step === item)}>{item}</div>)}
                        </div>

                        {error && <div style={styles.error}>{error}</div>}

                        {step === 1 && (
                            <section style={styles.panel}>
                                <label style={styles.label}>Start date</label>
                                <input style={inputStyle("startDate")} type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); clearFieldError("startDate"); }} />
                                {fieldError("startDate")}

                                <label style={styles.label}>End date</label>
                                <input style={inputStyle("endDate")} type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); clearFieldError("endDate"); }} />
                                {fieldError("endDate")}

                                <label style={styles.label}>Guests</label>
                                <div style={styles.guestRow}>
                                    <button style={{ ...styles.qtyBtn, color: theme }} onClick={() => setGuests((value) => Math.max(1, Number(value) - 1))} aria-label="Decrease guests" type="button">-</button>
                                    <div style={styles.guestCount}>{guests}</div>
                                    <button style={{ ...styles.qtyBtn, color: theme }} onClick={() => { setGuests((value) => Number(value) + 1); clearFieldError("guests"); }} aria-label="Increase guests" type="button">+</button>
                                    <div style={styles.note}>
                                        {tour?.maxGroupSize ? `${tour.maxGroupSize} max` : "Flexible group size"}
                                        {tour?.availability?.seatsAvailable != null && ` · ${tour.availability.seatsAvailable} seats available`}
                                    </div>
                                </div>
                                {fieldError("guests")}
                            </section>
                        )}

                        {step === 2 && (
                            <section style={styles.panel}>
                                <p style={styles.note}>Traveler details are required before you continue. More guests keep this area scrollable instead of expanding the modal.</p>

                                <div style={styles.contactGrid}>
                                    <label style={styles.label}>Contact email</label>
                                    <input style={inputStyle("contactEmail")} type="email" value={contactEmail} onChange={(e) => { setContactEmail(e.target.value); clearFieldError("contactEmail"); }} />
                                    {fieldError("contactEmail")}

                                    <label style={styles.label}>Contact phone</label>
                                    <input style={inputStyle("contactPhone")} type="tel" value={contactPhone} onChange={(e) => { setContactPhone(e.target.value); clearFieldError("contactPhone"); }} />
                                    {fieldError("contactPhone")}
                                </div>

                                <div style={styles.trList}>
                                    {travelers.map((traveler, index) => (
                                        <div key={index} style={styles.travelerCard}>
                                            <strong style={styles.travelerTitle}>Traveler {index + 1}</strong>
                                            <div style={styles.fieldGrid}>
                                                <div>
                                                    <select style={inputStyle(`travelers.${index}.travellerType`)} value={traveler.travellerType} onChange={(e) => updateTraveler(index, "travellerType", e.target.value)}>
                                                        <option value="adult">Adult</option>
                                                        <option value="child">Child</option>
                                                        <option value="infant">Infant</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <select style={inputStyle(`travelers.${index}.title`)} value={traveler.title} onChange={(e) => updateTraveler(index, "title", e.target.value)}>
                                                        <option value="">Title</option>
                                                        <option value="Mr">Mr</option>
                                                        <option value="Ms">Ms</option>
                                                        <option value="Mrs">Mrs</option>
                                                        <option value="Mx">Mx</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <input style={inputStyle(`travelers.${index}.firstName`)} placeholder="First name" value={traveler.firstName} onChange={(e) => updateTraveler(index, "firstName", e.target.value)} />
                                                    {fieldError(`travelers.${index}.firstName`)}
                                                </div>
                                                <div>
                                                    <input style={inputStyle(`travelers.${index}.lastName`)} placeholder="Last name" value={traveler.lastName} onChange={(e) => updateTraveler(index, "lastName", e.target.value)} />
                                                    {fieldError(`travelers.${index}.lastName`)}
                                                </div>
                                                <div>
                                                    <select style={inputStyle(`travelers.${index}.gender`)} value={traveler.gender} onChange={(e) => updateTraveler(index, "gender", e.target.value)}>
                                                        <option value="">Gender</option>
                                                        <option value="male">Male</option>
                                                        <option value="female">Female</option>
                                                        <option value="other">Other</option>
                                                        <option value="prefer_not_say">Prefer not to say</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <input style={inputStyle(`travelers.${index}.dob`)} type="date" placeholder="DOB" value={traveler.dob} onChange={(e) => updateTraveler(index, "dob", e.target.value)} />
                                                </div>
                                                <div>
                                                    <input style={inputStyle(`travelers.${index}.email`)} placeholder="Email" value={traveler.email} onChange={(e) => updateTraveler(index, "email", e.target.value)} />
                                                    {fieldError(`travelers.${index}.email`)}
                                                </div>
                                                <div>
                                                    <input style={inputStyle(`travelers.${index}.phone`)} placeholder="Phone" value={traveler.phone} onChange={(e) => updateTraveler(index, "phone", e.target.value)} />
                                                    {fieldError(`travelers.${index}.phone`)}
                                                </div>
                                                <div>
                                                    <input style={inputStyle(`travelers.${index}.age`)} placeholder="Age" value={traveler.age} onChange={(e) => updateTraveler(index, "age", e.target.value)} />
                                                    {fieldError(`travelers.${index}.age`)}
                                                </div>
                                                <div>
                                                    <input style={inputStyle(`travelers.${index}.passport`)} placeholder="Passport / ID" value={traveler.passport} onChange={(e) => updateTraveler(index, "passport", e.target.value)} />
                                                    {fieldError(`travelers.${index}.passport`)}
                                                </div>
                                                <div>
                                                    <input style={inputStyle(`travelers.${index}.nationality`)} placeholder="Nationality" value={traveler.nationality} onChange={(e) => updateTraveler(index, "nationality", e.target.value)} />
                                                    {fieldError(`travelers.${index}.nationality`)}
                                                </div>
                                                <div>
                                                    <input style={inputStyle(`travelers.${index}.countryOfResidence`)} placeholder="Country of residence" value={traveler.countryOfResidence} onChange={(e) => updateTraveler(index, "countryOfResidence", e.target.value)} />
                                                </div>
                                                <div>
                                                    <input style={inputStyle(`travelers.${index}.passportIssueCountry`)} placeholder="Passport issue country" value={traveler.passportIssueCountry} onChange={(e) => updateTraveler(index, "passportIssueCountry", e.target.value)} />
                                                </div>
                                                <div>
                                                    <input style={inputStyle(`travelers.${index}.passportExpiryDate`)} type="date" value={traveler.passportExpiryDate} onChange={(e) => updateTraveler(index, "passportExpiryDate", e.target.value)} />
                                                    {fieldError(`travelers.${index}.passportExpiryDate`)}
                                                </div>
                                                <div>
                                                    <input style={inputStyle(`travelers.${index}.emergencyContactName`)} placeholder="Emergency contact name" value={traveler.emergencyContactName} onChange={(e) => updateTraveler(index, "emergencyContactName", e.target.value)} />
                                                    {fieldError(`travelers.${index}.emergencyContactName`)}
                                                </div>
                                                <div>
                                                    <input style={inputStyle(`travelers.${index}.emergencyContactRelation`)} placeholder="Emergency relation" value={traveler.emergencyContactRelation} onChange={(e) => updateTraveler(index, "emergencyContactRelation", e.target.value)} />
                                                </div>
                                                <div>
                                                    <input style={inputStyle(`travelers.${index}.emergencyContactNumber`)} placeholder="Emergency phone" value={traveler.emergencyContactNumber} onChange={(e) => updateTraveler(index, "emergencyContactNumber", e.target.value)} />
                                                    {fieldError(`travelers.${index}.emergencyContactNumber`)}
                                                </div>
                                                <div>
                                                    <input style={inputStyle(`travelers.${index}.dietaryPreferences`)} placeholder="Dietary preferences" value={traveler.dietaryPreferences} onChange={(e) => updateTraveler(index, "dietaryPreferences", e.target.value)} />
                                                </div>
                                                <div>
                                                    <input style={inputStyle(`travelers.${index}.medicalConditions`)} placeholder="Medical conditions" value={traveler.medicalConditions} onChange={(e) => updateTraveler(index, "medicalConditions", e.target.value)} />
                                                </div>
                                                <div>
                                                    <select style={inputStyle(`travelers.${index}.visaStatus`)} value={traveler.visaStatus} onChange={(e) => updateTraveler(index, "visaStatus", e.target.value)}>
                                                        <option value="">Visa status</option>
                                                        <option value="not_required">Not required</option>
                                                        <option value="required">Required</option>
                                                        <option value="applied">Applied</option>
                                                        <option value="approved">Approved</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {step === 3 && (
                            <section style={styles.panel}>
                                <h4 style={styles.reviewTitle}>Review</h4>
                                <div style={styles.reviewRows}>
                                    <div><strong>Tour</strong><span>{tour.title}</span></div>
                                    <div><strong>Dates</strong><span>{startDate || "TBD"} → {endDate || "TBD"}</span></div>
                                    <div><strong>Guests</strong><span>{guests}</span></div>
                                    <div><strong>Contact</strong><span>{contactEmail} · {contactPhone}</span></div>
                                </div>

                                <h5 style={styles.reviewTitle}>Travelers</h5>
                                <div style={styles.reviewTravelerList}>
                                    {travelers.map((traveler, index) => (
                                        <div key={index} style={styles.reviewTraveler}>
                                            <div>
                                                <strong>{traveler.firstName} {traveler.lastName}</strong>
                                                <span>{traveler.email} · {traveler.phone}</span>
                                            </div>
                                            <span>Age {traveler.age}</span>
                                        </div>
                                    ))}
                                </div>

                                <button style={styles.btnPrimary} onClick={handleReserve} disabled={loading} type="button">
                                    {loading ? "Submitting..." : "Submit Quote Request"}
                                </button>
                            </section>
                        )}
                    </div>

                    <aside style={styles.right}>
                        <div style={styles.stickySide}>
                            <BookingSummaryCard
                                tour={tour}
                                startDate={startDate}
                                endDate={endDate}
                                guests={guests}
                                priceSnapshot={pricePreview || (tour?.price || tour?.priceInfo || {})}
                            />
                            <div style={styles.helpCard}>
                                <strong>Need help?</strong>
                                <span>Contact support at <a href="tel:+919057635580" style={styles.helpLink}>+91 9057635580</a></span>
                                <span>Cancellation: {tour?.cancellationPolicy || "Check terms on checkout"}</span>
                            </div>
                        </div>
                    </aside>
                </div>

                <footer style={styles.footer}>
                    <div>{step > 1 && <button style={{ ...styles.btnGhost, color: theme }} onClick={goBack} type="button">Back</button>}</div>
                    <div>{step < 3 && <button style={styles.btnPrimary} onClick={goNext} type="button">Next</button>}</div>
                </footer>
            </div>
        </div>
    );
}

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
        background: "var(--surface)",
        borderRadius: 12,
        boxShadow: "var(--shadow-lg)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "18px 20px",
        borderBottom: "1px solid var(--border)",
        background: "linear-gradient(90deg, var(--primary-soft), var(--surface))",
    },
    title: { margin: 0, fontSize: 18, fontWeight: 700, color: "var(--title)" },
    sub: { margin: 0, fontSize: 12, color: "var(--muted)" },
    closeBtn: { background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: "var(--text)" },
    body: { display: "flex", flexDirection: "row", gap: 18, padding: 18, alignItems: "flex-start", overflow: "hidden", minHeight: 0, flex: "1 1 auto" },
    left: { flex: "1 1 560px", minWidth: 260, maxHeight: "calc(96vh - 158px)", overflowY: "auto", paddingRight: 4 },
    right: { width: 320, flexShrink: 0 },
    stickySide: { position: "sticky", top: 18 },
    panel: { marginBottom: 14, background: "transparent" },
    label: { display: "block", fontSize: 13, marginBottom: 6, color: "var(--muted)" },
    input: { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--control-border)", background: "var(--control-bg)", color: "var(--control-text)", marginBottom: 10, fontSize: 14 },
    inputError: { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239,68,68,0.10)" },
    fieldError: { marginTop: -6, marginBottom: 8, color: "#b91c1c", fontSize: 12 },
    guestRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 },
    guestCount: { minWidth: 36, textAlign: "center", fontWeight: 700 },
    qtyBtn: { padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer", background: "var(--surface-inset)" },
    btnPrimary: { background: "var(--color-primary)", color: "var(--color-on-primary)", border: "none", padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 600 },
    btnGhost: { background: "transparent", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: 8, cursor: "pointer" },
    error: { background: "var(--danger-soft)", color: "var(--color-danger)", padding: 10, borderRadius: 8, marginBottom: 12, border: "1px solid var(--border)" },
    stepsRow: { display: "flex", gap: 8, marginBottom: 12 },
    stepDot: (active) => ({ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", background: active ? "var(--color-primary)" : "var(--surface-inset)", color: active ? "var(--color-on-primary)" : "var(--muted)", fontWeight: 700 }),
    footer: { display: "flex", justifyContent: "space-between", gap: 12, padding: 14,         borderTop: "1px solid var(--border)", alignItems: "center" },
    contactGrid: { marginBottom: 14 },
    travelerCard: { border: "1px solid var(--border)", padding: 12, borderRadius: 10, background: "var(--surface-elevated)" },
    travelerTitle: { display: "block", marginBottom: 10, color: "var(--color-primary-dark)" },
    fieldGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 },
    trList: { display: "flex", flexDirection: "column", gap: 10, maxHeight: "min(46vh, 420px)", overflowY: "auto", paddingRight: 4 },
    note: { fontSize: 13, color: "var(--muted)" },
    reviewTitle: { margin: "6px 0 10px 0", color: "var(--color-primary-dark)" },
    reviewRows: { display: "grid", gap: 8, marginBottom: 12 },
    reviewTravelerList: { display: "grid", gap: 8, maxHeight: 260, overflowY: "auto" },
    reviewTraveler: { padding: 10, borderRadius: 8, background: "var(--surface-inset)", display: "flex", justifyContent: "space-between", gap: 10 },
    helpCard: { marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid var(--border)", display: "grid", gap: 6, fontSize: 13, color: "var(--muted)" },
    helpLink: { color: "var(--color-primary)", textDecoration: "none" },
};

BookingModal.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    tour: PropTypes.object.isRequired,
};
