import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchData } from "@packages/trem-utils";
import { Button, Title, Paragraph } from "@packages/trem-ui";
import "./BookingDetail.scss";

const STATUS_PHASES = [
  { statuses: ["DRAFT", "QUOTE_REQUESTED"], label: "Request" },
  { statuses: ["UNDER_REVIEW", "QUOTE_READY", "QUOTE_SENT"], label: "Quote" },
  { statuses: ["CUSTOMER_ACCEPTED", "CUSTOMER_REJECTED"], label: "Decision" },
  { statuses: ["PAYMENT_PENDING", "PARTIALLY_PAID", "PAID"], label: "Payment" },
  { statuses: ["CONFIRMED", "TICKETING", "TICKETED", "TRAVEL_READY"], label: "Confirmed" },
  { statuses: ["COMPLETED"], label: "Completed" },
];

const statusLabel = (s) => String(s || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const toDateInput = (v) => {
  if (!v) return ",";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "," : d.toLocaleDateString("en-IN", { dateStyle: "long" });
};

const formatCurrency = (v, c = "INR") => {
  const n = Number(v || 0);
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency: c, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n); }
  catch { return `${c} ${n.toLocaleString("en-IN")}`; }
};

const getPhaseIndex = (status) => {
  const s = String(status || "").toUpperCase();
  for (let i = 0; i < STATUS_PHASES.length; i++) {
    if (STATUS_PHASES[i].statuses.includes(s)) return i;
  }
  return -1;
};

export default function BookingDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) return;
    let active = true;
    setLoading(true);

    Promise.all([
      fetchData(`/bookings/${bookingId}/widgets/booking-hero.json?pageKey=tours-remote/booking-summary`),
      fetchData(`/bookings/${bookingId}/widgets/booking-tour-details.json?pageKey=tours-remote/booking-summary`),
      fetchData(`/bookings/${bookingId}/widgets/booking-travelers.json?pageKey=tours-remote/booking-summary`),
      fetchData(`/bookings/${bookingId}/widgets/booking-timeline.json?pageKey=tours-remote/booking-summary`),
    ])
      .then(([heroRes, tourRes, travelersRes, timelineRes]) => {
        if (!active) return;

        const ok = (r) => r && r.status === "success";
        if (!ok(heroRes) || !ok(tourRes)) throw new Error("Failed to load booking");

        const hero = heroRes.component?.data?.booking || {};
        const tourDetails = tourRes.component?.data?.booking || {};
        const travelersData = travelersRes.component?.data?.booking || {};
        const timelineData = timelineRes.component?.data?.booking || {};

        setBooking({
          ...hero,
          ...tourDetails,
          ...travelersData,
          ...timelineData,
          tour: tourDetails.tour || hero.tour || {},
          priceSnapshot: tourDetails.priceSnapshot || {},
          paymentSummary: tourDetails.paymentSummary || {},
          currentQuote: tourDetails.currentQuote || null,
          travelers: travelersData.travelers || [],
          timeline: timelineData.timeline || [],
          statusHistory: timelineData.statusHistory || [],
        });
        setError("");
      })
      .catch((err) => {
        if (active) setError(err?.message || "Failed to load booking");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="bd-page">
        <div className="bd-loading">Loading booking details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bd-page">
        <div className="bd-error">
          <Title text="Failed to load booking" />
          <Paragraph>{error}</Paragraph>
          <Button variant="text" onClick={() => navigate("/manage/tours")} text="Back to Manage" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bd-page">
        <div className="bd-error">
          <Title text="Booking not found" />
          <Button variant="text" onClick={() => navigate("/manage/tours")} text="Back to Manage" />
        </div>
      </div>
    );
  }

  const tour = booking.tour || {};
  const status = String(booking.status || "").toUpperCase();
  const phaseIndex = getPhaseIndex(status);
  const { paymentSummary } = booking;

  return (
    <div className="bd-page">
      <div className="bd-shell">
        <header className="bd-header">
          <div>
            <Button primaryClassName="bd-back" variant="text" iconLeft="arrowLeft" onClick={() => navigate("/manage/tours")} text="Back to Manage" />
            <Title text={tour.title || "Booking Details"} variant="primary" size="large" />
            <div className="bd-ref">{booking.bookingRef}</div>
          </div>
          <div className="bd-status">{statusLabel(status)}</div>
        </header>

        {booking.assignedAgent ? (
          <div className="bd-agent">
            Assigned to <strong>{booking.assignedAgent.name}</strong>
            {booking.assignedAgent.email ? ` (${booking.assignedAgent.email})` : ""}
            {booking.quoteDueAt ? ` , Quote due: ${toDateInput(booking.quoteDueAt)}` : ""}
          </div>
        ) : null}

        {phaseIndex >= 0 ? (
          <div className="bd-progress">
            {STATUS_PHASES.map((phase, i) => {
              const isComplete = i < phaseIndex;
              const isCurrent = i === phaseIndex && !["CANCELLED", "REFUNDED", "REFUND_PENDING"].includes(status);
              return (
                <div key={phase.label} className={`bd-progress__step ${isComplete ? "is-complete" : ""} ${isCurrent ? "is-current" : ""}`}>
                  <div className="bd-progress__dot" />
                  <span className="bd-progress__label">{phase.label}</span>
                  {i < STATUS_PHASES.length - 1 ? <div className="bd-progress__line" /> : null}
                </div>
              );
            })}
            {["CANCELLED", "REFUNDED", "REFUND_PENDING"].includes(status) ? (
              <div className="bd-progress__step is-cancelled">
                <div className="bd-progress__dot" />
                <span className="bd-progress__label">Cancelled</span>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="bd-grid">
          <div className="bd-card bd-card--tour">
            <Title text="Tour Details" />
            <Paragraph>{tour.desc || "No description available."}</Paragraph>
            <div className="bd-meta-grid">
              <div><span>Guests</span><strong>{booking.guestsCount || 1}</strong></div>
              <div><span>Per Person</span><strong>{formatCurrency(booking.priceSnapshot?.perPerson, booking.priceSnapshot?.currency)}</strong></div>
              <div><span>Total</span><strong>{formatCurrency(paymentSummary?.total || booking.priceSnapshot?.total, booking.priceSnapshot?.currency)}</strong></div>
              <div><span>Paid</span><strong className="bd-green">{formatCurrency(paymentSummary?.paid, booking.priceSnapshot?.currency)}</strong></div>
              <div><span>Remaining</span><strong>{formatCurrency(paymentSummary?.remaining, booking.priceSnapshot?.currency)}</strong></div>
              <div><span>Refunded</span><strong>{formatCurrency(paymentSummary?.refunded, booking.priceSnapshot?.currency)}</strong></div>
            </div>
            {booking.currentQuote ? (
              <div className="bd-quote-info">
                <strong>Latest Quote v{booking.currentQuote.version}</strong>
                <span>, {formatCurrency(booking.currentQuote.finalAmount, booking.currentQuote.currency)}</span>
                {booking.currentQuote.expirationDate ? <span> (valid until {toDateInput(booking.currentQuote.expirationDate)})</span> : null}
              </div>
            ) : null}
          </div>

          <div className="bd-card">
            <Title text="Contact" />
            <div className="bd-meta-grid">
              <div><span>Name</span><strong>{booking.primaryContact?.name || ","}</strong></div>
              <div><span>Email</span><strong>{booking.primaryContact?.email || ","}</strong></div>
              <div><span>Phone</span><strong>{booking.primaryContact?.phone || ","}</strong></div>
              <div><span>Start Date</span><strong>{toDateInput(booking.startDate)}</strong></div>
              <div><span>End Date</span><strong>{toDateInput(booking.endDate)}</strong></div>
            </div>
          </div>

          <div className="bd-card">
            <Title text={`Travelers (${booking.travelers?.length || 0})`} />
            {booking.travelers?.length ? (
              <div className="bd-travelers">
                {booking.travelers.map((t, i) => (
                  <div key={t.id || t._id || i} className="bd-traveler">
                    <strong>{t.firstName || ""} {t.lastName || ""}</strong>
                    <span>{t.email || ""}</span>
                    {t.nationality ? <span>{t.nationality}</span> : null}
                  </div>
                ))}
              </div>
            ) : (
              <Paragraph primaryClassname="bd-muted">No traveler details.</Paragraph>
            )}
          </div>

          <div className="bd-card">
            <Title text="Payment History" />
            <div className="bd-payment-list">
              {booking.payments?.length ? (
                booking.payments.map((pmt, i) => (
                  <div key={pmt.id || pmt._id || i} className="bd-payment-item">
                    <span className="bd-payment-date">{toDateInput(pmt.paymentDate)}</span>
                    <span className="bd-payment-amount">{formatCurrency(pmt.amount, pmt.currency)}</span>
                    <span className={`bd-payment-status bd-payment-status--${(pmt.status || "").toLowerCase()}`}>{pmt.status}</span>
                    {pmt.transactionId ? <span className="bd-payment-txn">Txn: {pmt.transactionId}</span> : null}
                  </div>
                ))
              ) : (
                <Paragraph primaryClassname="bd-muted">No payment records yet.</Paragraph>
              )}
            </div>
          </div>

          <div className="bd-card">
            <Title text="Journey Timeline" />
            <div className="bd-timeline">
              {(booking.timeline || booking.statusHistory || []).slice(0, 15).map((item) => (
                <div key={item.id || item._id || item.createdAt} className="bd-timeline-item">
                  <div className="bd-timeline-dot" />
                  <div>
                    <strong>{item.action || statusLabel(item.to || item.status)}</strong>
                    <time>{toDateInput(item.createdAt)}</time>
                    {item.metadata ? (
                      <div className="bd-timeline-meta">
                        {item.metadata.amount ? <span>Amount: {formatCurrency(item.metadata.amount)}</span> : null}
                        {item.metadata.version ? <span>Version: {item.metadata.version}</span> : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              {!(booking.timeline || booking.statusHistory || []).length ? <Paragraph primaryClassname="bd-muted">No timeline updates yet.</Paragraph> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
