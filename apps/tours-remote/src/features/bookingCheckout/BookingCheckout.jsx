import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Breadcrumbs, GlobalLoader, Icon } from "@packages/trem-ui";
import { ConfirmOverlay } from "@packages/trem-modals";
import { fetchData } from "@packages/trem-utils";
import "../bookingSummary/BookingSummary.scss";
import "./BookingCheckout.scss";

const formatCurrency = (amount, currency = "INR") => {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: value % 1 ? 2 : 0 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-IN")}`;
  }
};

const statusLabel = (status = "") => String(status || "PENDING").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

export default function BookingCheckoutPage({ dispatchEvent } = {}) {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [labels, setLabels] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPay, setShowPay] = useState(false);
  const referrer = location.state?.from || { label: "Booking Summary", path: `/tours/bookings/${bookingId}` };

  const goToSummary = useCallback(() => {
    if (typeof dispatchEvent === "function") {
      dispatchEvent("navigateToBookingSummary", { bookingId });
      return;
    }
    navigate(`/tours/bookings/${bookingId}`);
  }, [bookingId, dispatchEvent, navigate]);

  const loadCheckout = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const pageRes = await fetchData("/booking-checkout-page.json");
      if (!pageRes || pageRes.status !== "success") throw new Error("Failed to load checkout page");

      const pageLabels = pageRes.component?.elements?.labels || {};
      setLabels(pageLabels);

      const pageKey = "tours-remote/booking-checkout";
      const [heroRes, paymentRes, sidebarRes] = await Promise.all([
        fetchData(`/bookings/${bookingId}/widgets/checkout-hero.json?pageKey=${pageKey}`),
        fetchData(`/bookings/${bookingId}/widgets/checkout-payment-summary.json?pageKey=${pageKey}`),
        fetchData(`/bookings/${bookingId}/widgets/checkout-sidebar.json?pageKey=${pageKey}`),
      ]);

      const widgets = [heroRes, paymentRes, sidebarRes];
      for (const w of widgets) {
        if (!w || w.status !== "success") throw new Error(w?.message || "Failed to load checkout");
      }

      const hero = heroRes.component?.data?.booking || {};
      const payment = paymentRes.component?.data?.booking || {};
      const sidebar = sidebarRes.component?.data?.booking || {};

      setBooking({
        ...hero,
        ...payment,
        ...sidebar,
        tour: hero.tour || payment.tour || sidebar.tour || {},
      });
    } catch (err) {
      setError(err?.message || "Failed to load checkout");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadCheckout();
  }, [loadCheckout]);

  const price = useMemo(() => {
    const currency = booking?.priceSnapshot?.currency || "INR";
    const total = Number(booking?.paymentSummary?.total || booking?.priceSnapshot?.total || 0);
    const paid = Number(booking?.paymentSummary?.paid || 0);
    const remaining = Math.max(0, Number(booking?.paymentSummary?.remaining ?? (total - paid)));
    return {
      currency,
      total,
      paid,
      remaining,
      formattedTotal: formatCurrency(total, currency),
      formattedPaid: formatCurrency(paid, currency),
      formattedRemaining: formatCurrency(remaining, currency),
      formattedPerPerson: formatCurrency(booking?.priceSnapshot?.perPerson, currency),
    };
  }, [booking]);

  const t = useCallback((key, fallback) => labels[key] || fallback || key, [labels]);

  const status = String(booking?.status || "").toUpperCase();
  const canPay = ["PAYMENT_PENDING", "PARTIALLY_PAID", "CONFIRMED"].includes(status) && price.remaining > 0;

  const handlePay = async () => {
    if (!canPay) return;
    setProcessing(true);
    setError("");
    setMessage("");
    try {
      const res = await fetchData(`/bookings/${bookingId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          amount: price.remaining,
          currency: price.currency,
          method: "online",
          gateway: "manual_checkout",
          transactionRef: `TREM-PAY-${Date.now()}`,
          status: "PAID",
        },
      });
      if (!res || res.status !== "success") throw new Error(res?.message || "Payment failed");
      setBooking((prev) => ({ ...prev, ...(res.componentData?.data || {}) }));
      setMessage(t("paymentSuccess", "Payment recorded successfully."));
    } catch (err) {
      setError(t("paymentFailed", "Payment failed"));
    } finally {
      setProcessing(false);
      setShowPay(false);
    }
  };

  if (loading) return <GlobalLoader visible text={t("pageTitle", "Loading checkout...")} />;

  if (error && !booking) {
    return (
      <main className="booking-summary-page">
        <section className="booking-summary-page__empty">
          <Icon name="alertTriangle" />
          <h1>{t("errorLoad", "Checkout could not load")}</h1>
          <p>{error}</p>
          <button type="button" onClick={goToSummary}>{t("backToBooking", "Back to booking")}</button>
        </section>
      </main>
    );
  }

  const tour = booking?.tour || {};
  const guestLabel = (booking?.guestsCount || 1) > 1
    ? (t("guestCountPlural", "{count} guests") || "{count} guests").replace("{count}", booking?.guestsCount || 1)
    : (t("guestCount", "{count} guest") || "{count} guest").replace("{count}", booking?.guestsCount || 1);

  return (
    <main className="booking-checkout-page">
      <div className="booking-summary-page__shell">
        <Breadcrumbs
          items={[
            { label: referrer.label || t("bookingSummary", "Booking Summary"), path: referrer.path || `/tours/bookings/${bookingId}` },
            { label: t("pageTitle", "Checkout") },
          ]}
        />

        <header className="booking-summary-hero">
          <div>
            <span className={`booking-summary-status status-${status.toLowerCase().replace(/_/g, "-")}`}>{statusLabel(status)}</span>
            <h1>{t("pageTitle", "Checkout")}</h1>
            <p>{booking?.bookingRef}</p>
          </div>
          <div className="booking-summary-hero__actions">
            <button type="button" onClick={goToSummary}>{t("bookingSummary", "Booking Summary")}</button>
            <a className="booking-summary-action-link" href={`mailto:support@travelstrem.com?subject=${encodeURIComponent(`Booking ${booking?.bookingRef || ""}`)}`}>{t("contactAgent", "Contact Agent")}</a>
          </div>
        </header>

        {message ? <div className="booking-summary-alert is-success">{message}</div> : null}
        {error ? <div className="booking-summary-alert is-error">{error}</div> : null}

        <section className="booking-checkout-grid">
          <article className="booking-summary-card booking-checkout-main">
            <h2>{t("paymentSummary", "Payment Summary")}</h2>
            <div className="booking-checkout-tour">
              <img src={tour?.photo || tour?.photos?.[0] || "https://res.cloudinary.com/dofxshf3z/image/upload/v1779131576/tour-img01_tljj0m.jpg"} alt="" />
              <div>
                <strong>{tour?.title || "Tour Booking"}</strong>
                <span>{guestLabel}</span>
              </div>
            </div>
            <dl className="booking-checkout-totals">
              <div><dt>{t("perPerson", "Per Person")}</dt><dd>{price.formattedPerPerson}</dd></div>
              <div><dt>{t("totalCost", "Total Cost")}</dt><dd>{price.formattedTotal}</dd></div>
              <div><dt>{t("paid", "Paid")}</dt><dd>{price.formattedPaid}</dd></div>
              <div><dt>{t("amountDue", "Amount Due")}</dt><dd>{price.formattedRemaining}</dd></div>
            </dl>
            {!canPay ? (
              <p className="booking-summary-card__note">
                {t("checkoutNote", "Checkout opens after the quote is accepted and payment is pending.")}
              </p>
            ) : null}
          </article>

          <aside className="booking-summary-card booking-checkout-side">
            <h2>{t("completePayment", "Complete Payment")}</h2>
            <p>{t("sidebarNote", "Your admin-finalized quote is ready. Continue when you are ready to record the payment.")}</p>
            <button type="button" disabled={!canPay || processing} onClick={() => setShowPay(true)}>
              {processing ? t("processing", "Processing...") : (t("payNow", "Pay {amount}") || "Pay {amount}").replace("{amount}", price.formattedRemaining)}
            </button>
            <button type="button" onClick={goToSummary}>{t("reviewBooking", "Review Booking")}</button>
          </aside>
        </section>
      </div>

      <ConfirmOverlay
        open={showPay}
        onClose={() => setShowPay(false)}
        onConfirm={handlePay}
        title={t("confirmPayTitle", "Confirm Payment")}
        note={(t("confirmPayNote", "This will record a payment of {amount} against your booking.") || "This will record a payment of {amount} against your booking.").replace("{amount}", price.formattedRemaining)}
        icon="creditCard"
        confirmLabel={t("confirmPayLabel", "Pay Now")}
        cancelLabel={t("confirmCancelLabel", "Cancel")}
        confirmDisabled={processing}
      />
    </main>
  );
}
