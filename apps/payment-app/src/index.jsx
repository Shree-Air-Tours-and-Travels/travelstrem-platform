import { colors } from "@packages/trem-design-tokens";
import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Button from "@packages/trem-ui/components/Button/Button.jsx";
import Spinner from "@packages/trem-ui/components/Spinner/Spinner.jsx";
import StatusBadge from "@packages/trem-ui/components/StatusBadge/StatusBadge.jsx";
import TimelineStepper from "@packages/trem-ui/components/TimelineStepper/TimelineStepper.jsx";
import "@packages/trem-ui/styles/global.scss";
import { createAuthApi, setupRefreshInterceptor } from "@packages/trem-auth-core";
import { fetchData, setFetchDataApiClient, buildGlobalAuthUrl, buildGlobalAppShellUrl } from "@packages/trem-utils";
import { RealtimeProvider, useRealtimeEvent, useRealtimeContext, useBookingClock } from "@packages/trem-events";
import "./payment.css";

const portal = new URLSearchParams(window.location.search).get("portal") || "customer";
window.__TREM_AUTH_PORTAL__ = ["customer", "partner", "admin"].includes(portal)
  ? portal
  : "customer";
const authApi = createAuthApi(process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || "", window.__TREM_AUTH_PORTAL__);
setupRefreshInterceptor(authApi, `payment:${window.__TREM_AUTH_PORTAL__}`);
setFetchDataApiClient(authApi);
const signInUrl = buildGlobalAuthUrl({ app: window.__TREM_AUTH_PORTAL__, returnTo: window.location.href });
const supportUrl = new URL("/help", buildGlobalAppShellUrl()).toString();
const sessionId = window.location.pathname.match(/^\/pay\/(ps_[a-f0-9]{48})\/?$/)?.[1];
const api = async (suffix = "", body) => {
  const result = await fetchData(`/payments/sessions/${sessionId}${suffix}`, {
    method: body ? "POST" : "GET",
    body,
    headers: { "X-Travelstrem-Portal": window.__TREM_AUTH_PORTAL__ },
  });
  if (result.status !== "success") throw Object.assign(new Error(result.message), { code: result.code });
  return result.data;
};
let checkoutScript;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!checkoutScript)
    checkoutScript = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = resolve;
      script.onerror = () => {
        checkoutScript = null;
        script.remove();
        reject(new Error("Checkout could not load. Please retry."));
      };
      document.head.appendChild(script);
    });
  return checkoutScript;
}
function PaymentPage() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [awaiting, setAwaiting] = useState(false);
  const [checkoutOutcome, setCheckoutOutcome] = useState("");
  const { remainingSeconds: remaining, synced: clockSynced } = useBookingClock({ paymentSessionId: sessionId, initial: session?.clock });
  const [checking, setChecking] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const { isConnected } = useRealtimeContext() || {};
  const refresh = useCallback(async () => {
    if (!sessionId) {
      setError("This payment link is invalid.");
      return;
    }
    try {
      const latest = await api();
      setSession(latest);
      setAuthRequired(false);
      setError("");
      return latest;
    } catch (err) {
      setError(err.message);
      const expired = ["AUTH_REQUIRED", "INVALID_SESSION", "SESSION_REVOKED"].includes(err.code) || /sign in|authentication|session.*expired|invalid.*session/i.test(err.message);
      setAuthRequired(expired);
      if (expired) setSession(null);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh, isConnected]);
  useEffect(() => { if (session?.status === "FAILED") setAwaiting(false); }, [session?.status]);
  useEffect(() => {
    if (["PROCESSING", "PAID", "REFUNDED", "PARTIALLY_REFUNDED"].includes(session?.status)) setCheckoutOutcome("");
  }, [session?.status]);
  const onEvent = (envelope) => {
    if (envelope.data?.paymentSessionId === sessionId) refresh();
  };
  useRealtimeEvent("payment.processing", onEvent);
  useRealtimeEvent("payment.completed", onEvent);
  useRealtimeEvent("payment.failed", onEvent);
  useRealtimeEvent("payment.refunded", onEvent);
  useRealtimeEvent("payment.refund.updated", onEvent);
  useRealtimeEvent("booking.confirmed", envelope => { if (envelope.data?.bookingId === session?.bookingId) refresh(); });
  const pay = async () => {
    setBusy(true);
    setError("");
    setCheckoutOutcome("");
    try {
      const order = await api("/order", {});
      if (order.provider !== "razorpay") throw new Error("Checkout provider is unavailable.");
      await loadCheckout();
      let completed = false;
      let failed = false;
      const checkout = new window.Razorpay({
        key: order.key,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "TravelsTrem",
        description: session.bookingReference,
        handler: async (response) => {
          completed = true;
          setCheckoutOutcome("");
          setAwaiting(true);
          setBusy(false);
          try {
            await api("/callback", response);
            await refresh();
          } catch (err) {
            setError(`${err.message} Use Check payment status before trying again.`);
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            if (!completed && !failed) setCheckoutOutcome("Checkout was closed. Check your payment status if money was debited; otherwise you can continue payment.");
            refresh();
          },
        },
        theme: { color: colors.primary },
      });
      checkout.on("payment.failed", () => {
        failed = true;
        setAwaiting(false);
        setCheckoutOutcome("This payment attempt was unsuccessful. Try another payment method in checkout, or close it and retry here. If money was debited, check your payment status first.");
        refresh();
      });
      checkout.open();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  const checkStatus = async () => {
    setChecking(true);
    setStatusFeedback("");
    try {
      const latest = await refresh();
      if (latest) setStatusFeedback("Payment status checked just now.");
    } finally { setChecking(false); }
  };
  useEffect(() => {
    if (session?.status !== "PAID" || !session.returnUrl) return;
    const timer = window.setTimeout(() => window.location.assign(session.returnUrl), 4000);
    return () => window.clearTimeout(timer);
  }, [session?.status, session?.returnUrl]);
  const paid = ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"].includes(session?.status);
  return (
    <main className="payment-page">
      <header>
        <a href="https://travelstrem.com">TravelsTrem</a>
        <span>Secure checkout · TravelsTrem payments</span>
      </header>
      <section className="payment-card">
        {session?.progress && <div className="payment-progress"><TimelineStepper steps={session.progress} orientation="horizontal" markerVariant="number" showStepNumbers showTime={false} ariaLabel="Booking progress" /></div>}
        <p className="eyebrow">SECURE BOOKING PAYMENT</p>
        <h1>{session?.heading || "Complete your booking payment"}</h1>
        {error && (
          <p role="alert" className="payment-error">
            {error}
          </p>
        )}
        {checkoutOutcome && <p role="status" className="payment-error">{checkoutOutcome}</p>}
        {!session && !error && <Spinner label="Loading your payment…" />}
        {!session && error && (authRequired ? <Button href={signInUrl}>Sign in to continue</Button> : <Button variant="outline" onClick={refresh}>Try again</Button>)}
        {session && (
          <>
            <div className="payment-status"><StatusBadge value={session.statusLabel || session.status} tone={session.statusTone || session.tone} /><span className={isConnected ? "is-connected" : ""}>{isConnected ? "Updating automatically" : "Use Check payment status for updates"}</span></div>
            <div className="payment-notice" role="status">
              <p>{awaiting && !paid && session.status !== "PROCESSING" ? "We’re verifying your payment. Please don’t pay again. You can safely leave this page and return to your booking later." : session.message}</p>
            </div>
            <div className="payment-layout"><div className="payment-booking">
            <h2>{session.title}</h2>
            <p>
              {session.customer}
            </p>
            <dl className="payment-details">
              {session.details?.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
            </dl>
            <details className="payment-help" open={helpOpen} onToggle={event => setHelpOpen(event.currentTarget.open)}>
              <summary>Need help with your payment?</summary>
              <p>If money was debited, check the payment status before retrying. Confirmation may take a moment.</p>
              <p>Return to your booking to contact your assigned travel partner. Share booking reference <strong>{session.bookingReference}</strong> and the payment reference above, if available.</p>
              <Button variant="outline" href={supportUrl} target="_blank" rel="noopener noreferrer">Contact support</Button>
              {session.returnUrl && <Button variant="outline" href={session.returnUrl}>Open booking for assistance</Button>}
            </details>
            {!!session.refunds?.length && <section className="payment-history"><h3>Refund updates</h3><p>Total refunded: {session.refundedAmount}</p>{session.refunds.map(item => <article key={item.reference}><strong>{item.status} · {item.amount}</strong><p>{item.message}</p><small>{item.reference} · {new Date(item.date).toLocaleString()}</small></article>)}</section>}
            {!!session.attempts?.length && <details className="payment-help"><summary>Payment history</summary>{session.attempts.map(item => <p key={item.reference}><strong>{item.status} · {item.amount}</strong><br />{item.reference}<br /><small>{new Date(item.date).toLocaleString()}</small></p>)}</details>}
            </div><aside className="payment-summary"><p className="eyebrow">PAYMENT SUMMARY</p>
            <dl>
              {session.breakdown.map((row, index) => (
                <div key={index}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
              <div className="payment-total">
                <dt>{session.amountLabel || "Total payable"}</dt>
                <dd>{session.amount}</dd>
              </div>
            </dl>
            {remaining !== null && !awaiting && <p className="payment-countdown">{!clockSynced && remaining > 0 ? "Syncing booking time…" : remaining === 0 ? "Your booking session has ended. Start a new search to check current availability." : `Time remaining: ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}</p>}
            <div className="payment-actions">
            {remaining === 0 && session.restartUrl && <Button href={session.restartUrl}>Start a new search</Button>}
            {session.canPay && remaining !== 0 && !awaiting && session.status !== "PROCESSING" && (
              <Button fullWidth disabled={busy || !clockSynced} onClick={pay}>
                {busy
                  ? "Opening checkout…"
                  : `${session.status === "FAILED" ? "Retry payment" : "Pay"} · ${session.amount}`}
              </Button>
            )}
            <Button variant="outline" disabled={checking || busy} onClick={checkStatus}>
              {checking ? "Checking status…" : "Check payment status"}
            </Button>
            {session.returnUrl && (
              <Button variant="outline" href={session.returnUrl}>
                {session.status === "PAID" ? "Continue to booking" : "Return to booking"}
              </Button>
            )}
            </div>
            {statusFeedback && <p role="status" className="payment-feedback">{statusFeedback}</p>}
            {session.status === "PAID" && <p role="status">Returning to your booking payment step in a moment…</p>}
            </aside></div>
          </>
        )}
      </section>
      <footer>Payments are securely processed by our payment provider.</footer>
    </main>
  );
}
createRoot(document.getElementById("root")).render(
  <RealtimeProvider>
    <PaymentPage />
  </RealtimeProvider>,
);
