import React, { useCallback, useEffect, useState } from "react";
import { fetchData } from "@packages/trem-utils";
import StatusBadge from "@packages/trem-ui/components/StatusBadge/StatusBadge.jsx";
import TimelineStepper from "@packages/trem-ui/components/TimelineStepper/TimelineStepper.jsx";
import QuoteDisplay from "@packages/trem-ui/components/QuoteDisplay/QuoteDisplay.jsx";
import Button from "@packages/trem-ui/components/Button/Button.jsx";
import MessageBubble from "@packages/trem-ui/components/MessageBubble/MessageBubble.jsx";
import "./BookingDetail.scss";

const formatMoney = (v, c = "INR") => {
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency: c }).format(Number(v || 0)); } catch { return `₹${Number(v || 0).toLocaleString()}`; }
};

const formatDate = (v) => {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const unwrap = (res) => res?.componentData?.data || res?.data || res || {};

export default function BookingDetail({ bookingId, onBack }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

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

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    setSendingMessage(true);
    try {
      await fetchData(`/engine/${bookingId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { content: messageInput.trim() },
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

  if (loading) return <div className="bd-loading">Loading booking details...</div>;
  if (error) return <div className="bd-error"><p>{error}</p><Button text="Go Back" onClick={onBack} variant="outline" /></div>;
  if (!booking) return <div className="bd-empty">Booking not found</div>;

  const tour = booking.tour || {};
  const product = booking.product || "trevista";
  const timeline = booking.timeline || [];
  const latestQuote = booking.latestQuote || booking.currentQuote;
  const payments = booking.payments || [];
  const timelineEntries = booking.timeline || [];

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
                  <span className="bd__activity-meta">{entry.actorType || "system"} · {formatDate(entry.createdAt)}</span>
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
