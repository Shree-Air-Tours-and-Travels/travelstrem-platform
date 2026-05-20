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

    const fieldError = (name) => fieldErrors[name] ? <div className="bm-field-error">{fieldErrors[name]}</div> : null;
    const inputClass = (name) => `bm-input${fieldErrors[name] ? " bm-input--error" : ""}`;

    return (
        <div className="bm-overlay" role="dialog" aria-modal="true" aria-label={`Booking - ${tour?.title || ""}`}>
            <div className="bm-root">
                <header className="bm-header">
                    <div>
                        <h3 className="bm-title">Reserve - {tour?.title}</h3>
                        <p className="bm-sub">Quick reservation · {tour?.city?.from || "Flexible"} → {tour?.city?.to || "Route"}</p>
                    </div>
                    <button className="bm-close" onClick={closeModal} aria-label="Close reservation">×</button>
                </header>

                <div className="bm-body">
                    <div className="bm-body__left">
                        <div className="bm-steps" aria-label="Booking steps">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className={`bm-step${step === item ? " bm-step--active" : ""}`}>{item}</div>
                            ))}
                        </div>

                        {error && <div className="bm-error">{error}</div>}

                        {step === 1 && (
                            <section className="bm-panel">
                                <label className="bm-label">Start date</label>
                                <input className={inputClass("startDate")} type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); clearFieldError("startDate"); }} />
                                {fieldError("startDate")}

                                <label className="bm-label">End date</label>
                                <input className={inputClass("endDate")} type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); clearFieldError("endDate"); }} />
                                {fieldError("endDate")}

                                <label className="bm-label">Guests</label>
                                <div className="bm-guest-row">
                                    <button className="bm-qty" onClick={() => setGuests((value) => Math.max(1, Number(value) - 1))} aria-label="Decrease guests" type="button">-</button>
                                    <div className="bm-qty-num">{guests}</div>
                                    <button className="bm-qty" onClick={() => { setGuests((value) => Number(value) + 1); clearFieldError("guests"); }} aria-label="Increase guests" type="button">+</button>
                                    <div className="bm-note">
                                        {tour?.maxGroupSize ? `${tour.maxGroupSize} max` : "Flexible group size"}
                                        {tour?.availability?.seatsAvailable != null && ` · ${tour.availability.seatsAvailable} seats available`}
                                    </div>
                                </div>
                                {fieldError("guests")}
                            </section>
                        )}

                        {step === 2 && (
                            <section className="bm-panel">
                                <p className="bm-note">Traveler details are required before you continue. More guests keep this area scrollable instead of expanding the modal.</p>

                                <div className="bm-contact-grid">
                                    <label className="bm-label">Contact email</label>
                                    <input className={inputClass("contactEmail")} type="email" value={contactEmail} onChange={(e) => { setContactEmail(e.target.value); clearFieldError("contactEmail"); }} />
                                    {fieldError("contactEmail")}

                                    <label className="bm-label">Contact phone</label>
                                    <input className={inputClass("contactPhone")} type="tel" value={contactPhone} onChange={(e) => { setContactPhone(e.target.value); clearFieldError("contactPhone"); }} />
                                    {fieldError("contactPhone")}
                                </div>

                                <div className="bm-tr-list">
                                    {travelers.map((traveler, index) => (
                                        <div key={index} className="bm-traveler-card">
                                            <strong className="bm-traveler-title">Traveler {index + 1}</strong>
                                            <div className="bm-field-grid">
                                                <div>
                                                    <select className={inputClass(`travelers.${index}.travellerType`)} value={traveler.travellerType} onChange={(e) => updateTraveler(index, "travellerType", e.target.value)}>
                                                        <option value="adult">Adult</option>
                                                        <option value="child">Child</option>
                                                        <option value="infant">Infant</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <select className={inputClass(`travelers.${index}.title`)} value={traveler.title} onChange={(e) => updateTraveler(index, "title", e.target.value)}>
                                                        <option value="">Title</option>
                                                        <option value="Mr">Mr</option>
                                                        <option value="Ms">Ms</option>
                                                        <option value="Mrs">Mrs</option>
                                                        <option value="Mx">Mx</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <input className={inputClass(`travelers.${index}.firstName`)} placeholder="First name" value={traveler.firstName} onChange={(e) => updateTraveler(index, "firstName", e.target.value)} />
                                                    {fieldError(`travelers.${index}.firstName`)}
                                                </div>
                                                <div>
                                                    <input className={inputClass(`travelers.${index}.lastName`)} placeholder="Last name" value={traveler.lastName} onChange={(e) => updateTraveler(index, "lastName", e.target.value)} />
                                                    {fieldError(`travelers.${index}.lastName`)}
                                                </div>
                                                <div>
                                                    <select className={inputClass(`travelers.${index}.gender`)} value={traveler.gender} onChange={(e) => updateTraveler(index, "gender", e.target.value)}>
                                                        <option value="">Gender</option>
                                                        <option value="male">Male</option>
                                                        <option value="female">Female</option>
                                                        <option value="other">Other</option>
                                                        <option value="prefer_not_say">Prefer not to say</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <input className={inputClass(`travelers.${index}.dob`)} type="date" placeholder="DOB" value={traveler.dob} onChange={(e) => updateTraveler(index, "dob", e.target.value)} />
                                                </div>
                                                <div>
                                                    <input className={inputClass(`travelers.${index}.email`)} placeholder="Email" value={traveler.email} onChange={(e) => updateTraveler(index, "email", e.target.value)} />
                                                    {fieldError(`travelers.${index}.email`)}
                                                </div>
                                                <div>
                                                    <input className={inputClass(`travelers.${index}.phone`)} placeholder="Phone" value={traveler.phone} onChange={(e) => updateTraveler(index, "phone", e.target.value)} />
                                                    {fieldError(`travelers.${index}.phone`)}
                                                </div>
                                                <div>
                                                    <input className={inputClass(`travelers.${index}.age`)} placeholder="Age" value={traveler.age} onChange={(e) => updateTraveler(index, "age", e.target.value)} />
                                                    {fieldError(`travelers.${index}.age`)}
                                                </div>
                                                <div>
                                                    <input className={inputClass(`travelers.${index}.passport`)} placeholder="Passport / ID" value={traveler.passport} onChange={(e) => updateTraveler(index, "passport", e.target.value)} />
                                                    {fieldError(`travelers.${index}.passport`)}
                                                </div>
                                                <div>
                                                    <input className={inputClass(`travelers.${index}.nationality`)} placeholder="Nationality" value={traveler.nationality} onChange={(e) => updateTraveler(index, "nationality", e.target.value)} />
                                                    {fieldError(`travelers.${index}.nationality`)}
                                                </div>
                                                <div>
                                                    <input className={inputClass(`travelers.${index}.countryOfResidence`)} placeholder="Country of residence" value={traveler.countryOfResidence} onChange={(e) => updateTraveler(index, "countryOfResidence", e.target.value)} />
                                                </div>
                                                <div>
                                                    <input className={inputClass(`travelers.${index}.passportIssueCountry`)} placeholder="Passport issue country" value={traveler.passportIssueCountry} onChange={(e) => updateTraveler(index, "passportIssueCountry", e.target.value)} />
                                                </div>
                                                <div>
                                                    <input className={inputClass(`travelers.${index}.passportExpiryDate`)} type="date" value={traveler.passportExpiryDate} onChange={(e) => updateTraveler(index, "passportExpiryDate", e.target.value)} />
                                                    {fieldError(`travelers.${index}.passportExpiryDate`)}
                                                </div>
                                                <div>
                                                    <input className={inputClass(`travelers.${index}.emergencyContactName`)} placeholder="Emergency contact name" value={traveler.emergencyContactName} onChange={(e) => updateTraveler(index, "emergencyContactName", e.target.value)} />
                                                    {fieldError(`travelers.${index}.emergencyContactName`)}
                                                </div>
                                                <div>
                                                    <input className={inputClass(`travelers.${index}.emergencyContactRelation`)} placeholder="Emergency relation" value={traveler.emergencyContactRelation} onChange={(e) => updateTraveler(index, "emergencyContactRelation", e.target.value)} />
                                                </div>
                                                <div>
                                                    <input className={inputClass(`travelers.${index}.emergencyContactNumber`)} placeholder="Emergency phone" value={traveler.emergencyContactNumber} onChange={(e) => updateTraveler(index, "emergencyContactNumber", e.target.value)} />
                                                    {fieldError(`travelers.${index}.emergencyContactNumber`)}
                                                </div>
                                                <div>
                                                    <input className={inputClass(`travelers.${index}.dietaryPreferences`)} placeholder="Dietary preferences" value={traveler.dietaryPreferences} onChange={(e) => updateTraveler(index, "dietaryPreferences", e.target.value)} />
                                                </div>
                                                <div>
                                                    <input className={inputClass(`travelers.${index}.medicalConditions`)} placeholder="Medical conditions" value={traveler.medicalConditions} onChange={(e) => updateTraveler(index, "medicalConditions", e.target.value)} />
                                                </div>
                                                <div>
                                                    <select className={inputClass(`travelers.${index}.visaStatus`)} value={traveler.visaStatus} onChange={(e) => updateTraveler(index, "visaStatus", e.target.value)}>
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
                            <section className="bm-panel">
                                <h4 className="bm-review-title">Review</h4>
                                <div className="bm-review-rows">
                                    <div><strong>Tour</strong><span>{tour.title}</span></div>
                                    <div><strong>Dates</strong><span>{startDate || "TBD"} → {endDate || "TBD"}</span></div>
                                    <div><strong>Guests</strong><span>{guests}</span></div>
                                    <div><strong>Contact</strong><span>{contactEmail} · {contactPhone}</span></div>
                                </div>

                                <h5 className="bm-review-title">Travelers</h5>
                                <div className="bm-review-travelers">
                                    {travelers.map((traveler, index) => (
                                        <div key={index} className="bm-review-traveler">
                                            <div>
                                                <strong>{traveler.firstName} {traveler.lastName}</strong>
                                                <span>{traveler.email} · {traveler.phone}</span>
                                            </div>
                                            <span>Age {traveler.age}</span>
                                        </div>
                                    ))}
                                </div>

                                <button className="bm-btn bm-btn--primary" onClick={handleReserve} disabled={loading} type="button">
                                    {loading ? "Submitting..." : "Submit Quote Request"}
                                </button>
                            </section>
                        )}
                    </div>

                    <aside className="bm-body__right">
                        <div className="bm-sticky">
                            <BookingSummaryCard
                                tour={tour}
                                startDate={startDate}
                                endDate={endDate}
                                guests={guests}
                                priceSnapshot={pricePreview || (tour?.price || tour?.priceInfo || {})}
                            />
                            <div className="bm-help-card">
                                <strong>Need help?</strong>
                                <span>Contact support at <a href="tel:+919057635580" className="bm-help-link">+91 9057635580</a></span>
                                <span>Cancellation: {tour?.cancellationPolicy || "Check terms on checkout"}</span>
                            </div>
                        </div>
                    </aside>
                </div>

                <footer className="bm-footer">
                    <div>{step > 1 && <button className="bm-btn bm-btn--ghost" onClick={goBack} type="button">Back</button>}</div>
                    <div>{step < 3 && <button className="bm-btn bm-btn--primary" onClick={goNext} type="button">Next</button>}</div>
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
