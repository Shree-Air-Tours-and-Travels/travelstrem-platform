// FILE: src/components/booking/BookingCard.jsx
import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";

/**
 * BookingCard
 * Props:
 * - booking: object returned by API (populated tour & user if available)
 * - role: "member" | "agent" | "admin"
 * - onCancel(bookingId)
 * - onConfirm(bookingId, finalPriceData)
 * - onUpdateTravelers(bookingId, travelers)
 * - onOpen(bookingId)
 */
export default function BookingCard({ booking, role, onCancel, onConfirm, onUpdateTravelers, onOpen }) {
  const id = booking.id || booking._id;
  const tour = booking.tour || {};
  const user = booking.user || {};
  const [editing, setEditing] = useState(false);
  const [localTravelers, setLocalTravelers] = useState(booking.travelers || []);
  const [confirming, setConfirming] = useState(false);
  const [finalAmount, setFinalAmount] = useState(booking.priceSnapshot?.total || 0);

  // derived
  const guests = booking.guestsCount || (booking.travelers && booking.travelers.length) || 1;
  const status = booking.status || "pending";

  function updateTravelerField(idx, field, value) {
    setLocalTravelers(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function handleSaveTravelers() {
    setEditing(false);
    if (onUpdateTravelers) onUpdateTravelers(localTravelers);
  }

  async function handleConfirm() {
    setConfirming(true);
    if (onConfirm) {
      // send simple final price object: { method: 'agent-set', providerId: 'agent', amountPaid, currency }
      const payload = { method: 'agent-set', providerId: 'agent', amountPaid: Number(finalAmount) || 0, currency: booking.priceSnapshot?.currency || 'INR' };
      await onConfirm(payload);
    }
    setConfirming(false);
  }

  return (
    <article className="bm-card card-shadow" style={{ padding: 12, borderRadius: 8 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong style={{ fontSize: 16 }}>{tour.title || "Untitled tour"}</strong>
          <div style={{ fontSize: 12, color: "#666" }}>{new Date(booking.startDate).toLocaleDateString()} → {new Date(booking.endDate).toLocaleDateString()}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14 }}>Status: <strong>{status}</strong></div>
          <div style={{ fontSize: 12 }}>{guests} guests</div>
        </div>
      </header>

      <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Contact:</strong> {user.name || booking.contactEmail || (booking.travelers && booking.travelers[0] && booking.travelers[0].email) || "—"}
          </div>

          <div style={{ marginBottom: 8 }}>
            <strong>Price snapshot:</strong> {booking.priceSnapshot?.perPerson} each · total {booking.priceSnapshot?.total} {booking.priceSnapshot?.currency}
          </div>

          <div>
            <strong>Travelers:</strong>
            {editing ? (
              <div style={{ marginTop: 8 }}>
                {localTravelers.map((t, i) => (
                  <div key={t._id || i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input value={t.firstName || ""} onChange={e => updateTravelerField(i, "firstName", e.target.value)} placeholder="First" />
                    <input value={t.lastName || ""} onChange={e => updateTravelerField(i, "lastName", e.target.value)} placeholder="Last" />
                    <input value={t.email || ""} onChange={e => updateTravelerField(i, "email", e.target.value)} placeholder="Email" />
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="bm-btn bm-btn-ghost" onClick={() => { setEditing(false); setLocalTravelers(booking.travelers || []); }}>Cancel</button>
                  <button className="bm-btn bm-btn-primary" onClick={handleSaveTravelers}>Save</button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 8 }}>
                {(booking.travelers || []).map((t, i) => (
                  <div key={t._id || i} style={{ fontSize: 13 }}>
                    {t.firstName} {t.lastName} {t.email ? `· ${t.email}` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside style={{ width: 220 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Snapshot total</strong>
            <div style={{ fontSize: 16 }}>{booking.priceSnapshot?.total} {booking.priceSnapshot?.currency}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="bm-btn bm-btn-outline" onClick={() => onOpen && onOpen(id)}>View</button>

            {role === "member" && status !== "cancelled" && (
              <>
                <button className="bm-btn" onClick={() => setEditing(true)}>Edit travelers</button>
                <button className="bm-btn bm-btn-ghost" onClick={() => onCancel && onCancel(id)}>Cancel booking</button>
              </>
            )}

            {(role === "admin" || role === "agent") && status !== "confirmed" && (
              <div style={{ marginTop: 6 }}>
                <div style={{ marginBottom: 6 }}>
                  <label>Final price (total)</label>
                  <input type="number" value={finalAmount} onChange={e => setFinalAmount(e.target.value)} />
                </div>
                <button className="bm-btn bm-btn-primary" onClick={handleConfirm} disabled={confirming}>{confirming ? "Confirming..." : "Confirm & Set Price"}</button>
              </div>
            )}

            {status === "confirmed" && (
              <div style={{ marginTop: 6 }}>
                <button className="bm-btn" onClick={() => alert("Pay Now (dummy) — integrate payment provider here")}>Pay now</button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

BookingCard.propTypes = {
  booking: PropTypes.object.isRequired,
  role: PropTypes.string,
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func,
  onUpdateTravelers: PropTypes.func,
  onOpen: PropTypes.func,
};
