import React, { useCallback, useEffect, useRef, useState } from "react";
import { fetchData } from "@packages/trem-utils";
import StatusBadge from "@packages/trem-ui/components/StatusBadge/StatusBadge.jsx";
import TimelineStepper from "@packages/trem-ui/components/TimelineStepper/TimelineStepper.jsx";
import QuoteDisplay from "@packages/trem-ui/components/QuoteDisplay/QuoteDisplay.jsx";
import Button from "@packages/trem-ui/components/Button/Button.jsx";
import Spinner from "@packages/trem-ui/components/Spinner/Spinner.jsx";
import api from "../../services/apiClient";
import "./BookingDetail.scss";

const formatMoney = (v, c = "INR") => {
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency: c }).format(Number(v || 0)); } catch { return `₹${Number(v || 0).toLocaleString()}`; }
};

const formatDate = (v) => {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const formatDateTime = (v) => {
  if (!v) return "—";
  return new Date(v).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
};

const unwrap = (res) => res?.componentData?.data || res?.data || res || {};

export default function BookingDetail({ bookingId, onBack }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentPreview, setPaymentPreview] = useState("");
  const [paymentDragging, setPaymentDragging] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [bookingAction, setBookingAction] = useState({ loading: "", message: "" });
  const [travellerForm, setTravellerForm] = useState({ firstName: "", lastName: "", age: "", nationality: "", passportNumber: "" });
  const [travellerSubmitting, setTravellerSubmitting] = useState(false);
  const [travellerMessage, setTravellerMessage] = useState("");
  const [changeRequestOpen, setChangeRequestOpen] = useState(false);
  const [changeRequestForm, setChangeRequestForm] = useState({ guestCountChange: 0, withFlights: null, notes: "" });
  const [changeRequestSubmitting, setChangeRequestSubmitting] = useState(false);
  const [changeRequestMessage, setChangeRequestMessage] = useState("");
  const paymentInputRef = useRef(null);

  const loadBooking = useCallback(async () => {
    try {
      const res = await fetchData(`/engine/${bookingId}/detail`);
      if (res?.status === "success") {
        setBooking(unwrap(res));
      } else {
        setError(res?.message || "Failed to load booking");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { loadBooking(); }, [loadBooking]);


  useEffect(() => {
    if (!paymentScreenshot) {
      setPaymentPreview("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(paymentScreenshot);
    setPaymentPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [paymentScreenshot]);

  const choosePaymentScreenshot = (file) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setPaymentMessage("Please upload a PNG, JPG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPaymentMessage("The screenshot must be smaller than 10 MB.");
      return;
    }
    setPaymentMessage("");
    setPaymentScreenshot(file);
  };

  const handleAcceptQuote = async () => {
    try {
      await fetchData(`/engine/${bookingId}/quote/accept`, { method: "POST", headers: { "Content-Type": "application/json" } });
      await loadBooking();
    } catch (err) { console.error(err); }
  };

  const handleRejectQuote = async () => {
    try {
      await fetchData(`/engine/${bookingId}/quote/reject`, { method: "POST", headers: { "Content-Type": "application/json" } });
      await loadBooking();
    } catch (err) { console.error(err); }
  };

  const handleAddTravellers = async () => {
    if (!travellerForm.firstName.trim() || !travellerForm.age) {
      setTravellerMessage("First name and age are required.");
      return;
    }
    setTravellerSubmitting(true);
    setTravellerMessage("");
    try {
      const existing = (booking.travellers || []).map((t) => ({
        firstName: t.firstName,
        lastName: t.lastName || "",
        age: t.age,
        gender: t.gender || "",
        nationality: t.nationality || "",
        passportNumber: t.passportNumber || "",
      }));
      const updated = [...existing, {
        firstName: travellerForm.firstName.trim(),
        lastName: travellerForm.lastName.trim(),
        age: Number(travellerForm.age),
        nationality: travellerForm.nationality.trim(),
        passportNumber: travellerForm.passportNumber.trim(),
      }];
      const res = await fetchData(`/engine/${bookingId}/travellers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: { travellers: updated },
      });
      if (res?.status === "error") {
        setTravellerMessage(res?.message || "Failed to add traveller.");
        return;
      }
      setTravellerForm({ firstName: "", lastName: "", age: "", nationality: "", passportNumber: "" });
      setTravellerMessage("Traveller added.");
      await loadBooking();
    } catch (err) {
      setTravellerMessage(err.message || "Failed to add traveller.");
    } finally {
      setTravellerSubmitting(false);
    }
  };

  const handleSubmitChangeRequest = async () => {
    setChangeRequestSubmitting(true);
    setChangeRequestMessage("");
    try {
      const res = await fetchData(`/engine/${bookingId}/quote/request-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: changeRequestForm,
      });
      if (res?.status === "error") {
        setChangeRequestMessage(res?.message || "Failed to submit request.");
        return;
      }
      setChangeRequestOpen(false);
      setChangeRequestForm({ guestCountChange: 0, withFlights: null, notes: "" });
      setChangeRequestMessage("Change request submitted.");
      await loadBooking();
    } catch (err) {
      setChangeRequestMessage(err.message || "Failed to submit request.");
    } finally {
      setChangeRequestSubmitting(false);
    }
  };

  const handleDownloadQuote = async () => {
    setBookingAction({ loading: "download", message: "" });
    try {
      const urlResponse = await api.get(`/bookings/${bookingId}/downloads/quote-url`);
      if (urlResponse?.data?.status === "success" && urlResponse?.data?.data?.url) {
        const { url, fileName } = urlResponse.data.data;
        const link = document.createElement("a");
        link.href = url;
        link.download = booking?.quoteDocument?.filename || fileName || `quote-${booking?.bookingRef || bookingId}.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setBookingAction({ loading: "", message: "Quote PDF downloaded." });
        return;
      }
      const response = await api.get(`/bookings/${bookingId}/downloads/quote`, { responseType: "blob" });
      const objectUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = booking?.quoteDocument?.filename || `quote-${booking?.bookingRef || bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setBookingAction({ loading: "", message: "Quote PDF downloaded." });
    } catch (err) {
      setBookingAction({ loading: "", message: err?.response?.data?.message || "Could not download the quote PDF." });
    }
  };

  const handleCancelBooking = async () => {
    setBookingAction({ loading: "cancel", message: "" });
    try {
      const response = await fetchData(`/engine/${bookingId}/cancel`, { method: "POST", body: { reason: "Cancelled by customer" } });
      if (response?.status !== "success") throw new Error(response?.message || "Unable to cancel booking");
      setBookingAction({ loading: "", message: "Booking cancelled." });
      await loadBooking();
    } catch (err) {
      setBookingAction({ loading: "", message: err?.message || "Unable to cancel booking." });
    }
  };

  const handlePaymentProof = async (event) => {
    event.preventDefault();
    if (!paymentScreenshot) {
      setPaymentMessage("Choose your payment screenshot first.");
      return;
    }
    const body = new FormData();
    body.append("paymentScreenshot", paymentScreenshot);
    setPaymentSubmitting(true);
    setPaymentMessage("");
    try {
      const response = await fetchData(`/engine/${bookingId}/payments/token-proof`, { method: "POST", body });
      if (response?.status !== "success") throw new Error(response?.message || "Unable to submit payment proof");
      setPaymentScreenshot(null);
      if (paymentInputRef.current) paymentInputRef.current.value = "";
      await loadBooking();
    } catch (err) {
      setPaymentMessage(err.message);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  if (loading) return <div className="bd__loading"><Spinner direction="column" label="Loading booking details..." /></div>;
  if (error) return <div className="bd-error"><p>{error}</p><Button text="Go Back" onClick={onBack} variant="outline" /></div>;
  if (!booking) return <div className="bd-empty">Booking not found</div>;

  const tour = booking.trip || booking.tour || {};
  const product = booking.product || "trevista";
  const timeline = booking.timeline || [];
  const latestQuote = booking.latestQuote || booking.currentQuote;
  const payments = booking.payments || [];
  const timelineEntries = booking.paymentTimeline || [];
  const paymentStatus = String(booking.paymentStatus || "UNPAID").toUpperCase();
  const paymentMethods = (booking.paymentConfiguration?.methods || []).filter((method) => method.enabled !== false);
  const canSubmitProof = product === "trevio"
    && booking.status === "AWAITING_TOKEN_PAYMENT"
    && paymentStatus === "TOKEN_PENDING";
  const showTrevioPayment = product === "trevio" && [
    "AWAITING_TOKEN_PAYMENT", "PAYMENT_PENDING", "PARTIALLY_PAID", "PAID",
    "CONFIRMED", "TICKETING", "TICKETED", "TRAVEL_READY", "COMPLETED",
  ].includes(String(booking.status || "").toUpperCase());
  const awaitingQuote = Boolean(booking.enquiryRef || booking.contactLead) && !latestQuote;
  const displayTitle = tour?.title || booking.tripSelection?.packageId || (booking.enquiryRef ? "Travel enquiry" : "Booking");
  const travelDates = booking.isTravelDateFlexible
    ? "Flexible dates"
    : `${formatDate(booking.travelWindow?.startDate)} → ${formatDate(booking.travelWindow?.endDate)}`;

  return (
    <>
          <nav className="bd__breadcrumbs" aria-label="Booking breadcrumb">
        <button type="button" className="bd__back" onClick={onBack}>
          <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Bookings
        </button>
        <span aria-hidden="true">/</span>
        <span className="bd__breadcrumb-current">{displayTitle}</span>
      </nav>
          <div className="bd">


      <div className="bd__shell">
        <div className="bd__header">
          <div className="bd__header-left">
            <span className="bd__eyebrow">Booking summary</span>
            <h1 className="bd__title">{displayTitle}</h1>
            <div className="bd__meta">
              <span className="bd__ref">{booking.bookingRef || "—"}</span>
              <span className="bd__product">{product === "trevio" ? "Trevio trip" : "Custom tour"}</span>
              <StatusBadge value={booking.status} size="md" />
            </div>
          </div>
        </div>

        <section className="bd__card bd__journey-card">
            <h3 className="bd__card-title">Booking progress</h3>
            <TimelineStepper steps={timeline} />
        </section>

        <div className="bd__grid">
          <div className="bd__main">
          {awaitingQuote && (
            <section className="bd__card bd__quote-waiting">
              <span className="bd__quote-waiting-icon" aria-hidden="true">✓</span>
              <div>
                <h2>Enquiry sent to the organiser</h2>
                <p>No price or payment is due yet. The organiser must create and send the final quote before you can review or accept it.</p>
              </div>
            </section>
          )}

          {["CUSTOMER_ACCEPTED", "PAYMENT_PENDING"].includes(String(booking.status || "").toUpperCase()) && (() => {
            const guestCount = booking.guestsCount || 1;
            const travellerCount = (booking.travellers || []).length;
            const atCapacity = travellerCount >= guestCount;
            return (
            <section className="bd__card bd__travellers-card">
              <h3 className="bd__card-title">Traveller Details</h3>
              <p className="bd__traveller-count">{travellerCount} of {guestCount} travellers added</p>
              {booking.travellers && booking.travellers.length > 0 && (
                <div className="bd__traveller-list">
                  {booking.travellers.map((t, i) => (
                    <div key={t.id || i} className="bd__traveller-item">
                      <strong>{t.firstName}{t.lastName ? ` ${t.lastName}` : ""}</strong>
                      <div className="bd__traveller-meta">
                        {t.age ? <span>Age {t.age}</span> : null}
                        {t.nationality ? <span>{t.nationality}</span> : null}
                        {t.passportNumber ? <span>Passport: {t.passportNumber}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {atCapacity ? (
                <p className="bd__traveller-done">All traveller details have been added.</p>
              ) : (
                <>
                  <p className="bd__traveller-hint">Add each traveller's details below. Name and age are required.</p>
                  <div className="bd__traveller-form">
                    <div className="bd__traveller-row">
                      <input type="text" placeholder="First name *" value={travellerForm.firstName} onChange={(e) => setTravellerForm((f) => ({ ...f, firstName: e.target.value }))} className="bd__traveller-input" />
                      <input type="text" placeholder="Last name" value={travellerForm.lastName} onChange={(e) => setTravellerForm((f) => ({ ...f, lastName: e.target.value }))} className="bd__traveller-input" />
                    </div>
                    <div className="bd__traveller-row">
                      <input type="number" placeholder="Age *" min="0" max="120" value={travellerForm.age} onChange={(e) => setTravellerForm((f) => ({ ...f, age: e.target.value }))} className="bd__traveller-input bd__traveller-input--sm" />
                      <input type="text" placeholder="Nationality" value={travellerForm.nationality} onChange={(e) => setTravellerForm((f) => ({ ...f, nationality: e.target.value }))} className="bd__traveller-input" />
                    </div>
                    <div className="bd__traveller-row">
                      <input type="text" placeholder="Passport / ID number" value={travellerForm.passportNumber} onChange={(e) => setTravellerForm((f) => ({ ...f, passportNumber: e.target.value }))} className="bd__traveller-input" />
                    </div>
                    <button type="button" className="bd__traveller-add-btn" onClick={handleAddTravellers} disabled={travellerSubmitting}>
                      {travellerSubmitting ? "Adding..." : "Add traveller"}
                    </button>
                    {travellerMessage && <p className="bd__traveller-message" role="status">{travellerMessage}</p>}
                  </div>
                </>
              )}
            </section>
            );
          })()}

          {showTrevioPayment && (
            <section className="bd__card bd__payment-workflow">
              <h3 className="bd__card-title">Offline Payment</h3>
              <div className="bd__detail-list">
                <div className="bd__detail-row"><span>Booking status</span><strong>{String(booking.status || "").replace(/_/g, " ")}</strong></div>
                <div className="bd__detail-row"><span>Payment status</span><strong>{paymentStatus.replace(/_/g, " ")}</strong></div>
                <div className="bd__detail-row"><span>Token amount</span><strong>{formatMoney(booking.tokenAmount, booking.priceSnapshot?.currency)}</strong></div>
                <div className="bd__detail-row"><span>Remaining amount</span><strong>{formatMoney(booking.remainingAmount ?? booking.paymentSummary?.remaining, booking.priceSnapshot?.currency)}</strong></div>
              </div>

              {booking.paymentRejectionReason && (
                <p className="bd__payment-alert bd__payment-alert--error">Payment verification failed: {booking.paymentRejectionReason}</p>
              )}
              {paymentStatus === "TOKEN_VERIFICATION" && (
                <p className="bd__payment-alert">Your payment proof has been submitted and is awaiting admin verification.</p>
              )}

              {canSubmitProof && (
                <>
                  <div className="bd__payment-methods">
                    {paymentMethods.map((method) => (
                      <div key={method.code} className="bd__payment-method">
                        <strong>{method.label}</strong>
                        {method.qrImage && <img src={method.qrImage} alt={`${method.label} QR code`} />}
                        {method.upiId && <span>UPI: {method.upiId}</span>}
                        {method.accountHolder && <span>Account holder: {method.accountHolder}</span>}
                        {method.bankAccount && <span>Account: {method.bankAccount}</span>}
                        {method.bankName && <span>Bank: {method.bankName}</span>}
                        {method.ifsc && <span>IFSC: {method.ifsc}</span>}
                        {method.instructions && <p>{method.instructions}</p>}
                      </div>
                    ))}
                    {booking.paymentConfiguration?.instructions && <p>{booking.paymentConfiguration.instructions}</p>}
                  </div>
                  <form className="bd__payment-form" onSubmit={handlePaymentProof}>
                    <div className="bd__proof-heading">
                      <div>
                        <strong>Upload payment screenshot</strong>
                        <span>That’s all we need—no transaction ID or form to fill.</span>
                      </div>
                      <span className="bd__proof-step">1 step</span>
                    </div>
                    <input
                      ref={paymentInputRef}
                      className="bd__proof-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => choosePaymentScreenshot(event.target.files?.[0])}
                    />
                    <button
                      type="button"
                      className={`bd__proof-dropzone ${paymentDragging ? "is-dragging" : ""} ${paymentScreenshot ? "has-file" : ""}`}
                      onClick={() => paymentInputRef.current?.click()}
                      onDragEnter={(event) => { event.preventDefault(); setPaymentDragging(true); }}
                      onDragOver={(event) => event.preventDefault()}
                      onDragLeave={(event) => { event.preventDefault(); setPaymentDragging(false); }}
                      onDrop={(event) => {
                        event.preventDefault();
                        setPaymentDragging(false);
                        choosePaymentScreenshot(event.dataTransfer.files?.[0]);
                      }}
                    >
                      {paymentScreenshot ? (
                        <>
                          <img src={paymentPreview} alt="Selected payment screenshot preview" />
                          <span className="bd__proof-file">
                            <strong>{paymentScreenshot.name}</strong>
                            <small>{(paymentScreenshot.size / (1024 * 1024)).toFixed(2)} MB · Click to replace</small>
                          </span>
                          <span className="bd__proof-ready" aria-label="Ready to upload">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="m4.25 9.1 3 3 6.5-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="bd__proof-upload-icon" aria-hidden="true">
                            <svg width="25" height="25" viewBox="0 0 24 24" fill="none"><path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v3A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </span>
                          <span><strong>Choose screenshot</strong><small>or drag and drop it here</small></span>
                          <small>PNG, JPG or WebP · up to 10 MB</small>
                        </>
                      )}
                    </button>
                    {paymentScreenshot && (
                      <button type="button" className="bd__proof-remove" onClick={() => {
                        setPaymentScreenshot(null);
                        if (paymentInputRef.current) paymentInputRef.current.value = "";
                      }}>
                        Remove screenshot
                      </button>
                    )}
                    <button type="submit" className="bd__proof-submit" disabled={paymentSubmitting || !paymentScreenshot}>
                      {paymentSubmitting ? "Uploading proof..." : (booking.paymentRejectionReason ? "Upload new proof" : "Submit payment proof")}
                    </button>
                  </form>
                </>
              )}
              {paymentMessage && <p className="bd__payment-alert">{paymentMessage}</p>}
            </section>
          )}

          {latestQuote && (
            <section className="bd__card">
              <h3 className="bd__card-title">Latest Quote</h3>
              <QuoteDisplay
                quote={latestQuote}
                status={latestQuote.status}
                onAccept={handleAcceptQuote}
                onReject={handleRejectQuote}
                onRequestChanges={() => setChangeRequestOpen(true)}
                showActions={["QUOTE_SENT", "QUOTE_READY", "CUSTOMER_REJECTED"].includes(booking.status)}
              />
              {latestQuote.changeRequest && latestQuote.changeRequest.requestedAt && (
                <div className="bd__change-request">
                  <strong>Change Request</strong>
                  {latestQuote.changeRequest.guestCountChange !== 0 && <span>Guest count: {latestQuote.changeRequest.guestCountChange > 0 ? `+${latestQuote.changeRequest.guestCountChange}` : latestQuote.changeRequest.guestCountChange}</span>}
                  {latestQuote.changeRequest.withFlights !== null && <span>Flights: {latestQuote.changeRequest.withFlights ? "Include" : "Exclude"}</span>}
                  {latestQuote.changeRequest.notes && <span>{latestQuote.changeRequest.notes}</span>}
                </div>
              )}
              {booking.quoteDocument?.available ? <div className="bd__quote-actions">
                <Button
                  variant="outline"
                  text={bookingAction.loading === "download" ? "Preparing PDF..." : "Download quote PDF"}
                  disabled={Boolean(bookingAction.loading)}
                  onClick={handleDownloadQuote}
                />
              </div> : null}
            </section>
          )}

          {payments.length > 0 && (
            <section className="bd__card">
              <h3 className="bd__card-title">Payment History</h3>
              <div className="bd__payments">
                {payments.map((p, i) => (
                  <div key={p._id || i} className="bd__payment-row">
                    <div>
                      <span className="bd__payment-type">{p.type || "Payment"}</span>
                      <span className="bd__payment-provider">{p.provider || "—"}</span>
                    </div>
                    <div className="bd__payment-amount">{formatMoney(p.amount, p.currency)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="bd__card">
            <h3 className="bd__card-title">Activity Timeline</h3>
            <div className="bd__activity">
              {timelineEntries.map((entry, i) => (
                <div key={entry._id || i} className="bd__activity-item">
                  <span className="bd__activity-action">{(entry.action || "").replace(/_/g, " ")}</span>
                  <span className="bd__activity-meta">{entry.actorType || "system"} · {formatDateTime(entry.createdAt)}</span>
                  {entry.metadata?.preview && <span className="bd__activity-preview">{entry.metadata.preview}</span>}
                </div>
              ))}
              {timelineEntries.length === 0 && <p className="bd__empty-text">No activity yet</p>}
            </div>
          </section>

          {!['CANCELLED', 'COMPLETED', 'REFUNDED'].includes(String(booking.status || '').toUpperCase()) && (
            <section className="bd__card bd__card--danger">
              <h3 className="bd__card-title">Booking actions</h3>
              <p>You can cancel this enquiry or booking before it is completed.</p>
              <Button
                variant="outline"
                color="danger"
                text={bookingAction.loading === "cancel" ? "Cancelling..." : "Cancel booking"}
                disabled={Boolean(bookingAction.loading)}
                onClick={handleCancelBooking}
              />
              {bookingAction.message && <p className="bd__action-message" role="status">{bookingAction.message}</p>}
            </section>
          )}
          </div>

          <div className="bd__side">
          <section className="bd__card">
            <h3 className="bd__card-title">Trip Details</h3>
            <div className="bd__detail-list">
              <div className="bd__detail-row"><span>Dates</span><span>{travelDates}</span></div>
              <div className="bd__detail-row"><span>Guests</span><span>{booking.guestsCount || 1}</span></div>
              {awaitingQuote ? (
                <div className="bd__detail-row"><span>Total</span><span>Awaiting organiser quote</span></div>
              ) : (
                <>
                  {Number(latestQuote?.amountPayableNow || 0) > 0 && (
                    <div className="bd__detail-row bd__detail-row--highlight"><span>Amount Due Now</span><span>{formatMoney(latestQuote.amountPayableNow, booking.priceSnapshot?.currency)}</span></div>
                  )}
                  <div className="bd__detail-row"><span>Total</span><span>{formatMoney(booking.paymentSummary?.total, booking.priceSnapshot?.currency)}</span></div>
                  <div className="bd__detail-row"><span>Paid</span><span>{formatMoney(booking.paymentSummary?.paid, booking.priceSnapshot?.currency)}</span></div>
                  {booking.paymentSummary?.remaining > 0 && (
                    <div className="bd__detail-row bd__detail-row--remaining"><span>Remaining</span><span>{formatMoney(booking.paymentSummary?.remaining, booking.priceSnapshot?.currency)}</span></div>
                  )}
                </>
              )}
              {booking.assignedAgent && (
                <div className="bd__detail-row"><span>Agent</span><span>{booking.assignedAgent.name || "—"}</span></div>
              )}
            </div>
          </section>

          </div>
        </div>
      </div>
    </div>

    {changeRequestOpen && (
      <div className="bd__modal-overlay" onClick={() => setChangeRequestOpen(false)}>
        <div className="bd__modal" onClick={(e) => e.stopPropagation()}>
          <h3>Request Quote Changes</h3>
          <p className="bd__modal-desc">Tell us what you'd like to change. The organiser will revise the quote and send it back.</p>
          <div className="bd__change-form">
            <label className="bd__change-label">
              <span>Guest count change</span>
              <div className="bd__change-stepper">
                <button type="button" onClick={() => setChangeRequestForm((f) => ({ ...f, guestCountChange: f.guestCountChange - 1 }))}>−</button>
                <span>{changeRequestForm.guestCountChange > 0 ? `+${changeRequestForm.guestCountChange}` : changeRequestForm.guestCountChange}</span>
                <button type="button" onClick={() => setChangeRequestForm((f) => ({ ...f, guestCountChange: f.guestCountChange + 1 }))}>+</button>
              </div>
            </label>
            {!(latestQuote?.flightPrice > 0) && (
            <label className="bd__change-label">
              <span>Flights</span>
              <div className="bd__change-toggle">
                <button type="button" className={!changeRequestForm.withFlights ? "is-active" : ""} onClick={() => setChangeRequestForm((f) => ({ ...f, withFlights: false }))}>Without flights</button>
                <button type="button" className={changeRequestForm.withFlights === true ? "is-active" : ""} onClick={() => setChangeRequestForm((f) => ({ ...f, withFlights: true }))}>With flights</button>
              </div>
            </label>
            )}
            <label className="bd__change-label">
              <span>Additional notes</span>
              <textarea className="bd__change-notes" rows={3} placeholder="Any other changes you'd like..." value={changeRequestForm.notes} onChange={(e) => setChangeRequestForm((f) => ({ ...f, notes: e.target.value }))} />
            </label>
          </div>
          {changeRequestMessage && <p className="bd__change-message" role="status">{changeRequestMessage}</p>}
          <div className="bd__modal-actions">
            <button type="button" className="bd__modal-cancel" onClick={() => setChangeRequestOpen(false)}>Cancel</button>
            <button type="button" className="bd__modal-submit" onClick={handleSubmitChangeRequest} disabled={changeRequestSubmitting}>
              {changeRequestSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>

  );
}
