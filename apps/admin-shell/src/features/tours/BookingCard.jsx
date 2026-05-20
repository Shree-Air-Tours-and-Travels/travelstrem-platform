import React, { useState } from "react";
import PropTypes from "prop-types";

const STATUS_LABEL = (s) => String(s || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export default function BookingCard({ booking, role, onCancel, onStatusTransition, onRecordPayment, onRefund, onGenerateQuote, onUpdateTravelers, onOpen }) {
  const id = booking.id || booking._id;
  const tour = booking.tour || {};
  const user = booking.user || {};
  const status = String(booking.status || "").toUpperCase();
  const guests = booking.guestsCount || booking.travelers?.length || 1;
  const { paymentSummary, priceSnapshot } = booking;

  const [editing, setEditing] = useState(false);
  const [localTravelers, setLocalTravelers] = useState(booking.travelers || []);
  const [actionLoading, setActionLoading] = useState(null);
  const [quoteAmount, setQuoteAmount] = useState(priceSnapshot?.total || 0);
  const [payAmount, setPayAmount] = useState(paymentSummary?.remaining || priceSnapshot?.total || 0);
  const [refundAmount, setRefundAmount] = useState(paymentSummary?.paid || 0);
  const [showPayInput, setShowPayInput] = useState(false);
  const [showRefundInput, setShowRefundInput] = useState(false);

  const isAdmin = role === "admin" || role === "agent";
  const isCancelled = status === "CANCELLED";
  const isTerminal = ["CANCELLED", "COMPLETED", "REFUNDED"].includes(status);
  const remaining = paymentSummary?.remaining || 0;
  const paid = paymentSummary?.paid || 0;

  const doAction = async (action, fn) => {
    setActionLoading(action);
    try { await fn(); } finally { setActionLoading(null); }
  };

  const statusActions = {
    PAID: [{ label: "Confirm Booking", action: "confirm", target: "CONFIRMED" }],
    CONFIRMED: [
      { label: "Start Ticketing", action: "ticketing", target: "TICKETING" },
      { label: "Mark Travel Ready", action: "travelReady", target: "TRAVEL_READY" },
    ],
    TICKETING: [{ label: "Mark Ticketed", action: "ticketed", target: "TICKETED" }],
    TICKETED: [
      { label: "Mark Travel Ready", action: "travelReady", target: "TRAVEL_READY" },
      { label: "Mark Complete", action: "complete", target: "COMPLETED" },
    ],
    TRAVEL_READY: [{ label: "Mark Complete", action: "complete", target: "COMPLETED" }],
  };

  const preQuoteStatuses = new Set(["DRAFT", "QUOTE_REQUESTED", "UNDER_REVIEW"]);
  const canGenerateQuote = isAdmin && preQuoteStatuses.has(status);

  return (
    <article className="bm-card" style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border, #e5e7eb)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <strong style={{ fontSize: 16 }}>{tour.title || "Untitled tour"}</strong>
          <div style={{ fontSize: 12, color: "#666" }}>
            {booking.startDate ? new Date(booking.startDate).toLocaleDateString() : "—"} → {booking.endDate ? new Date(booking.endDate).toLocaleDateString() : "—"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14 }}>Status: <strong>{STATUS_LABEL(status)}</strong></div>
          <div style={{ fontSize: 12, color: "#666" }}>{guests} guests</div>
        </div>
      </header>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 6 }}>
            <strong>Contact:</strong> {user.name || booking.primaryContact?.name || booking.contactEmail || booking.travelers?.[0]?.email || "—"}
          </div>
          <div style={{ marginBottom: 6 }}>
            <strong>Pricing:</strong> {priceSnapshot?.perPerson ? `${priceSnapshot.perPerson} each` : "—"} · total {priceSnapshot?.total || "—"} {priceSnapshot?.currency || "INR"}
          </div>
          {paymentSummary ? (
            <div style={{ marginBottom: 6, display: "flex", gap: 12, fontSize: 13 }}>
              <span>Paid: <strong style={{ color: "#10b981" }}>{paymentSummary.paid || 0}</strong></span>
              <span>Remaining: <strong>{paymentSummary.remaining || 0}</strong></span>
              {paymentSummary.refunded > 0 ? <span>Refunded: <strong style={{ color: "#ef4444" }}>{paymentSummary.refunded}</strong></span> : null}
            </div>
          ) : null}

          <div>
            <strong>Travelers:</strong>
            {editing ? (
              <div style={{ marginTop: 6 }}>
                {(localTravelers?.length ? localTravelers : booking.travelers || []).map((t, i) => (
                  <div key={t._id || i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input value={t.firstName || ""} onChange={e => { const n = [...localTravelers]; n[i] = { ...n[i], firstName: e.target.value }; setLocalTravelers(n); }} placeholder="First" style={{ width: 100 }} />
                    <input value={t.lastName || ""} onChange={e => { const n = [...localTravelers]; n[i] = { ...n[i], lastName: e.target.value }; setLocalTravelers(n); }} placeholder="Last" style={{ width: 100 }} />
                    <input value={t.email || ""} onChange={e => { const n = [...localTravelers]; n[i] = { ...n[i], email: e.target.value }; setLocalTravelers(n); }} placeholder="Email" style={{ width: 140 }} />
                  </div>
                ))}
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="bm-btn bm-btn-ghost" onClick={() => { setEditing(false); setLocalTravelers(booking.travelers || []); }}>Cancel</button>
                  <button className="bm-btn bm-btn-primary" onClick={() => { setEditing(false); onUpdateTravelers?.(localTravelers); }}>Save</button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 4 }}>
                {(booking.travelers || []).map((t, i) => (
                  <div key={t._id || i} style={{ fontSize: 13 }}>{t.firstName} {t.lastName}{t.email ? ` · ${t.email}` : ""}</div>
                ))}
                {!booking.travelers?.length ? <span style={{ color: "#999", fontSize: 13 }}>No travelers</span> : null}
              </div>
            )}
          </div>
        </div>

        <aside style={{ width: 240, display: "flex", flexDirection: "column", gap: 6 }}>
          <button className="bm-btn bm-btn-outline" onClick={() => onOpen?.(id)} style={{ width: "100%" }}>View Details</button>

          {isAdmin && canGenerateQuote ? (
            <div>
              <input type="number" value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)} placeholder="Amount" style={{ width: "100%", marginBottom: 4 }} />
              <button className="bm-btn bm-btn-primary" style={{ width: "100%" }} disabled={actionLoading === "quote"} onClick={() => doAction("quote", () => onGenerateQuote?.(id, { finalAmount: Number(quoteAmount) || 0, currency: priceSnapshot?.currency || "INR" }))}>
                {actionLoading === "quote" ? "Sending..." : "Generate & Send Quote"}
              </button>
            </div>
          ) : null}

          {isAdmin && (statusActions[status] || []).map((sa) => (
            <button key={sa.action} className="bm-btn bm-btn-primary" style={{ width: "100%" }} disabled={actionLoading === sa.action} onClick={() => doAction(sa.action, () => onStatusTransition?.(id, sa.target))}>
              {actionLoading === sa.action ? "Processing..." : sa.label}
            </button>
          ))}

          {isAdmin && !isTerminal && remaining > 0 ? (
            showPayInput ? (
              <div>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Amount" style={{ width: "100%", marginBottom: 4 }} />
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="bm-btn bm-btn-ghost" style={{ flex: 1 }} onClick={() => setShowPayInput(false)}>Cancel</button>
                  <button className="bm-btn bm-btn-primary" style={{ flex: 1 }} disabled={actionLoading === "pay"} onClick={() => doAction("pay", () => onRecordPayment?.(id, Number(payAmount), priceSnapshot?.currency || "INR").then(() => setShowPayInput(false)))}>
                    {actionLoading === "pay" ? "..." : "Record"}
                  </button>
                </div>
              </div>
            ) : (
              <button className="bm-btn" style={{ width: "100%" }} onClick={() => { setPayAmount(remaining); setShowPayInput(true); }}>Record Payment</button>
            )
          ) : null}

          {isAdmin && paid > 0 && !isTerminal ? (
            showRefundInput ? (
              <div>
                <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder="Refund amount" style={{ width: "100%", marginBottom: 4 }} />
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="bm-btn bm-btn-ghost" style={{ flex: 1 }} onClick={() => setShowRefundInput(false)}>Cancel</button>
                  <button className="bm-btn bm-btn-danger" style={{ flex: 1 }} disabled={actionLoading === "refund"} onClick={() => doAction("refund", () => onRefund?.(id, Number(refundAmount), priceSnapshot?.currency || "INR").then(() => setShowRefundInput(false)))}>
                    {actionLoading === "refund" ? "..." : "Refund"}
                  </button>
                </div>
              </div>
            ) : (
              <button className="bm-btn bm-btn-danger" style={{ width: "100%" }} onClick={() => setShowRefundInput(true)}>Process Refund</button>
            )
          ) : null}

          {!isTerminal ? (
            <button className="bm-btn bm-btn-ghost" style={{ width: "100%" }} disabled={actionLoading === "cancel"} onClick={() => doAction("cancel", () => onCancel?.(id))}>
              Cancel Booking
            </button>
          ) : null}
        </aside>
      </div>
    </article>
  );
}

BookingCard.propTypes = {
  booking: PropTypes.object.isRequired,
  role: PropTypes.string,
  onCancel: PropTypes.func,
  onStatusTransition: PropTypes.func,
  onRecordPayment: PropTypes.func,
  onRefund: PropTypes.func,
  onGenerateQuote: PropTypes.func,
  onUpdateTravelers: PropTypes.func,
  onOpen: PropTypes.func,
};
