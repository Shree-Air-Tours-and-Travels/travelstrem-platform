import React, { useState } from "react";
import Button from "../Button/Button.jsx";

const STATUS_LABEL = (s) => String(s || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const BookingCard = ({ booking, role, onCancel, onStatusTransition, onRecordPayment, onRefund, onGenerateQuote, onUpdateTravelers, onOpen }) => {
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

  const styles = {
    root: { padding: 12, borderRadius: 8, border: "1px solid var(--border, #e5e7eb)" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    headerLeft: {},
    headerRight: { textAlign: "right" },
    title: { fontSize: 16, fontWeight: 700, margin: 0 },
    subtitle: { fontSize: 12, color: "#666" },
    statusText: { fontSize: 14 },
    guestsText: { fontSize: 12, color: "#666" },
    body: { display: "flex", gap: 12 },
    main: { flex: 1 },
    aside: { width: 240, display: "flex", flexDirection: "column", gap: 6 },
    section: { marginBottom: 6 },
    label: { fontWeight: 700 },
    paymentRow: { marginBottom: 6, display: "flex", gap: 12, fontSize: 13 },
    paidText: { color: "#10b981" },
    refundedText: { color: "#ef4444" },
    travelers: { marginTop: 4 },
    travelerRow: { fontSize: 13 },
    noTravelers: { color: "#999", fontSize: 13 },
    editRow: { display: "flex", gap: 6, marginBottom: 6 },
    editInput: { width: 100 },
    editInputEmail: { width: 140 },
    editActions: { display: "flex", gap: 6 },
    quoteRow: { display: "flex", gap: 4 },
    quoteInput: { width: "100%", marginBottom: 4 },
    payRow: { display: "flex", gap: 4 },
    payInput: { width: "100%", marginBottom: 4 },
    refundRow: { display: "flex", gap: 4 },
    refundInput: { width: "100%", marginBottom: 4 },
  };

  return (
    <article className="bm-card" style={styles.root}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <strong style={styles.title}>{tour.title || "Untitled tour"}</strong>
          <div style={styles.subtitle}>
            {booking.startDate ? new Date(booking.startDate).toLocaleDateString() : ","} → {booking.endDate ? new Date(booking.endDate).toLocaleDateString() : ","}
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.statusText}>Status: <strong>{STATUS_LABEL(status)}</strong></div>
          <div style={styles.guestsText}>{guests} guests</div>
        </div>
      </header>

      <div style={styles.body}>
        <div style={styles.main}>
          <div style={styles.section}>
            <span style={styles.label}>Contact:</span> {user.name || booking.primaryContact?.name || booking.contactEmail || booking.travelers?.[0]?.email || ","}
          </div>
          <div style={styles.section}>
            <span style={styles.label}>Pricing:</span> {priceSnapshot?.perPerson ? `${priceSnapshot.perPerson} each` : ","} · total {priceSnapshot?.total || ","} {priceSnapshot?.currency || "INR"}
          </div>
          {paymentSummary ? (
            <div style={styles.paymentRow}>
              <span>Paid: <strong style={styles.paidText}>{paymentSummary.paid || 0}</strong></span>
              <span>Remaining: <strong>{paymentSummary.remaining || 0}</strong></span>
              {paymentSummary.refunded > 0 ? <span>Refunded: <strong style={styles.refundedText}>{paymentSummary.refunded}</strong></span> : null}
            </div>
          ) : null}

          <div>
            <strong>Travelers:</strong>
            {editing ? (
              <div style={{ marginTop: 6 }}>
                {(localTravelers?.length ? localTravelers : booking.travelers || []).map((t, i) => (
                  <div key={t._id || i} style={styles.editRow}>
                    <input value={t.firstName || ""} onChange={e => { const n = [...localTravelers]; n[i] = { ...n[i], firstName: e.target.value }; setLocalTravelers(n); }} placeholder="First" style={styles.editInput} />
                    <input value={t.lastName || ""} onChange={e => { const n = [...localTravelers]; n[i] = { ...n[i], lastName: e.target.value }; setLocalTravelers(n); }} placeholder="Last" style={styles.editInput} />
                    <input value={t.email || ""} onChange={e => { const n = [...localTravelers]; n[i] = { ...n[i], email: e.target.value }; setLocalTravelers(n); }} placeholder="Email" style={styles.editInputEmail} />
                  </div>
                ))}
                <div style={styles.editActions}>
                  <Button variant="outline" onClick={() => { setEditing(false); setLocalTravelers(booking.travelers || []); }} text="Cancel" />
                  <Button variant="solid" color="primary" onClick={() => { setEditing(false); onUpdateTravelers?.(localTravelers); }} text="Save" />
                </div>
              </div>
            ) : (
              <div style={styles.travelers}>
                {(booking.travelers || []).map((t, i) => (
                  <div key={t._id || i} style={styles.travelerRow}>{t.firstName} {t.lastName}{t.email ? ` · ${t.email}` : ""}</div>
                ))}
                {!booking.travelers?.length ? <span style={styles.noTravelers}>No travelers</span> : null}
              </div>
            )}
          </div>
        </div>

        <aside style={styles.aside}>
          <Button variant="outline" onClick={() => onOpen?.(id)} text="View Details" />

          {isAdmin && canGenerateQuote ? (
            <div>
              <input type="number" value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)} placeholder="Amount" style={styles.quoteInput} />
              <Button variant="solid" color="primary" disabled={actionLoading === "quote"} onClick={() => doAction("quote", () => onGenerateQuote?.(id, { finalAmount: Number(quoteAmount) || 0, currency: priceSnapshot?.currency || "INR" }))} text={actionLoading === "quote" ? "Sending..." : "Generate & Send Quote"} />
            </div>
          ) : null}

          {isAdmin && (statusActions[status] || []).map((sa) => (
            <Button key={sa.action} variant="solid" color="primary" disabled={actionLoading === sa.action} onClick={() => doAction(sa.action, () => onStatusTransition?.(id, sa.target))} text={actionLoading === sa.action ? "Processing..." : sa.label} />
          ))}

          {isAdmin && !isTerminal && remaining > 0 ? (
            showPayInput ? (
              <div>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Amount" style={styles.payInput} />
                <div style={styles.payRow}>
                  <Button variant="outline" onClick={() => setShowPayInput(false)} text="Cancel" />
                  <Button variant="solid" color="primary" disabled={actionLoading === "pay"} onClick={() => doAction("pay", () => onRecordPayment?.(id, Number(payAmount), priceSnapshot?.currency || "INR").then(() => setShowPayInput(false)))} text={actionLoading === "pay" ? "..." : "Record"} />
                </div>
              </div>
            ) : (
              <Button variant="solid" onClick={() => { setPayAmount(remaining); setShowPayInput(true); }} text="Record Payment" />
            )
          ) : null}

          {isAdmin && paid > 0 && !isTerminal ? (
            showRefundInput ? (
              <div>
                <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder="Refund amount" style={styles.refundInput} />
                <div style={styles.refundRow}>
                  <Button variant="outline" onClick={() => setShowRefundInput(false)} text="Cancel" />
                  <Button variant="solid" color="danger" disabled={actionLoading === "refund"} onClick={() => doAction("refund", () => onRefund?.(id, Number(refundAmount), priceSnapshot?.currency || "INR").then(() => setShowRefundInput(false)))} text={actionLoading === "refund" ? "..." : "Refund"} />
                </div>
              </div>
            ) : (
              <Button variant="solid" color="danger" onClick={() => setShowRefundInput(true)} text="Process Refund" />
            )
          ) : null}

          {!isTerminal ? (
            <Button variant="outline" disabled={actionLoading === "cancel"} onClick={() => doAction("cancel", () => onCancel?.(id))} text="Cancel Booking" />
          ) : null}
        </aside>
      </div>
    </article>
  );
};

export default BookingCard;
