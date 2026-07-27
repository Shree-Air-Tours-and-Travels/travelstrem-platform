import React, { useCallback, useEffect, useRef, useState } from "react";
import { fetchData } from "@packages/trem-utils";
import StatusBadge from "@packages/trem-ui/components/StatusBadge/StatusBadge.jsx";
import TimelineStepper from "@packages/trem-ui/components/TimelineStepper/TimelineStepper.jsx";
import QuoteDisplay from "@packages/trem-ui/components/QuoteDisplay/QuoteDisplay.jsx";
import Button from "@packages/trem-ui/components/Button/Button.jsx";
import MessageBubble from "@packages/trem-ui/components/MessageBubble/MessageBubble.jsx";
import { sanitizeInput, detectScriptInjection, detectPrivacyBreaches, auditLog_event } from "../../services/security";
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
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentPreview, setPaymentPreview] = useState("");
  const [paymentDragging, setPaymentDragging] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const paymentInputRef = useRef(null);

  const loadBooking = useCallback(async () => {
    try {
      const res = await fetchData(`/engine/${bookingId}/detail`);
      if (res?.status === "success") {
        setBooking(unwrap(res));
      } else {
        setError(res?.message || "Failed to load booking");
      }
      const msgRes = await fetchData(`/engine/${bookingId}/messages`);
      if (msgRes?.status === "success") {
        const data = unwrap(msgRes);
        setMessages((data?.messages || []).reverse());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { loadBooking(); }, [loadBooking]);

  useEffect(() => {
    if (!bookingId) return undefined;
    const refresh = () => {
      if (document.visibilityState === "visible") loadBooking();
    };
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [bookingId, loadBooking]);

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

  const handleSendMessage = async () => {
    const raw = messageInput.trim();
    if (!raw) return;

    if (detectScriptInjection(raw)) {
      auditLog_event("script_injection_blocked", { input: raw.slice(0, 100), bookingId });
      return;
    }

    const privacyBreaches = detectPrivacyBreaches(raw);
    if (privacyBreaches.length > 0) {
      auditLog_event("privacy_breach_detected", { bookingId, privacyBreaches, input: raw.slice(0, 100) });
    }

    const safeContent = sanitizeInput(raw);
    setSendingMessage(true);
    try {
      await fetchData(`/engine/${bookingId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { content: safeContent },
      });
      setMessageInput("");
      await loadBooking();
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
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
      setPaymentMessage("Your payment proof has been submitted and is awaiting admin verification.");
      setPaymentScreenshot(null);
      if (paymentInputRef.current) paymentInputRef.current.value = "";
      await loadBooking();
    } catch (err) {
      setPaymentMessage(err.message);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  if (loading) return <div className="bd-loading">Loading booking details...</div>;
  if (error) return <div className="bd-error"><p>{error}</p><Button text="Go Back" onClick={onBack} variant="outline" /></div>;
  if (!booking) return <div className="bd-empty">Booking not found</div>;

  const tour = booking.trip || booking.tour || {};
  const product = booking.product || "trevista";
  const timeline = booking.timeline || [];
  const latestQuote = booking.latestQuote || booking.currentQuote;
  const payments = booking.payments || [];
  const timelineEntries = booking.paymentTimeline || [];
  const paymentStatus = String(booking.paymentStatus || "TOKEN_PENDING").toUpperCase();
  const paymentMethods = (booking.paymentConfiguration?.methods || []).filter((method) => method.enabled !== false);
  const canSubmitProof = product === "trevio"
    && booking.status === "AWAITING_TOKEN_PAYMENT"
    && paymentStatus === "TOKEN_PENDING";

  return (
    <div className="bd">
      <div className="bd__nav">
        <button type="button" className="bd__back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back to Bookings
        </button>
      </div>

      <div className="bd__header">
        <div className="bd__header-left">
          <h1 className="bd__title">{tour?.title || "Booking"}</h1>
          <div className="bd__meta">
            <span className="bd__ref">{booking.bookingRef || "—"}</span>
            <span className="bd__product">{product === "trevio" ? "Trip" : "Tour"}</span>
            <StatusBadge value={booking.status} size="md" />
          </div>
        </div>
      </div>

      <div className="bd__grid">
        <div className="bd__main">
          <section className="bd__card">
            <h3 className="bd__card-title">Status Timeline</h3>
            <TimelineStepper steps={timeline} />
          </section>

          {product === "trevio" && (
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

          {latestQuote && ["QUOTE_SENT", "QUOTE_READY", "CUSTOMER_ACCEPTED", "PAYMENT_PENDING"].includes(booking.status) && (
            <section className="bd__card">
              <h3 className="bd__card-title">Latest Quote</h3>
              <QuoteDisplay
                quote={latestQuote}
                status={latestQuote.status}
                onAccept={handleAcceptQuote}
                onReject={handleRejectQuote}
                showActions={["QUOTE_SENT", "QUOTE_READY"].includes(booking.status)}
              />
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
        </div>

        <div className="bd__side">
          <section className="bd__card">
            <h3 className="bd__card-title">Trip Details</h3>
            <div className="bd__detail-list">
              <div className="bd__detail-row"><span>Dates</span><span>{formatDate(booking.travelWindow?.startDate)} → {formatDate(booking.travelWindow?.endDate)}</span></div>
              <div className="bd__detail-row"><span>Guests</span><span>{booking.guestsCount || 1}</span></div>
              <div className="bd__detail-row"><span>Total</span><span>{formatMoney(booking.paymentSummary?.total)}</span></div>
              <div className="bd__detail-row"><span>Paid</span><span>{formatMoney(booking.paymentSummary?.paid)}</span></div>
              {booking.paymentSummary?.remaining > 0 && (
                <div className="bd__detail-row bd__detail-row--remaining"><span>Remaining</span><span>{formatMoney(booking.paymentSummary?.remaining)}</span></div>
              )}
              {booking.assignedAgent && (
                <div className="bd__detail-row"><span>Agent</span><span>{booking.assignedAgent.name || "—"}</span></div>
              )}
            </div>
          </section>

          {product === "trevista" && (
            <section className="bd__card bd__card--messages">
              <h3 className="bd__card-title">Messages</h3>
              <div className="bd__msg-list">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg._id || msg.id}
                    content={msg.content}
                    senderName={msg.senderName}
                    senderType={msg.senderType}
                    messageType={msg.messageType}
                    timestamp={msg.createdAt}
                    isOwn={msg.senderType === "customer"}
                    metadata={msg.metadata}
                  />
                ))}
                {messages.length === 0 && <p className="bd__empty-text">No messages yet</p>}
              </div>
              <div className="bd__msg-input">
                <textarea
                  className="bd__msg-textarea"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  rows={1}
                  maxLength={2000}
                />
                <button
                  type="button"
                  className="bd__msg-send"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8l12-6-6 12v-6H2z" fill="currentColor" /></svg>
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
