import React from "react";
import OfflinePaymentPanel from "./OfflinePaymentPanel.jsx";

export default function CheckoutStep({ booking, product, onPay, loading }) {
  if (product !== "trevio") {
    return (
      <div className="be-step be-step--checkout">
        <p>Complete the booking first. Payment instructions will appear on the booking detail page.</p>
      </div>
    );
  }

  return (
    <div className="be-step be-step--checkout">
      <OfflinePaymentPanel
        booking={{ ...booking, product: "trevio" }}
        onSubmit={onPay}
        submitting={loading}
      />
    </div>
  );
}
