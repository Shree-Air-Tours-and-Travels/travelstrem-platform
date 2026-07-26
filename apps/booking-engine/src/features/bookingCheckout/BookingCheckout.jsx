import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Breadcrumbs, Button, GlobalLoader, Icon, Title, SubTitle, Paragraph } from "@packages/trem-ui";
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

const PAYMENT_METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: "creditCard", description: "Visa, Mastercard, RuPay" },
  { id: "upi", label: "UPI", icon: "smartphone", description: "Google Pay, PhonePe, Paytm" },
  { id: "netbanking", label: "Net Banking", icon: "building", description: "All major banks" },
  { id: "qr", label: "QR Code", icon: "qrCode", description: "Scan & pay" },
];

function PaymentMethodSelector({ selected, onSelect }) {
  return (
    <div className="checkout-payment-methods">
      {PAYMENT_METHODS.map((method) => (
        <label key={method.id} className={`checkout-payment-method${selected === method.id ? " is-selected" : ""}`}>
          <input type="radio" name="paymentMethod" value={method.id} checked={selected === method.id} onChange={() => onSelect(method.id)} />
          <span className="checkout-payment-method__radio" />
          <span className="checkout-payment-method__icon"><Icon name={method.icon} size={20} /></span>
          <span className="checkout-payment-method__info">
            <strong>{method.label}</strong>
            <span>{method.description}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function CardPaymentForm({ form, errors, onChange }) {
  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  return (
    <div className="checkout-card-form">
      <div className="checkout-form-field">
        <label htmlFor="cardName">Cardholder Name</label>
        <input id="cardName" type="text" placeholder="Name as written on card" value={form.cardName || ""} onChange={(e) => onChange("cardName", e.target.value)} className={errors.cardName ? "has-error" : ""} />
        {errors.cardName && <small>{errors.cardName}</small>}
      </div>
      <div className="checkout-form-field">
        <label htmlFor="cardNumber">Card Number</label>
        <div className="checkout-card-input-wrapper">
          <input id="cardNumber" type="text" inputMode="numeric" placeholder="1234 5678 9012 3456" value={form.cardNumber || ""} onChange={(e) => onChange("cardNumber", formatCardNumber(e.target.value))} className={errors.cardNumber ? "has-error" : ""} maxLength={19} />
          <span className="checkout-card-brands">
            <Icon name="creditCard" size={18} />
          </span>
        </div>
        {errors.cardNumber && <small>{errors.cardNumber}</small>}
      </div>
      <div className="checkout-form-row">
        <div className="checkout-form-field">
          <label htmlFor="cardExpiry">Expiry Date</label>
          <input id="cardExpiry" type="text" inputMode="numeric" placeholder="MM/YY" value={form.cardExpiry || ""} onChange={(e) => onChange("cardExpiry", formatExpiry(e.target.value))} className={errors.cardExpiry ? "has-error" : ""} maxLength={5} />
          {errors.cardExpiry && <small>{errors.cardExpiry}</small>}
        </div>
        <div className="checkout-form-field">
          <label htmlFor="cardCvv">CVV</label>
          <input id="cardCvv" type="password" inputMode="numeric" placeholder="•••" value={form.cardCvv || ""} onChange={(e) => onChange("cardCvv", e.target.value.replace(/\D/g, "").slice(0, 4))} className={errors.cardCvv ? "has-error" : ""} maxLength={4} />
          {errors.cardCvv && <small>{errors.cardCvv}</small>}
        </div>
      </div>
    </div>
  );
}

function UPIPaymentForm({ form, onChange }) {
  return (
    <div className="checkout-upi-form">
      <div className="checkout-form-field">
        <label htmlFor="upiId">UPI ID</label>
        <input id="upiId" type="text" placeholder="yourname@upi" value={form.upiId || ""} onChange={(e) => onChange("upiId", e.target.value)} />
        <small>We will send a payment request to this UPI ID</small>
      </div>
      <div className="checkout-upi-apps">
        {["Google Pay", "PhonePe", "Paytm", "BHIM"].map((app) => (
          <button key={app} type="button" className={`checkout-upi-app${form.upiApp === app ? " is-selected" : ""}`} onClick={() => onChange("upiApp", app)}>
            {app}
          </button>
        ))}
      </div>
    </div>
  );
}

function NetBankingForm({ form, onChange }) {
  const banks = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank", "Bank of Baroda", "Union Bank of India"];
  return (
    <div className="checkout-netbanking-form">
      <div className="checkout-form-field">
        <label>Select Bank</label>
        <div className="checkout-bank-grid">
          {banks.map((bank) => (
            <button key={bank} type="button" className={`checkout-bank-option${form.bank === bank ? " is-selected" : ""}`} onClick={() => onChange("bank", bank)}>
              {bank}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function QRPaymentForm() {
  return (
    <div className="checkout-qr-form">
      <div className="checkout-qr-placeholder">
        <Icon name="qrCode" size={120} />
        <p>Scan this QR code with any UPI app to complete payment</p>
        <small>QR code will be generated after you click "Pay Now"</small>
      </div>
    </div>
  );
}

function BillingForm({ method, form, errors, onChange }) {
  return (
    <div className="checkout-billing-form">
      {method === "card" && <CardPaymentForm form={form} errors={errors} onChange={onChange} />}
      {method === "upi" && <UPIPaymentForm form={form} onChange={onChange} />}
      {method === "netbanking" && <NetBankingForm form={form} onChange={onChange} />}
      {method === "qr" && <QRPaymentForm />}
      <div className="checkout-form-field checkout-billing-email">
        <label htmlFor="billingEmail">Receipt Email</label>
        <input id="billingEmail" type="email" placeholder="email@example.com" value={form.email || ""} onChange={(e) => onChange("email", e.target.value)} />
        <small>Payment receipt and booking confirmation will be sent here</small>
      </div>
      <div className="checkout-form-field checkout-billing-phone">
        <label htmlFor="billingPhone">Mobile Number</label>
        <input id="billingPhone" type="tel" placeholder="+91 98765 43210" value={form.phone || ""} onChange={(e) => onChange("phone", e.target.value)} />
      </div>
    </div>
  );
}

export default function BookingCheckoutPage({ dispatchEvent, bookingBasePath = "/trevista", dashboardPath = "/dashboard" } = {}) {
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
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [billingForm, setBillingForm] = useState({ cardName: "", cardNumber: "", cardExpiry: "", cardCvv: "", upiId: "", upiApp: "", bank: "", email: "", phone: "" });
  const [billingErrors, setBillingErrors] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const referrer = location.state?.from || { label: "Booking Summary", path: `${bookingBasePath}/bookings/${bookingId}` };

  const goToSummary = useCallback(() => {
    if (typeof dispatchEvent === "function") {
      dispatchEvent("navigateToBookingSummary", { bookingId });
      return;
    }
    navigate(`${bookingBasePath}/bookings/${bookingId}`);
  }, [bookingId, bookingBasePath, dispatchEvent, navigate]);

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
        if (!w || w.status !== "success") throw new Error(w?.message || pageLabels.loadWidgetsError || "Failed to load checkout");
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
    const perPerson = Number(booking?.priceSnapshot?.perPerson || 0);
    const guests = Number(booking?.guestsCount || 1);
    const convenienceFee = Math.round(total * 0.01);
    const gst = Math.round((total + convenienceFee) * 0.18);
    return {
      currency,
      total,
      paid,
      remaining,
      perPerson,
      guests,
      convenienceFee,
      gst,
      grandTotal: total + convenienceFee + gst,
      formattedTotal: formatCurrency(total, currency),
      formattedPaid: formatCurrency(paid, currency),
      formattedRemaining: formatCurrency(remaining, currency),
      formattedPerPerson: formatCurrency(perPerson, currency),
      formattedConvenienceFee: formatCurrency(convenienceFee, currency),
      formattedGST: formatCurrency(gst, currency),
      formattedGrandTotal: formatCurrency(total + convenienceFee + gst, currency),
    };
  }, [booking]);

  const t = useCallback((key, fallback) => labels[key] || fallback || key, [labels]);

  const status = String(booking?.status || "").toUpperCase();
  const canPay = ["PAYMENT_PENDING", "PARTIALLY_PAID", "CONFIRMED"].includes(status) && price.remaining > 0;

  const validateBillingForm = () => {
    const errs = {};
    if (paymentMethod === "card") {
      if (!billingForm.cardName?.trim()) errs.cardName = "Cardholder name is required";
      const digits = (billingForm.cardNumber || "").replace(/\s/g, "");
      if (digits.length < 13 || digits.length > 16) errs.cardNumber = "Enter a valid card number";
      const expiry = (billingForm.cardExpiry || "").split("/");
      if (expiry.length !== 2 || !expiry[0] || !expiry[1] || Number(expiry[0]) < 1 || Number(expiry[0]) > 12) errs.cardExpiry = "Enter a valid expiry (MM/YY)";
      if ((billingForm.cardCvv || "").length < 3) errs.cardCvv = "Enter a valid CVV";
    }
    if (paymentMethod === "upi" && !billingForm.upiId?.trim()) {
      errs.upiId = "Enter your UPI ID";
    }
    if (paymentMethod === "netbanking" && !billingForm.bank) {
      errs.bank = "Select a bank";
    }
    if (!billingForm.email?.trim() || !/^\S+@\S+\.\S+$/.test(billingForm.email)) errs.email = "Enter a valid email";
    if (!billingForm.phone?.trim() || billingForm.phone.replace(/\D/g, "").length < 10) errs.phone = "Enter a valid phone number";
    setBillingErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePay = async () => {
    if (!canPay) return;
    if (!agreedToTerms) {
      setError("Please agree to the Terms & Conditions and Cancellation Policy");
      return;
    }
    if (!validateBillingForm()) return;

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
          method: paymentMethod,
          gateway: "manual_checkout",
          transactionRef: `TREM-PAY-${Date.now()}`,
          status: "PAID",
          billingDetails: {
            name: billingForm.cardName || billingForm.upiId || billingForm.bank || "",
            email: billingForm.email,
            phone: billingForm.phone,
          },
        },
      });
      if (!res || res.status !== "success") throw new Error(res?.message || "Payment failed");
      setBooking((prev) => ({ ...prev, ...(res.componentData?.data || {}) }));
      setMessage(t("paymentSuccess", "Payment recorded successfully. Redirecting to your dashboard..."));
      window.setTimeout(() => {
        if (/^https?:\/\//.test(dashboardPath)) window.location.assign(dashboardPath);
        else navigate(dashboardPath || "/dashboard", { replace: true });
      }, 1500);
    } catch (err) {
      setError(err?.message || t("paymentFailed", "Payment failed. Please try again."));
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
          <Title text={t("errorLoad", "Checkout could not load")} />
          <Paragraph text={error} />
          <Button variant="text" onClick={goToSummary}>{t("backToBooking", "Back to booking")}</Button>
        </section>
      </main>
    );
  }

  const tour = booking?.tour || {};
  const guestLabel = (booking?.guestsCount || 1) > 1
    ? (t("guestCountPlural", "{count} guests") || "{count} guests").replace("{count}", booking?.guestsCount || 1)
    : (t("guestCount", "{count} guest") || "{count} guest").replace("{count}", booking?.guestsCount || 1);

  const isPaymentComplete = !canPay && price.paid > 0 && price.remaining <= 0;

  return (
    <main className="booking-checkout-page">
      <div className="booking-summary-page__shell">
        <Breadcrumbs
          items={[
            { label: referrer.label || t("bookingSummary", "Booking Summary"), path: referrer.path || `${bookingBasePath}/bookings/${bookingId}` },
            { label: t("pageTitle", "Checkout") },
          ]}
        />

        <header className="booking-summary-hero">
          <div>
            <span className={`booking-summary-status status-${status.toLowerCase().replace(/_/g, "-")}`}>{statusLabel(status)}</span>
            <Title text={t("pageTitle", "Secure Checkout")} />
            <Paragraph text={booking?.bookingRef} />
          </div>
          <div className="booking-summary-hero__actions">
            <Button variant="text" onClick={goToSummary}>{t("bookingSummary", "Booking Summary")}</Button>
            <Button variant="text" iconLeft="mail" onClick={() => process.env.REACT_APP_SUPPORT_EMAIL && window.open(`mailto:${process.env.REACT_APP_SUPPORT_EMAIL}?subject=${encodeURIComponent(`Booking ${booking?.bookingRef || ""}`)}`)}>{process.env.REACT_APP_SUPPORT_EMAIL ? t("contactAgent", "Contact Agent") : t("contactNotConfigured", "Contact not configured")}</Button>
          </div>
        </header>

        {message ? <div className="booking-summary-alert is-success">{message}</div> : null}
        {error ? <div className="booking-summary-alert is-error">{error}</div> : null}

        <section className="booking-checkout-grid">
          <div className="booking-checkout-main-col">
            <article className="booking-summary-card booking-checkout-main">
              <Title text={t("tourDetails", "Tour Details")} />
              <div className="booking-checkout-tour">
                {tour?.photo || tour?.photos?.[0] || process.env.REACT_APP_DEFAULT_TOUR_IMAGE ? (
                  <img src={tour?.photo || tour?.photos?.[0] || process.env.REACT_APP_DEFAULT_TOUR_IMAGE} alt="" />
                ) : (
                  <div className="booking-checkout-tour__placeholder">Image not configured</div>
                )}
                <div>
                  <strong>{tour?.title || "Tour Booking"}</strong>
                  <span>{guestLabel}</span>
                  {tour?.duration && <small>{tour.duration}</small>}
                </div>
              </div>
            </article>

            {!isPaymentComplete && canPay && (
              <article className="booking-summary-card booking-checkout-payment">
                <div className="checkout-payment-header">
                  <Title text={t("paymentMethod", "Select Payment Method")} />
                  <span className="checkout-secure-badge"><Icon name="lock" size={14} /> Secure</span>
                </div>
                <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />
                <BillingForm method={paymentMethod} form={billingForm} errors={billingErrors} onChange={(field, value) => { setBillingForm((prev) => ({ ...prev, [field]: value })); setBillingErrors((prev) => { const next = { ...prev }; delete next[field]; return next; }); }} />
                <div className="checkout-terms">
                  <label className="checkout-terms-label">
                    <input type="checkbox" checked={agreedToTerms} onChange={(e) => { setAgreedToTerms(e.target.checked); setError(""); }} />
                    <span>I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</a> and <a href="/cancellation" target="_blank" rel="noopener noreferrer">Cancellation Policy</a></span>
                  </label>
                </div>
              </article>
            )}

            {isPaymentComplete && (
              <article className="booking-summary-card booking-checkout-main">
                <div className="booking-checkout-paid-msg">
                  <SubTitle text="Payment Complete" />
                  <Paragraph>Your payment of <strong>{price.formattedPaid}</strong> has been recorded. Here is what happens next:</Paragraph>
                  <ol>
                    <li><strong>Admin Confirmation</strong> &mdash; An admin will review and confirm your booking.</li>
                    <li><strong>Ticketing</strong> &mdash; Once confirmed, tickets will be issued for your tour.</li>
                    <li><strong>Travel Ready</strong> &mdash; You will receive your booking pass with all details.</li>
                    <li><strong>Enjoy your tour!</strong></li>
                  </ol>
                  <Paragraph>You can track your booking status from the <Button variant="text" primaryClassName="is-link" onClick={goToSummary}>Booking Summary</Button> page at any time.</Paragraph>
                </div>
              </article>
            )}

            {!canPay && !isPaymentComplete && (
              <Paragraph primaryClassname="booking-summary-card__note">
                {t("checkoutNote", "Checkout opens after the quote is accepted and payment is pending.")}
              </Paragraph>
            )}
          </div>

          <aside className="booking-checkout-side-col">
            <div className="booking-summary-card booking-checkout-side">
              <Title text={t("priceSummary", "Price Summary")} />
              <dl className="booking-checkout-totals">
                <div className="checkout-total-row"><dt>{t("perPerson", "Per Person")}</dt><dd>{price.formattedPerPerson}</dd></div>
                <div className="checkout-total-row"><dt>{t("guestsMultiplier", "× {count} guests").replace("{count}", price.guests)}</dt><dd>{price.formattedTotal}</dd></div>
                <div className="checkout-total-row checkout-total-row--subtle"><dt>{t("convenienceFee", "Convenience Fee")}</dt><dd>{price.formattedConvenienceFee}</dd></div>
                <div className="checkout-total-row checkout-total-row--subtle"><dt>{t("gst", "GST (18%)")}</dt><dd>{price.formattedGST}</dd></div>
                {price.paid > 0 && <div className="checkout-total-row checkout-total-row--paid"><dt>{t("paid", "Paid")}</dt><dd>-{price.formattedPaid}</dd></div>}
                <div className="checkout-total-row checkout-total-row--grand"><dt>{t("amountDue", "Amount Due")}</dt><dd>{price.formattedRemaining}</dd></div>
              </dl>
            </div>

            <div className="booking-summary-card booking-checkout-action">
              <Title text={t("completePayment", "Complete Payment")} />
              <Paragraph text={t("sidebarNote", "Your admin-finalized quote is ready. Continue when you are ready to record the payment.")} />
              <Button variant="solid" color="primary" disabled={!canPay || processing || !agreedToTerms} onClick={() => setShowPay(true)}>
                {processing ? t("processing", "Processing...") : (t("payNow", "Pay {amount}") || "Pay {amount}").replace("{amount}", price.formattedRemaining)}
              </Button>
              <div className="checkout-security-note">
                <Icon name="lock" size={14} />
                <span>256-bit SSL encrypted &middot; PCI DSS compliant</span>
              </div>
              <div className="checkout-trust-badges">
                <span className="checkout-trust-badge"><Icon name="shield" size={16} /> Safe & Secure</span>
                <span className="checkout-trust-badge"><Icon name="checkCircle" size={16} /> Verified Merchant</span>
              </div>
              <Button variant="text" onClick={goToSummary}>{t("reviewBooking", "Review Booking")}</Button>
            </div>
          </aside>
        </section>
      </div>

      <ConfirmOverlay
        open={showPay}
        onClose={() => setShowPay(false)}
        onConfirm={handlePay}
        title={t("confirmPayTitle", "Confirm Payment")}
        note={(t("confirmPayNote", "You are about to pay {amount} via {method}. This action cannot be undone.") || "You are about to pay {amount} via {method}. This action cannot be undone.").replace("{amount}", price.formattedRemaining).replace("{method}", PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label || paymentMethod)}
        icon="creditCard"
        confirmLabel={t("confirmPayLabel", "Pay Now")}
        cancelLabel={t("confirmCancelLabel", "Cancel")}
        confirmDisabled={processing}
      />
    </main>
  );
}
