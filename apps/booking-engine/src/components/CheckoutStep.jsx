import React, { useState } from "react";
import Button from "@packages/trem-ui/components/Button/Button.jsx";

const formatMoney = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function CheckoutStep({ booking, product, onPay, loading }) {
  const [method, setMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [agreed, setAgreed] = useState(false);

  const totalAmount = booking?.paymentSummary?.total || booking?.priceSnapshot?.total || 0;
  const tokenAmount = product === "trevio" ? Math.round(totalAmount * 0.15) : totalAmount;
  const remainingAmount = totalAmount - tokenAmount;
  const isTrevio = product === "trevio";

  const methods = [
    { key: "upi", label: "UPI", icon: "💳" },
    { key: "card", label: "Card", icon: "💳" },
    { key: "netbanking", label: "Net Banking", icon: "🏦" },
  ];

  return (
    <div className="be-step be-step--checkout">
      <div className="be-checkout">
        <section className="be-checkout__summary">
          <h3 className="be-checkout__heading">Booking Summary</h3>
          <div className="be-checkout__card">
            <div className="be-checkout__row">
              <span>Booking Ref</span>
              <span className="be-checkout__ref">{booking?.bookingRef || "—"}</span>
            </div>
            <div className="be-checkout__row">
              <span>Total Amount</span>
              <span>{formatMoney(totalAmount)}</span>
            </div>
            {isTrevio && (
              <>
                <div className="be-checkout__row be-checkout__row--highlight">
                  <span>Token Amount (15%)</span>
                  <span>{formatMoney(tokenAmount)}</span>
                </div>
                <div className="be-checkout__row">
                  <span>Remaining (on trip)</span>
                  <span>{formatMoney(remainingAmount)}</span>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="be-checkout__payment">
          <h3 className="be-checkout__heading">Payment Method</h3>
          <div className="be-checkout__methods">
            {methods.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`be-checkout__method ${method === m.key ? "be-checkout__method--active" : ""}`}
                onClick={() => setMethod(m.key)}
              >
                <span className="be-checkout__method-icon">{m.icon}</span>
                <span className="be-checkout__method-label">{m.label}</span>
              </button>
            ))}
          </div>

          {method === "upi" && (
            <div className="be-checkout__form">
              <label className="be-field">
                <span className="be-field__label">UPI ID</span>
                <input
                  className="be-checkout__input"
                  type="text"
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </label>
            </div>
          )}

          {method === "card" && (
            <div className="be-checkout__form">
              <label className="be-field">
                <span className="be-field__label">Card Number</span>
                <input className="be-checkout__input" type="text" placeholder="4242 4242 4242 4242" maxLength={19} />
              </label>
              <div className="be-checkout__form-row">
                <label className="be-field">
                  <span className="be-field__label">Expiry</span>
                  <input className="be-checkout__input" type="text" placeholder="MM/YY" maxLength={5} />
                </label>
                <label className="be-field">
                  <span className="be-field__label">CVV</span>
                  <input className="be-checkout__input" type="password" placeholder="***" maxLength={4} />
                </label>
              </div>
            </div>
          )}

          {method === "netbanking" && (
            <div className="be-checkout__form">
              <label className="be-field">
                <span className="be-field__label">Select Bank</span>
                <select className="be-checkout__input">
                  <option value="">Choose bank</option>
                  <option value="sbi">State Bank of India</option>
                  <option value="hdfc">HDFC Bank</option>
                  <option value="icici">ICICI Bank</option>
                  <option value="axis">Axis Bank</option>
                  <option value="kotak">Kotak Mahindra</option>
                </select>
              </label>
            </div>
          )}
        </section>

        <section className="be-checkout__terms">
          <label className="be-checkout__checkbox">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</a> and <a href="/cancellation" target="_blank" rel="noopener noreferrer">Cancellation Policy</a></span>
          </label>
        </section>

        <div className="be-checkout__security">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L2 3v4c0 3.5 2.1 5.8 5 7 2.9-1.2 5-3.5 5-7V3L7 1z" stroke="currentColor" strokeWidth="1.2" /><path d="M5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
          <span>Secured by 256-bit SSL encryption</span>
        </div>

        <Button
          variant="solid"
          color="primary"
          text={loading ? "Processing..." : `Pay ${formatMoney(tokenAmount)}`}
          onClick={() => onPay({ method, upiId })}
          disabled={!agreed || loading}
          primaryClassName="be-checkout__pay-btn"
        />
      </div>
    </div>
  );
}
