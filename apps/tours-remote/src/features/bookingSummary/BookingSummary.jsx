import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Breadcrumbs, GlobalLoader, Icon, FloatingActionBar } from "@packages/trem-ui";
import { ConfirmOverlay } from "@packages/trem-modals";
import { fetchData } from "@packages/trem-utils";
import "../booking/Booking.scss";
import "./BookingSummary.scss";

const editableStatuses = new Set(["DRAFT", "QUOTE_REQUESTED", "UNDER_REVIEW", "PAYMENT_PENDING"]);
const terminalStatuses = new Set(["CANCELLED", "COMPLETED", "REFUNDED"]);
const checkoutStatuses = new Set(["QUOTE_SENT", "QUOTE_READY", "PAYMENT_PENDING", "PARTIALLY_PAID", "CONFIRMED"]);

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const statusLabel = (status = "") => String(status || "PENDING").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const formatCurrency = (amount, currency = "INR") => {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: value % 1 ? 2 : 0 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-IN")}`;
  }
};

const emptyTraveler = () => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  age: "",
  nationality: "",
  passportNumber: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
});

const normalizeTraveler = (traveler = {}) => ({
  id: traveler.id || traveler._id,
  travellerType: traveler.travellerType || traveler.travelerType || "adult",
  firstName: traveler.firstName || "",
  lastName: traveler.lastName || "",
  email: traveler.email || "",
  phone: traveler.phone || "",
  age: traveler.age || "",
  nationality: traveler.nationality || "",
  passportNumber: traveler.passportNumber || traveler.passport || "",
  emergencyContactName: traveler.emergencyContactName || "",
  emergencyContactNumber: traveler.emergencyContactNumber || "",
});

const normalizeComparableForm = (value = {}) => ({
  startDate: value.startDate || "",
  endDate: value.endDate || "",
  contactName: String(value.contactName || "").trim(),
  contactEmail: String(value.contactEmail || "").trim().toLowerCase(),
  contactPhone: String(value.contactPhone || "").trim(),
  specialRequests: String(value.specialRequests || "").trim(),
  travelers: (value.travelers || []).map((traveler) => ({
    travellerType: traveler.travellerType || "adult",
    firstName: String(traveler.firstName || "").trim(),
    lastName: String(traveler.lastName || "").trim(),
    email: String(traveler.email || "").trim().toLowerCase(),
    phone: String(traveler.phone || "").trim(),
    age: String(traveler.age || "").trim(),
    nationality: String(traveler.nationality || "").trim(),
    passportNumber: String(traveler.passportNumber || "").trim(),
    emergencyContactName: String(traveler.emergencyContactName || "").trim(),
    emergencyContactNumber: String(traveler.emergencyContactNumber || "").trim(),
  })),
});

export default function BookingSummaryPage({ dispatchEvent } = {}) {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const referrer = location.state?.from || { label: "Dashboard", path: "/dashboard", activeNav: "tours" };
  const [booking, setBooking] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [originalFormSnapshot, setOriginalFormSnapshot] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [showDashboardPrompt, setShowDashboardPrompt] = useState(Boolean(location.state?.showDashboardPrompt));
  const [structure, setStructure] = useState({ actions: [] });
  const [elements, setElements] = useState({ labels: {}, urls: {} });

  const goToDashboard = useCallback((activeNav = referrer.activeNav || "tours") => {
    if (typeof dispatchEvent === "function") {
      dispatchEvent("navigateToDashboard", { state: { activeNav } });
      return;
    }
    navigate(referrer.path || "/dashboard", { state: { activeNav } });
  }, [dispatchEvent, navigate, referrer]);

  const hydrateForm = useCallback((data) => {
    const nextForm = {
      startDate: toDateInput(data?.startDate || data?.travelWindow?.startDate),
      endDate: toDateInput(data?.endDate || data?.travelWindow?.endDate),
      contactName: data?.primaryContact?.name || "",
      contactEmail: data?.primaryContact?.email || "",
      contactPhone: data?.primaryContact?.phone || "",
      specialRequests: data?.tripPreferences?.specialRequests || data?.tripSelection?.specialRequirements || "",
      travelers: (data?.travelers?.length ? data.travelers : [emptyTraveler()]).map(normalizeTraveler),
    };
    setForm(nextForm);
    setOriginalFormSnapshot(JSON.stringify(normalizeComparableForm(nextForm)));
  }, []);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const pageKey = "tours-remote/booking-summary";
      const [heroRes, tourRes, travelRes, travelersRes, timelineRes] = await Promise.all([
        fetchData(`/bookings/${bookingId}/widgets/booking-hero.json?pageKey=${pageKey}`),
        fetchData(`/bookings/${bookingId}/widgets/booking-tour-details.json?pageKey=${pageKey}`),
        fetchData(`/bookings/${bookingId}/widgets/booking-travel-details.json?pageKey=${pageKey}`),
        fetchData(`/bookings/${bookingId}/widgets/booking-travelers.json?pageKey=${pageKey}`),
        fetchData(`/bookings/${bookingId}/widgets/booking-timeline.json?pageKey=${pageKey}`),
      ]);

      const widgets = [heroRes, tourRes, travelRes, travelersRes, timelineRes];
      for (const w of widgets) {
        if (!w || w.status !== "success") throw new Error(w?.message || "Failed to load booking");
      }

      const hero = heroRes.component?.data?.booking || {};
      const tourDetails = tourRes.component?.data?.booking || {};
      const travelDetails = travelRes.component?.data?.booking || {};
      const travelersData = travelersRes.component?.data?.booking || {};
      const timelineData = timelineRes.component?.data?.booking || {};

      const merged = {
        ...hero,
        ...travelDetails,
        ...travelersData,
        ...timelineData,
        tour: tourDetails.tour || hero.tour || {},
        priceSnapshot: tourDetails.priceSnapshot || {},
        paymentSummary: tourDetails.paymentSummary || {},
        currentQuote: tourDetails.currentQuote || null,
        currentQuoteVersion: tourDetails.currentQuoteVersion || 0,
        travelers: travelersData.travelers || [],
        timeline: timelineData.timeline || [],
        statusHistory: timelineData.statusHistory || [],
        viewTourUrl: tourDetails.viewTourUrl || "",
      };

      setBooking(merged);
      setStructure({
        actions: merged.viewTourUrl ? [
          { name: "viewTour", type: "navigate", labelRef: "viewTourLabel", urlRef: "tourDetailsUrl" },
        ] : [],
      });
      setElements({
        labels: { viewTourLabel: "View Tour" },
        urls: { tourDetailsUrl: merged.viewTourUrl },
      });
      hydrateForm(merged);
    } catch (err) {
      setError(err?.message || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }, [bookingId, hydrateForm]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const tour = booking?.tour || {};
  const status = String(booking?.status || "").toUpperCase();
  const canEdit = editableStatuses.has(status);
  const canCancel = booking && !terminalStatuses.has(status);
  const canProceedToCheckout = checkoutStatuses.has(status) || Boolean(booking?.currentQuote || booking?.currentQuoteVersion);
  const hasChanges = form ? JSON.stringify(normalizeComparableForm(form)) !== originalFormSnapshot : false;

  const viewTourAction = useMemo(
    () => (structure.actions || []).find((a) => a.name === "viewTour" && a.type === "navigate"),
    [structure.actions],
  );
  const viewTourUrl = viewTourAction ? elements.urls?.[viewTourAction.urlRef] : "";
  const viewTourLabel = viewTourAction ? elements.labels?.[viewTourAction.labelRef] : "View Tour";

  const viewTour = useCallback(() => {
    if (!viewTourUrl) return;
    navigate(viewTourUrl, { state: { from: { label: "Booking Summary", path: `/tours/bookings/${bookingId}` } } });
  }, [viewTourUrl, navigate, bookingId]);

  const price = useMemo(() => {
    const currency = booking?.priceSnapshot?.currency || booking?.tripSelection?.currency || "INR";
    return {
      total: formatCurrency(booking?.paymentSummary?.total || booking?.priceSnapshot?.total, currency),
      paid: formatCurrency(booking?.paymentSummary?.paid, currency),
      remaining: formatCurrency(booking?.paymentSummary?.remaining, currency),
      perPerson: formatCurrency(booking?.priceSnapshot?.perPerson, currency),
      estimatePerPerson: formatCurrency(booking?.priceSnapshot?.perPerson || booking?.priceSnapshot?.min, currency),
      estimateTotal: formatCurrency(booking?.priceSnapshot?.total || ((booking?.priceSnapshot?.perPerson || booking?.priceSnapshot?.min || 0) * (booking?.guestsCount || 1)), currency),
      isFinal: Boolean(booking?.priceSnapshot?.isFinal || booking?.currentQuote || booking?.currentQuoteVersion),
    };
  }, [booking]);

  const updateTraveler = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      travelers: prev.travelers.map((traveler, itemIndex) => itemIndex === index ? { ...traveler, [field]: value } : traveler),
    }));
  };

  const addTraveler = () => {
    setForm((prev) => ({ ...prev, travelers: [...prev.travelers, emptyTraveler()] }));
  };

  const removeTraveler = (index) => {
    setForm((prev) => ({ ...prev, travelers: prev.travelers.length > 1 ? prev.travelers.filter((_, itemIndex) => itemIndex !== index) : prev.travelers }));
  };

  const handleSave = async () => {
    if (!hasChanges) {
      setMessage("");
      setError("Please change booking details or add/remove a traveler before updating.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        travelWindow: { startDate: form.startDate, endDate: form.endDate },
        contact: { name: form.contactName, email: form.contactEmail, phone: form.contactPhone },
        tripPreferences: { specialRequests: form.specialRequests },
        travelers: form.travelers.map((traveler) => ({
          travellerType: traveler.travellerType || "adult",
          firstName: traveler.firstName,
          lastName: traveler.lastName,
          email: traveler.email || form.contactEmail,
          phone: traveler.phone || form.contactPhone,
          age: traveler.age,
          nationality: traveler.nationality,
          passportNumber: traveler.passportNumber,
          emergencyContactName: traveler.emergencyContactName,
          emergencyContactNumber: traveler.emergencyContactNumber,
        })),
      };
      const res = await fetchData(`/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      if (!res || res.status !== "success") throw new Error(res?.message || "Failed to update booking");
      setBooking(res.componentData?.data);
      hydrateForm(res.componentData?.data);
      setMessage("Booking details updated.");
    } catch (err) {
      setError(err?.message || "Failed to update booking");
    } finally {
      setSaving(false);
    }
  };

  const proceedToCheckout = async () => {
    if (!booking) return;
    if (["QUOTE_SENT", "QUOTE_READY"].includes(status)) {
      const accepted = await runAction(`/bookings/${bookingId}/accept-quote`, "Quote accepted. Continue checkout to complete payment.");
      if (!accepted) return;
    }
    const state = { from: { label: "Booking Summary", path: `/tours/bookings/${bookingId}` } };
    if (typeof dispatchEvent === "function") {
      dispatchEvent("navigateToBookingCheckout", { bookingId, state });
      return;
    }
    navigate(`/tours/bookings/${bookingId}/checkout`, { state });
  };

  const runAction = async (endpoint, successMessage, body = {}) => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetchData(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res || res.status !== "success") throw new Error(res?.message || "Action failed");
      setBooking(res.componentData?.data);
      hydrateForm(res.componentData?.data);
      setMessage(successMessage);
      return true;
    } catch (err) {
      setError(err?.message || "Action failed");
      return false;
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <GlobalLoader visible text="Loading booking summary..." />;

  if (error && !booking) {
    return (
      <main className="booking-summary-page">
        <section className="booking-summary-page__empty">
          <Icon name="alertTriangle" />
          <h1>Booking could not load</h1>
          <p>{error}</p>
          <button type="button" onClick={() => goToDashboard(referrer.activeNav)}>Back to dashboard</button>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-summary-page">
      <div className="booking-summary-page__shell">
        <Breadcrumbs
          items={[
            { label: referrer.label || "Dashboard", path: referrer.path || "/dashboard" },
            { label: "My Bookings", path: referrer.path || "/dashboard" },
            { label: booking?.bookingRef || "Booking Summary" },
          ]}
        />

        <header className="booking-summary-hero">
          <div>
            <span className={`booking-summary-status ${statusClass(status)}`}>{statusLabel(status)}</span>
            <h1>{tour?.title || "Tour Booking"}</h1>
            <p>{booking?.bookingRef}</p>
          </div>
          <div className="booking-summary-hero__actions">
            <button type="button" onClick={() => goToDashboard(referrer.activeNav || "tours")}>
              Dashboard
            </button>
            {canCancel ? <button type="button" className="is-danger" onClick={() => setShowCancel(true)}>Cancel Booking</button> : null}
          </div>
        </header>

        {message ? <div className="booking-summary-alert is-success">{message}</div> : null}
        {error ? <div className="booking-summary-alert is-error">{error}</div> : null}

        <section className="booking-summary-grid">
          <article className="booking-summary-card booking-summary-card--tour">
            <img src={tour?.photo || tour?.photos?.[0] || "https://res.cloudinary.com/dofxshf3z/image/upload/v1779131576/tour-img01_tljj0m.jpg"} alt="" />
            <div>
              <div className="booking-summary-card__tour-header">
                <h2>{tour?.title || "Tour details"}</h2>
                {viewTourAction && viewTourUrl ? <button type="button" onClick={viewTour} className="booking-summary-card__tour-btn">{viewTourLabel}</button> : null}
              </div>
              <p>{tour?.desc || "Tour details will appear here once confirmed."}</p>
              <dl>
                <div><dt>Guests</dt><dd>{booking?.guestsCount || form?.travelers?.length || 1}</dd></div>
                <div><dt>{price.isFinal ? "Final Per Person" : "Estimated Per Person"}</dt><dd>{price.isFinal ? price.perPerson : price.estimatePerPerson}</dd></div>
                <div><dt>{price.isFinal ? "Final Total" : "Estimated Total"}</dt><dd>{price.isFinal ? price.total : price.estimateTotal}</dd></div>
                <div><dt>Remaining</dt><dd>{price.remaining}</dd></div>
              </dl>
              {!price.isFinal ? <p className="booking-summary-card__note">This is an estimate. Final cost will be confirmed by an admin quote.</p> : null}
            </div>
          </article>

          <article className="booking-summary-card">
            <h2>Travel Details</h2>
            <div className="booking-summary-form-grid">
              <label>Start Date<input type="date" value={form.startDate} disabled={!canEdit} onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))} /></label>
              <label>End Date<input type="date" value={form.endDate} disabled={!canEdit} onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))} /></label>
              <label>Contact Name<input value={form.contactName} disabled={!canEdit} onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))} /></label>
              <label>Contact Email<input value={form.contactEmail} disabled={!canEdit} onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))} /></label>
              <label>Contact Phone<input value={form.contactPhone} disabled={!canEdit} onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))} /></label>
              <label className="is-wide">Special Requests<textarea value={form.specialRequests} disabled={!canEdit} onChange={(event) => setForm((prev) => ({ ...prev, specialRequests: event.target.value }))} /></label>
            </div>
          </article>

          <article className="booking-summary-card">
            <header className="booking-summary-card__header">
              <h2>Travelers</h2>
              {canEdit ? <button type="button" onClick={addTraveler}>Add Traveler</button> : null}
            </header>
            <div className="booking-summary-travelers">
              {form.travelers.map((traveler, index) => (
                <section key={traveler.id || index} className="booking-summary-traveler">
                  <header>
                    <strong>Traveler {index + 1}</strong>
                    {canEdit && form.travelers.length > 1 ? <button type="button" onClick={() => removeTraveler(index)}>Remove</button> : null}
                  </header>
                  <div className="booking-summary-form-grid">
                    <label>First Name<input value={traveler.firstName} disabled={!canEdit} onChange={(event) => updateTraveler(index, "firstName", event.target.value)} /></label>
                    <label>Last Name<input value={traveler.lastName} disabled={!canEdit} onChange={(event) => updateTraveler(index, "lastName", event.target.value)} /></label>
                    <label>Email<input value={traveler.email} disabled={!canEdit} onChange={(event) => updateTraveler(index, "email", event.target.value)} /></label>
                    <label>Phone<input value={traveler.phone} disabled={!canEdit} onChange={(event) => updateTraveler(index, "phone", event.target.value)} /></label>
                    <label>Age<input value={traveler.age} disabled={!canEdit} onChange={(event) => updateTraveler(index, "age", event.target.value)} /></label>
                    <label>Nationality<input value={traveler.nationality} disabled={!canEdit} onChange={(event) => updateTraveler(index, "nationality", event.target.value)} /></label>
                    <label>Passport / ID<input value={traveler.passportNumber} disabled={!canEdit} onChange={(event) => updateTraveler(index, "passportNumber", event.target.value)} /></label>
                    <label>Emergency Contact<input value={traveler.emergencyContactName} disabled={!canEdit} onChange={(event) => updateTraveler(index, "emergencyContactName", event.target.value)} /></label>
                    <label>Emergency Phone<input value={traveler.emergencyContactNumber} disabled={!canEdit} onChange={(event) => updateTraveler(index, "emergencyContactNumber", event.target.value)} /></label>
                  </div>
                </section>
              ))}
            </div>
          </article>

          <article className="booking-summary-card">
            <h2>Journey Timeline</h2>
            <div className="booking-summary-timeline">
              {(booking?.timeline || booking?.statusHistory || []).slice(0, 8).map((item) => (
                <div key={item.id || item._id || item.createdAt}>
                  <span />
                  <div>
                    <strong>{item.action || statusLabel(item.to)}</strong>
                    <time>{toDateInput(item.createdAt) || "N/A"}</time>
                  </div>
                </div>
              ))}
              {!(booking?.timeline || booking?.statusHistory || []).length ? <p>No timeline updates yet.</p> : null}
            </div>
          </article>
        </section>

        <FloatingActionBar
          variant="floating"
          align="stretch"
          showBg
          actions={[
            ...(canProceedToCheckout ? [{ label: "Proceed to Checkout", variant: "primary", iconRight: "arrowRight", onClick: proceedToCheckout, disabled: saving }] : []),
            ...(canEdit ? [{ label: saving ? "Saving..." : "Update Booking", variant: "ghost", iconLeft: "save", onClick: handleSave, disabled: saving || !hasChanges }] : []),
            ...(canCancel ? [{ label: "Cancel Booking", variant: "danger", iconLeft: "x", onClick: () => setShowCancel(true), disabled: saving }] : []),
            { label: "Contact Agent", iconLeft: "phone", onClick: () => window.open("tel:+919057635580"), overflowMobile: true },
          ]}
          renderOverflow={(actions) => (
            <div className="booking-fab__contact">
              <Icon name="phone" size={18} />
              <div>
                <strong>Call or message us</strong>
                <a href="tel:+919057635580">+91 9057635580</a>
              </div>
            </div>
          )}
        />
      </div>

      <ConfirmOverlay
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={() => {
          setShowCancel(false);
          runAction(`/bookings/${bookingId}/cancel`, "Booking cancelled.", { reason: "Cancelled by customer" });
        }}
        title="Cancel Booking"
        note="This will cancel the booking request. You can still view it from your dashboard."
        icon="alertTriangle"
        confirmLabel="Cancel Booking"
        cancelLabel="Keep Booking"
        confirmDisabled={saving}
      />

      {showDashboardPrompt ? (
        <div className="booking-summary-return" role="dialog" aria-modal="true">
          <div>
            <Icon name="checkCircle" />
            <h2>Booking request submitted</h2>
            <p>You can stay on this summary page to review details, or go to your dashboard. The dashboard View Booking action will bring you back here.</p>
            <div>
              <button type="button" onClick={() => goToDashboard("tours")}>Go to Dashboard</button>
              <button type="button" onClick={() => setShowDashboardPrompt(false)}>Stay Here</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function statusClass(status = "") {
  return `status-${String(status).toLowerCase().replace(/\s+|_/g, "-")}`;
}
