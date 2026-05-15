import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { validateFields } from "@packages/trem-utils";
import "./customerBookingCard.scss";

const travelerFields = {
    firstName: { name: "firstName", type: "text", required: true, minLength: 2, messages: { required: "First name is required" } },
    lastName: { name: "lastName", type: "text", required: true, messages: { required: "Last name is required" } },
    email: { name: "email", type: "email", required: true, messages: { required: "Email is required" } },
    phone: { name: "phone", type: "tel", required: true, messages: { required: "Phone is required" } },
    age: { name: "age", type: "number", required: true, min: 1, max: 120, integer: true, messages: { required: "Age is required" } },
    passportNumber: { name: "passportNumber", type: "text", required: true, minLength: 3, messages: { required: "Passport / ID is required" } },
};

const emptyTraveler = () => ({ firstName: "", lastName: "", email: "", phone: "", age: "", passportNumber: "" });

const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString();
};

const formatStatus = (status) => String(status || "QUOTE_REQUESTED").replace(/_/g, " ").toLowerCase();
const lockedStatuses = new Set(["CONFIRMED", "TICKETING", "TICKETED", "TRAVEL_READY", "COMPLETED", "CANCELLED", "REFUND_PENDING", "REFUNDED"]);

export default function CustomerBookingCard({ booking, onCancel, onSaveTravelers, onViewTour, onPay, onAcceptQuote, onRejectQuote }) {
    const [editing, setEditing] = useState(false);
    const [travelers, setTravelers] = useState(booking.travelers || []);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setTravelers(booking.travelers || []);
        setErrors({});
        setEditing(false);
    }, [booking]);

    const id = booking.id || booking._id;
    const tour = booking.tour || {};
    const price = booking.priceSnapshot || {};
    const tourPhoto = tour.photo || (Array.isArray(tour.photos) ? tour.photos[0] : "");
    const status = String(booking.status || "QUOTE_REQUESTED").toUpperCase();
    const isCancelled = status === "CANCELLED";
    const finalPriceReady = !!price.isFinal || ["QUOTE_SENT", "CUSTOMER_ACCEPTED", "PAYMENT_PENDING", "PARTIALLY_PAID", "PAID", "CONFIRMED"].includes(status);
    const canEditTravelers = !lockedStatuses.has(status);
    const canAcceptQuote = status === "QUOTE_SENT";
    const canPay = ["PAYMENT_PENDING", "PARTIALLY_PAID", "CONFIRMED"].includes(status);
    const amountPaid = Number(booking.paymentSummary?.paid ?? booking.payment?.amountPaid ?? 0);
    const pendingAmount = finalPriceReady ? Math.max(0, Number(price.total || 0) - amountPaid) : 0;

    const updateTraveler = (index, field, value) => {
        setTravelers((prev) => prev.map((traveler, travelerIndex) => travelerIndex === index ? { ...traveler, [field]: value } : traveler));
        setErrors((prev) => {
            const copy = { ...prev };
            delete copy[`travelers.${index}.${field}`];
            return copy;
        });
    };

    const addTraveler = () => setTravelers((prev) => [...prev, emptyTraveler()]);
    const removeTraveler = (index) => {
        setTravelers((prev) => prev.filter((_, travelerIndex) => travelerIndex !== index));
        setErrors({});
    };

    const validateTravelers = () => {
        const nextErrors = {};
        travelers.forEach((traveler, index) => {
            const normalizedTraveler = {
                ...traveler,
                passportNumber: traveler.passportNumber || traveler.passport || "",
            };
            const result = validateFields(normalizedTraveler, travelerFields);
            Object.entries(result.errors).forEach(([field, message]) => {
                nextErrors[`travelers.${index}.${field}`] = message;
            });
        });
        if (!travelers.length) nextErrors.travelers = "At least one traveler is required";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const saveTravelers = async () => {
        if (!validateTravelers()) return;
        setSaving(true);
        try {
            await onSaveTravelers(id, travelers);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const fieldError = (name) => errors[name] ? <span className="customer-booking-card__field-error">{errors[name]}</span> : null;

    return (
        <article className="customer-booking-card">
            <div className="customer-booking-card__media">
                {tourPhoto ? <img src={tourPhoto} alt={tour.title || "Tour"} /> : <span>TravelsTREM</span>}
            </div>

            <div className="customer-booking-card__body">
                <header className="customer-booking-card__header">
                    <div>
                        <span className={`customer-booking-card__status customer-booking-card__status--${status.toLowerCase()}`}>{formatStatus(status)}</span>
                        <h3>{tour.title || "Tour booking"}</h3>
                        <p>{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</p>
                    </div>
                    <div className="customer-booking-card__price">
                        <span>{finalPriceReady ? price.currency || "INR" : "Price"}</span>
                        <strong>{finalPriceReady ? `${price.currency || "INR"} ${price.total || 0}` : "In progress"}</strong>
                    </div>
                </header>

                <div className="customer-booking-card__meta">
                    <span>{travelers.length || booking.guestsCount || 1} traveler{(travelers.length || booking.guestsCount || 1) > 1 ? "s" : ""}</span>
                    <span>{booking.bookingRef || "No ref yet"}</span>
                    <span>{finalPriceReady ? "Quote ready" : "Awaiting quote"}</span>
                </div>

                {pendingAmount > 0 ? <p className="customer-booking-card__due">Amount due: {price.currency || "INR"} {pendingAmount}</p> : null}

                {editing ? (
                    <div className="customer-booking-card__editor">
                        {errors.travelers ? <div className="customer-booking-card__field-error">{errors.travelers}</div> : null}
                        <div className="customer-booking-card__traveler-list">
                            {travelers.map((traveler, index) => (
                                <section className="customer-booking-card__traveler-edit" key={traveler._id || index}>
                                    <div className="customer-booking-card__traveler-edit-head">
                                        <strong>Traveler {index + 1}</strong>
                                        {travelers.length > 1 ? <button type="button" onClick={() => removeTraveler(index)}>Remove</button> : null}
                                    </div>
                                    <div className="customer-booking-card__fields">
                                        {["firstName", "lastName", "email", "phone", "age"].map((field) => (
                                            <label key={field}>
                                                <span>{field === "firstName" ? "First name" : field === "lastName" ? "Last name" : field[0].toUpperCase() + field.slice(1)}</span>
                                                <input value={traveler[field] || ""} onChange={(event) => updateTraveler(index, field, event.target.value)} aria-invalid={!!errors[`travelers.${index}.${field}`]} />
                                                {fieldError(`travelers.${index}.${field}`)}
                                            </label>
                                        ))}
                                        <label>
                                            <span>Passport / ID</span>
                                            <input value={traveler.passportNumber || traveler.passport || ""} onChange={(event) => updateTraveler(index, "passportNumber", event.target.value)} aria-invalid={!!errors[`travelers.${index}.passportNumber`]} />
                                            {fieldError(`travelers.${index}.passportNumber`)}
                                        </label>
                                    </div>
                                </section>
                            ))}
                        </div>

                        <div className="customer-booking-card__edit-actions">
                            <button type="button" onClick={addTraveler}>Add traveler</button>
                            <button type="button" onClick={() => { setEditing(false); setTravelers(booking.travelers || []); setErrors({}); }}>Discard changes</button>
                            <button type="button" className="is-primary" onClick={saveTravelers} disabled={saving}>{saving ? "Saving..." : "Save travelers"}</button>
                        </div>
                    </div>
                ) : (
                    <div className="customer-booking-card__travelers">
                        {(booking.travelers || []).map((traveler, index) => (
                            <span key={traveler._id || index}>{traveler.firstName} {traveler.lastName}</span>
                        ))}
                    </div>
                )}

                <footer className="customer-booking-card__actions">
                    <button type="button" onClick={() => onViewTour(booking)}>View tour</button>
                    {canEditTravelers ? <button type="button" onClick={() => setEditing(true)}>Edit travellers</button> : null}
                    {canAcceptQuote ? <button type="button" className="is-primary" onClick={() => onAcceptQuote(id)}>Accept quote</button> : null}
                    {canAcceptQuote ? <button type="button" onClick={() => onRejectQuote(id)}>Reject quote</button> : null}
                    {!isCancelled ? <button type="button" onClick={() => onCancel(id)}>Cancel booking</button> : null}
                    {canPay && pendingAmount > 0 ? <button type="button" className="is-primary" onClick={() => onPay(booking)}>Continue payment</button> : null}
                </footer>
            </div>
        </article>
    );
}

CustomerBookingCard.propTypes = {
    booking: PropTypes.object.isRequired,
    onCancel: PropTypes.func.isRequired,
    onSaveTravelers: PropTypes.func.isRequired,
    onViewTour: PropTypes.func.isRequired,
    onPay: PropTypes.func.isRequired,
    onAcceptQuote: PropTypes.func,
    onRejectQuote: PropTypes.func,
};
