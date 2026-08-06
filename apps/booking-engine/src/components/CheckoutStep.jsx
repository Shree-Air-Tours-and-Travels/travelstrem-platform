import React from "react";
import OfflinePaymentPanel from "./OfflinePaymentPanel.jsx";

export default function CheckoutStep({ booking, product, onPay, loading }) {
  return (
    <div className="be-step be-step--checkout">
      <OfflinePaymentPanel booking={booking} onSubmit={onPay} submitting={loading} />
    </div>
  );
}
