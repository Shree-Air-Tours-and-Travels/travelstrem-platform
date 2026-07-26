import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { GlobalLoader, EmptyState } from "@packages/trem-ui";
import BookingLayout from "../components/BookingLayout.jsx";
import StatusTracker from "../components/StatusTracker.jsx";
import MessagePanel from "../components/MessagePanel.jsx";
import ConfirmOverlay from "@packages/trem-modals/ConfirmOverlay.jsx";
import { useBookingApi } from "../hooks/useBookingApi.js";

export default function BookingStatusPage() {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const product = searchParams.get("product") || location.state?.booking?.product || "trevista";

  const api = useBookingApi();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  const loadBooking = useCallback(async () => {
    try {
      const data = await api.getBookingDetail(bookingId);
      setBooking(data);
    } catch (err) {
      console.error("Failed to load booking:", err);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { loadBooking(); }, [loadBooking]);

  const handleAcceptQuote = async () => {
    try {
      await api.acceptQuote(bookingId);
      await loadBooking();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectQuote = async () => {
    try {
      await api.rejectQuote(bookingId);
      await loadBooking();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePay = async (provider) => {
    try {
      if (product === "trevio") {
        await api.payToken(bookingId, { provider });
      } else {
        await api.payFullAmount(bookingId, { provider });
      }
      setShowPay(false);
      await loadBooking();
    } catch (err) {
      if (err?.message?.includes("Token already paid")) {
        const dashboardUrl = process.env.REACT_APP_DASHBOARD_URL || "http://localhost:3006";
        window.location.href = `${dashboardUrl}/bookings`;
        return;
      }
      console.error(err);
    }
  };

  const handleCancel = async () => {
    try {
      await api.cancelBooking(bookingId);
      setShowCancel(false);
      await loadBooking();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (loading) return <GlobalLoader visible text="Loading booking..." />;
  if (!booking) return (
    <BookingLayout steps={[]} currentStep={0} product={product}>
      <div className="be-step">
        <EmptyState
          icon="alertTriangle"
          title="Booking not found"
          description="This booking could not be found or may have been removed."
          action={
            <button type="button" className="be-empty__btn" onClick={handleBackToHome}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              Go to home
            </button>
          }
        />
      </div>
    </BookingLayout>
  );

  const steps = booking.flowSteps || [];
  const currentStepIdx = steps.findIndex((s) => s.status === "current");
  const cancellationPolicy = booking?.cancellationPolicy || "";
  const isCancellable = ["DRAFT", "QUOTE_REQUESTED", "UNDER_REVIEW", "QUOTE_READY", "QUOTE_SENT", "PAYMENT_PENDING", "CONFIRMED"].includes(booking?.status);

  return (
    <BookingLayout
      steps={steps}
      currentStep={currentStepIdx >= 0 ? currentStepIdx : 0}
      product={product}
    >
      <div className="be-status-page">
        <div className="be-status-page__main">
          <StatusTracker
            booking={booking}
            product={product}
            onAcceptQuote={handleAcceptQuote}
            onRejectQuote={handleRejectQuote}
            onPay={() => setShowPay(true)}
            onCancel={() => setShowCancel(true)}
          />
        </div>

        {product === "trevista" && (
          <div className={`be-status-page__messages ${showMessages ? "be-status-page__messages--open" : ""}`}>
            <button
              type="button"
              className="be-status-page__messages-toggle"
              onClick={() => setShowMessages(!showMessages)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M15 9A6 6 0 1 1 3 9a6 6 0 0 1 12 0z" stroke="currentColor" strokeWidth="1.2" /><path d="M6 9h6M9 6v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
              {showMessages ? "Hide Messages" : "Messages"}
              {booking.unreadMessages > 0 && <span className="be-status-page__unread-badge">{booking.unreadMessages}</span>}
            </button>
            {showMessages && <MessagePanel bookingId={bookingId} />}
          </div>
        )}
      </div>

      {showCancel && (
        <ConfirmOverlay
          open={showCancel}
          onClose={() => setShowCancel(false)}
          onConfirm={handleCancel}
          title="Cancel Booking?"
          note={
            cancellationPolicy
              ? `This action cannot be undone.\n\nCancellation Policy: ${cancellationPolicy}`
              : "This action cannot be undone. You may be eligible for a refund depending on the cancellation policy."
          }
          confirmLabel="Yes, Cancel Booking"
          cancelLabel="Keep Booking"
        />
      )}

      {showPay && (
        <div className="be-pay-overlay" onClick={() => setShowPay(false)}>
          <div className="be-pay-overlay__content" onClick={(e) => e.stopPropagation()}>
            <div className="be-pay-overlay__header">
              <div className="be-pay-overlay__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <h3 className="be-pay-overlay__title">Complete Payment</h3>
              <p className="be-pay-overlay__subtitle">Choose your preferred payment method</p>
            </div>
            <div className="be-pay-overlay__methods">
              <button type="button" className="be-pay-overlay__method" onClick={() => handlePay("razorpay")}>
                <span className="be-pay-overlay__method-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </span>
                <span className="be-pay-overlay__method-info">
                  <span className="be-pay-overlay__method-name">Razorpay</span>
                  <span className="be-pay-overlay__method-desc">Cards, Netbanking, Wallets</span>
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button type="button" className="be-pay-overlay__method" onClick={() => handlePay("upi")}>
                <span className="be-pay-overlay__method-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                </span>
                <span className="be-pay-overlay__method-info">
                  <span className="be-pay-overlay__method-name">UPI</span>
                  <span className="be-pay-overlay__method-desc">GPay, PhonePe, Paytm</span>
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <button type="button" className="be-pay-overlay__cancel" onClick={() => setShowPay(false)}>Cancel</button>
          </div>
        </div>
      )}
    </BookingLayout>
  );
}
