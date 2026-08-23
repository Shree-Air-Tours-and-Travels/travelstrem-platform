import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Breadcrumbs, Button, GlobalLoader, Icon, FloatingActionBar, Title, Paragraph, BookingJourneyCard, Spinner } from "@packages/trem-ui";
import { ConfirmOverlay } from "@packages/trem-modals";
import { fetchData } from "@packages/trem-utils";
import "../booking/Booking.scss";
import "./BookingSummary.scss";

const editableStatuses = new Set(["DRAFT", "QUOTE_REQUESTED", "UNDER_REVIEW", "PAYMENT_PENDING"]);
const terminalStatuses = new Set(["CANCELLED", "COMPLETED", "REFUNDED"]);
const checkoutStatuses = new Set(["QUOTE_SENT", "QUOTE_READY", "PAYMENT_PENDING", "PARTIALLY_PAID", "CONFIRMED"]);

const STATUS_PHASES = [
  { statuses: ["DRAFT", "QUOTE_REQUESTED"], labelKey: "phaseRequest", icon: "fileText" },
  { statuses: ["UNDER_REVIEW", "QUOTE_READY", "QUOTE_SENT"], labelKey: "phaseQuote", icon: "fileText" },
  { statuses: ["CUSTOMER_ACCEPTED", "CUSTOMER_REJECTED"], labelKey: "phaseDecision", icon: "checkCircle" },
  { statuses: ["PAYMENT_PENDING", "PARTIALLY_PAID", "PAID"], labelKey: "phasePayment", icon: "creditCard" },
  { statuses: ["CONFIRMED", "TICKETING", "TICKETED", "TRAVEL_READY"], labelKey: "phaseConfirmed", icon: "checkCircle" },
  { statuses: ["COMPLETED"], labelKey: "phaseCompleted", icon: "award" },
];

const CONFIRMED_AND_AFTER = new Set(["CONFIRMED", "TICKETING", "TICKETED", "TRAVEL_READY", "COMPLETED"]);

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

const getPhaseIndex = (status) => {
  const s = String(status || "").toUpperCase();
  for (let i = 0; i < STATUS_PHASES.length; i++) {
    if (STATUS_PHASES[i].statuses.includes(s)) return i;
  }
  return -1;
};

function downloadPdf(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function BookingSummaryPage({ dispatchEvent, dashboardPath = "/dashboard" } = {}) {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [pageLabels, setPageLabels] = useState({});
  const referrer = location.state?.from || { label: "Dashboard", path: dashboardPath, activeNav: "bookings" };
  const [booking, setBooking] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [originalFormSnapshot, setOriginalFormSnapshot] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelInfo, setCancelInfo] = useState(null);
  const [loadingCancelInfo, setLoadingCancelInfo] = useState(false);
  const [showDashboardPrompt, setShowDashboardPrompt] = useState(Boolean(location.state?.showDashboardPrompt));
  const [structure, setStructure] = useState({ actions: [] });
  const [elements, setElements] = useState({ labels: {}, urls: {} });

  const t = useCallback((key, fallback) => pageLabels?.[key] || fallback || key, [pageLabels]);

  const goToDashboard = useCallback((activeNav = "bookings") => {
    if (typeof dispatchEvent === "function") {
      dispatchEvent("navigateToDashboard", { state: { activeNav } });
      return;
    }
    const targetPath = referrer.path || dashboardPath;
    if (/^https?:\/\//.test(targetPath)) {
      const targetUrl = new URL(targetPath);
      targetUrl.searchParams.set("tab", activeNav);
      window.location.assign(targetUrl.toString());
      return;
    }
    const separator = targetPath.includes("?") ? "&" : "?";
    navigate(`${targetPath}${separator}tab=${encodeURIComponent(activeNav)}`, { state: { activeNav } });
  }, [dispatchEvent, navigate, referrer, dashboardPath]);

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
      const [heroRes, tourRes, travelRes, travelersRes, timelineRes, pageRes] = await Promise.all([
        fetchData(`/bookings/${bookingId}/widgets/booking-hero.json?pageKey=${pageKey}`),
        fetchData(`/bookings/${bookingId}/widgets/booking-tour-details.json?pageKey=${pageKey}`),
        fetchData(`/bookings/${bookingId}/widgets/booking-travel-details.json?pageKey=${pageKey}`),
        fetchData(`/bookings/${bookingId}/widgets/booking-travelers.json?pageKey=${pageKey}`),
        fetchData(`/bookings/${bookingId}/widgets/booking-timeline.json?pageKey=${pageKey}`),
        fetchData("/booking-summary-page.json"),
      ]);

      const widgets = [heroRes, tourRes, travelRes, travelersRes, timelineRes];
      for (const w of widgets) {
        if (!w || w.status !== "success") throw new Error(w?.message || "Failed to load booking");
      }

      if (pageRes && pageRes.status === "success") {
        setPageLabels(pageRes.component?.elements?.labels || {});
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

  const fetchCancelInfo = useCallback(async () => {
    setLoadingCancelInfo(true);
    try {
      const res = await fetchData(`/bookings/${bookingId}/cancel-info`);
      if (res?.status === "success") {
        setCancelInfo(res.componentData?.data || null);
      }
    } catch {
      setCancelInfo(null);
    } finally {
      setLoadingCancelInfo(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  useEffect(() => {
    if (showCancel) fetchCancelInfo();
  }, [showCancel, fetchCancelInfo]);

  const tour = booking?.tour || {};
  const status = String(booking?.status || "").toUpperCase();

  const prevStatusRef = useRef(status);
  useEffect(() => {
    prevStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (loading || !booking?.id) return;
    const cancelledStatuses = new Set(["CANCELLED", "REFUNDED", "REFUND_PENDING"]);
    const interval = setInterval(async () => {
      try {
        const res = await fetchData(`/bookings/${bookingId}/widgets/booking-hero.json?pageKey=tours-remote/booking-summary`);
        if (res?.status === "success") {
          const fresh = res.component?.data?.booking || {};
          const freshStatus = String(fresh.status || "").toUpperCase();
          const oldStatus = String(prevStatusRef.current || "").toUpperCase();
          if (freshStatus !== oldStatus) {
            const wasCancelled = cancelledStatuses.has(freshStatus);
            setBooking((prev) => ({ ...prev, ...fresh, ...(wasCancelled ? { isProceedHide: true } : {}) }));
            setMessage(wasCancelled
              ? "Booking has been cancelled."
              : `Booking updated: ${freshStatus.replace(/_/g, " ").toLowerCase()}.`
            );
            if (wasCancelled) setShowDashboardPrompt(true);
          }
          prevStatusRef.current = freshStatus;
        }
      } catch {
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [loading, booking?.id, bookingId]);

  const canEdit = editableStatuses.has(status);
  const canCancel = booking && !terminalStatuses.has(status);
  const canProceedToCheckout = !booking?.isProceedHide && (checkoutStatuses.has(status) || Boolean(booking?.currentQuote || booking?.currentQuoteVersion));
  const hasChanges = form ? JSON.stringify(normalizeComparableForm(form)) !== originalFormSnapshot : false;
  const hasQuote = Boolean(booking?.currentQuote || booking?.currentQuoteVersion > 0);
  const hasPayment = (booking?.paymentSummary?.paid || 0) > 0;
  const isConfirmedOrAfter = CONFIRMED_AND_AFTER.has(status);

  const phaseIndex = getPhaseIndex(status);

  const viewTourAction = useMemo(
    () => (structure.actions || []).find((a) => a.name === "viewTour" && a.type === "navigate"),
    [structure.actions],
  );
  const viewTourUrl = viewTourAction ? elements.urls?.[viewTourAction.urlRef] : "";
  const viewTourLabel = viewTourAction ? elements.labels?.[viewTourAction.labelRef] : t("viewTour", "View Tour");

  const viewTour = useCallback(() => {
    if (!viewTourUrl) return;
    navigate(viewTourUrl, { state: { from: { label: t("pageTitle", "Booking Summary"), path: `/trevista/bookings/${bookingId}` } } });
  }, [viewTourUrl, navigate, bookingId, t]);

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
      setError(t("updateError", "Please change booking details or add/remove a traveler before updating."));
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
      if (!res || res.status !== "success") throw new Error(res?.message || t("updateErrorGeneric", "Failed to update booking"));
      setBooking(res.componentData?.data);
      hydrateForm(res.componentData?.data);
      setMessage(t("bookingUpdated", "Booking details updated."));
    } catch (err) {
      setError(err?.message || t("updateErrorGeneric", "Failed to update booking"));
    } finally {
      setSaving(false);
    }
  };

  const proceedToCheckout = async () => {
    if (!booking) return;
    if (["QUOTE_SENT", "QUOTE_READY"].includes(status)) {
      const accepted = await runAction(`/bookings/${bookingId}/accept-quote`, t("quoteAccepted", "Quote accepted. Proceed to checkout."));
      if (!accepted) return;
    }
    const state = { from: { label: t("pageTitle", "Booking Summary"), path: `/trevista/bookings/${bookingId}` } };
    if (typeof dispatchEvent === "function") {
      dispatchEvent("navigateToBookingCheckout", { bookingId, state });
      return;
    }
    navigate(`/trevista/bookings/${bookingId}/checkout`, { state });
  };

  const downloadQuote = () => {
    window.open(`/bookings/${bookingId}/downloads/quote`, "_blank");
  };

  const downloadInvoice = () => {
    window.open(`/bookings/${bookingId}/downloads/invoice`, "_blank");
  };

  const downloadBookingPass = () => {
    window.open(`/bookings/${bookingId}/downloads/voucher`, "_blank");
  };

  const fabActions = useMemo(() => [
    ...(canProceedToCheckout ? [{ label: t("proceedToCheckout", "Proceed to Checkout"), variant: "primary", iconRight: "arrowRight", onClick: proceedToCheckout, disabled: saving }] : []),
    ...(canEdit ? [{ label: saving ? t("saving", "Saving...") : t("updateBooking", "Update Booking"), variant: "outline", iconLeft: "save", onClick: handleSave, disabled: saving || !hasChanges }] : []),
    ...(hasQuote ? [{ label: t("downloadQuote", "Download Quote"), variant: "outline", iconLeft: "download", onClick: downloadQuote, disabled: saving }] : []),
    ...(hasPayment ? [{ label: t("downloadInvoice", "Download Invoice"), variant: "outline", iconLeft: "download", onClick: downloadInvoice, disabled: saving }] : []),
    ...(isConfirmedOrAfter ? [{ label: t("bookingPass", "Booking Pass"), variant: "outline", iconLeft: "download", onClick: downloadBookingPass, disabled: saving }] : []),
    ...(canCancel ? [{ label: t("cancelLabel", "Cancel Booking"), variant: "danger", iconLeft: "x", onClick: () => setShowCancel(true), disabled: saving }] : []),
    ...(pageLabels?.contactPhoneUrl || pageLabels?.supportPhone || process.env.REACT_APP_SUPPORT_PHONE ? [{ label: t("contactAgent", "Contact Agent"), variant: "outline", iconLeft: "phone", onClick: () => window.open(pageLabels?.contactPhoneUrl || `tel:${process.env.REACT_APP_SUPPORT_PHONE}`), overflowMobile: true }] : []),
  ], [canProceedToCheckout, canEdit, canCancel, saving, hasChanges, proceedToCheckout, handleSave, hasQuote, hasPayment, isConfirmedOrAfter, t, pageLabels]);

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
      if (!res || res.status !== "success") throw new Error(res?.message || t("actionFailed", "Action failed"));
      setBooking(res.componentData?.data);
      hydrateForm(res.componentData?.data);
      setMessage(successMessage);
      return true;
    } catch (err) {
      setError(err?.message || t("actionFailed", "Action failed"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <main className="booking-summary-page">
      <div className="booking-summary-page__loading">
        <Spinner size="lg" label={t("loadingText", "Loading booking details...")} />
      </div>
    </main>
  );

  if (error && !booking) {
    return (
      <main className="booking-summary-page">
        <section className="booking-summary-page__empty">
          <Icon name="alertTriangle" />
          <Title text={t("bookingLoadError", "Booking could not load")} />
          <Paragraph text={error} />
          <Button variant="outline" onClick={() => goToDashboard("bookings")}>{t("backToDashboard", "Back to dashboard")}</Button>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-summary-page">
      <div className="booking-summary-page__shell">
        <Breadcrumbs
          items={[
            { label: referrer.label || t("dashboard", "Dashboard"), path: referrer.path || "/dashboard" },
            { label: t("myBookings", "My Bookings"), path: referrer.path || "/dashboard" },
            { label: booking?.bookingRef || t("pageTitle", "Booking Summary") },
          ]}
        />

        <header className="booking-summary-hero">
          <div>
            <span className={`booking-summary-status ${statusClass(status)}`}>{statusLabel(status)}</span>
            <Title text={tour?.title || t("pageTitle", "Booking Summary")} />
            <Paragraph text={booking?.bookingRef} />
          </div>
          <div className="booking-summary-hero__actions">
            <Button variant="text" onClick={() => goToDashboard("bookings")}>
              {t("dashboard", "Dashboard")}
            </Button>
            {canCancel ? <Button variant="solid" color="danger" primaryClassName="is-danger" onClick={() => setShowCancel(true)}>{t("cancelBooking", "Cancel Booking")}</Button> : null}
          </div>
        </header>

        {booking?.assignedAgent ? (
          <div className="booking-summary-agent">
            <Icon name="user" size={16} />
            <span>
              {(t("assignedTo", "Assigned to {name}") || "Assigned to {name}").replace("{name}", booking.assignedAgent.name)}
              {booking.assignedAgent.email ? ` (${booking.assignedAgent.email})` : ""}
              {booking.quoteDueAt ? ` , ${(t("quoteDue", "Quote due: {date}") || "Quote due: {date}").replace("{date}", toDateInput(booking.quoteDueAt))}` : ""}
              {booking.responseDueAt ? ` , ${(t("responseDue", "Response due: {date}") || "Response due: {date}").replace("{date}", toDateInput(booking.responseDueAt))}` : ""}
            </span>
          </div>
        ) : null}

        {phaseIndex >= 0 ? (
          <div className="booking-summary-progress">
            {STATUS_PHASES.map((phase, i) => {
              const isComplete = i < phaseIndex;
              const isCurrent = i === phaseIndex && !["CANCELLED", "REFUNDED", "REFUND_PENDING", "CUSTOMER_REJECTED"].includes(status);
              const isCancelled = ["CANCELLED", "REFUNDED", "REFUND_PENDING"].includes(status);
              const isRejected = status === "CUSTOMER_REJECTED";
              return (
                <div key={phase.labelKey} className={`booking-summary-progress__step ${isComplete ? "is-complete" : ""} ${isCurrent ? "is-current" : ""} ${isCancelled && i === phaseIndex ? "is-cancelled" : ""} ${isRejected && i === phaseIndex ? "is-rejected" : ""}`}>
                  <div className="booking-summary-progress__dot" />
                  <span className="booking-summary-progress__label">{t(phase.labelKey, phase.labelKey)}</span>
                  {i < STATUS_PHASES.length - 1 ? <div className="booking-summary-progress__line" /> : null}
                </div>
              );
            })}
            {["CANCELLED", "REFUNDED", "REFUND_PENDING"].includes(status) ? (
              <div className="booking-summary-progress__step is-cancelled">
                <div className="booking-summary-progress__dot" />
                <span className="booking-summary-progress__label">{t("phaseCancelled", "Cancelled")}</span>
              </div>
            ) : null}
            {status === "CUSTOMER_REJECTED" ? (
              <div className="booking-summary-progress__step is-rejected">
                <div className="booking-summary-progress__dot" />
                <span className="booking-summary-progress__label">{t("phaseRejected", "Rejected")}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {message ? (
          <div className="booking-summary-alert is-success">
            <span>{message}</span>
            <button className="booking-summary-alert__close" onClick={() => setMessage("")} aria-label="Dismiss">&times;</button>
          </div>
        ) : null}
        {error ? (
          <div className="booking-summary-alert is-error">
            <span>{error}</span>
            <button className="booking-summary-alert__close" onClick={() => setError("")} aria-label="Dismiss">&times;</button>
          </div>
        ) : null}

        <section className="booking-summary-grid">
          <BookingJourneyCard
            booking={booking}
            onViewTour={viewTourUrl ? () => viewTour() : null}
            onDownloadQuote={hasQuote ? () => downloadQuote() : null}
            onDownloadInvoice={hasPayment ? () => downloadInvoice() : null}
            onDownloadBookingPass={isConfirmedOrAfter ? () => downloadBookingPass() : null}
          />

          <article className="booking-summary-card">
            <Title text={t("travelDetails", "Travel Details")} />
            <div className="booking-summary-form-grid">
              <label>{t("startDate", "Start Date")}<input type="date" value={form.startDate} disabled={!canEdit} onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))} /></label>
              <label>{t("endDate", "End Date")}<input type="date" value={form.endDate} disabled={!canEdit} onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))} /></label>
              <label>{t("contactName", "Contact Name")}<input value={form.contactName} disabled={!canEdit} onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))} /></label>
              <label>{t("contactEmail", "Contact Email")}<input value={form.contactEmail} disabled={!canEdit} onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))} /></label>
              <label>{t("contactPhone", "Contact Phone")}<input value={form.contactPhone} disabled={!canEdit} onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))} /></label>
              <label className="is-wide">{t("specialRequests", "Special Requests")}<textarea value={form.specialRequests} disabled={!canEdit} onChange={(event) => setForm((prev) => ({ ...prev, specialRequests: event.target.value }))} /></label>
            </div>
          </article>

          <article className="booking-summary-card">
            <header className="booking-summary-card__header">
              <Title text={t("travelers", "Travelers")} />
              {canEdit ? <Button variant="text" onClick={addTraveler}>{t("addTraveler", "Add Traveler")}</Button> : null}
            </header>
            <div className="booking-summary-travelers">
              {form.travelers.map((traveler, index) => (
                <section key={traveler.id || index} className="booking-summary-traveler">
                  <header>
                    <strong>{(t("travelerLabel", "Traveler {number}") || "Traveler {number}").replace("{number}", String(index + 1))}</strong>
                    {canEdit && form.travelers.length > 1 ? <Button variant="text" onClick={() => removeTraveler(index)}>{t("remove", "Remove")}</Button> : null}
                  </header>
                  <div className="booking-summary-form-grid">
                    <label>{t("firstName", "First Name")}<input value={traveler.firstName} disabled={!canEdit} onChange={(event) => updateTraveler(index, "firstName", event.target.value)} /></label>
                    <label>{t("lastName", "Last Name")}<input value={traveler.lastName} disabled={!canEdit} onChange={(event) => updateTraveler(index, "lastName", event.target.value)} /></label>
                    <label>{t("email", "Email")}<input value={traveler.email} disabled={!canEdit} onChange={(event) => updateTraveler(index, "email", event.target.value)} /></label>
                    <label>{t("phone", "Phone")}<input value={traveler.phone} disabled={!canEdit} onChange={(event) => updateTraveler(index, "phone", event.target.value)} /></label>
                    <label>{t("age", "Age")}<input value={traveler.age} disabled={!canEdit} onChange={(event) => updateTraveler(index, "age", event.target.value)} /></label>
                    <label>{t("nationality", "Nationality")}<input value={traveler.nationality} disabled={!canEdit} onChange={(event) => updateTraveler(index, "nationality", event.target.value)} /></label>
                    <label>{t("passport", "Passport / ID")}<input value={traveler.passportNumber} disabled={!canEdit} onChange={(event) => updateTraveler(index, "passportNumber", event.target.value)} /></label>
                    <label>{t("emergencyContact", "Emergency Contact")}<input value={traveler.emergencyContactName} disabled={!canEdit} onChange={(event) => updateTraveler(index, "emergencyContactName", event.target.value)} /></label>
                    <label>{t("emergencyPhone", "Emergency Phone")}<input value={traveler.emergencyContactNumber} disabled={!canEdit} onChange={(event) => updateTraveler(index, "emergencyContactNumber", event.target.value)} /></label>
                  </div>
                </section>
              ))}
            </div>
          </article>

        </section>

        <FloatingActionBar
          variant="floating"
          showBg
          mobileVisible={4}
          actions={fabActions}
          renderOverflow={(actions) => (
            <div className="booking-fab__contact">
              <Icon name="phone" size={18} />
              <div>
                <strong>{t("callOrMessage", "Call or message us")}</strong>
                {(pageLabels?.contactPhoneUrl || process.env.REACT_APP_SUPPORT_PHONE) ? (
                  <a href={pageLabels?.contactPhoneUrl || `tel:${process.env.REACT_APP_SUPPORT_PHONE}`}>{pageLabels?.supportPhone || process.env.REACT_APP_SUPPORT_PHONE}</a>
                ) : (
                  <span>Support not configured</span>
                )}
              </div>
            </div>
          )}
        />
      </div>

      <ConfirmOverlay
        open={showCancel}
        onClose={() => { setShowCancel(false); setCancelInfo(null); }}
        onConfirm={() => {
          setShowCancel(false);
          setCancelInfo(null);
          runAction(`/bookings/${bookingId}/cancel`, t("cancelledMessage", "Booking cancelled."), { reason: "Cancelled by customer" });
        }}
        title={t("cancelBooking", "Cancel Booking")}
        note={
          loadingCancelInfo
            ? t("cancelOverlayLoading", "Loading cancellation details...")
            : cancelInfo
              ? (t("cancelOverlayInfo", "Are you sure you want to cancel this booking?\n\nTotal Paid: {paid}\nEstimated Refund: {refund}\n\nCancellation Policy:\n{policy}") || "Are you sure...").replace("{paid}", formatCurrency(cancelInfo.paidAmount)).replace("{refund}", formatCurrency(cancelInfo.refundEstimate)).replace("{policy}", cancelInfo.cancellationPolicy || "")
              : t("cancelOverlayDefault", "This will cancel the booking request. You can still view it from your dashboard.")
        }
        icon="alertTriangle"
        confirmLabel={t("cancelBookingConfirm", "Cancel Booking")}
        cancelLabel={t("keepBooking", "Keep Booking")}
        confirmDisabled={saving || loadingCancelInfo}
      />

      {showDashboardPrompt ? (
        <div className="booking-summary-return" role="dialog" aria-modal="true">
          <div>
            <Icon name="checkCircle" />
            <Title text={t("bookingSubmitted", "Booking request submitted")} />
            <Paragraph text={t("submittedPrompt", "You can stay on this summary page to review details, or go to your dashboard. The dashboard View Booking action will bring you back here.")} />
            <div>
              <Button variant="text" onClick={() => goToDashboard("bookings")}>{t("goToDashboard", "Go to Dashboard")}</Button>
              <Button variant="text" onClick={() => setShowDashboardPrompt(false)}>{t("stayHere", "Stay Here")}</Button>
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
