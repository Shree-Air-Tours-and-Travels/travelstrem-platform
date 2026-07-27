import React, { useEffect, useRef, useState } from "react";

const money = (amount, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(Number(amount || 0));
  } catch {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  }
};

export default function OfflinePaymentPanel({ booking, onSubmit, submitting }) {
  const methods = (booking?.paymentConfiguration?.methods || []).filter((method) => method.enabled !== false);
  const paymentStatus = String(booking?.paymentStatus || "TOKEN_PENDING").toUpperCase();
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState("");
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!screenshot) {
      setPreview("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(screenshot);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [screenshot]);

  if (booking?.product !== "trevio") return null;

  const canSubmit = booking.status === "AWAITING_TOKEN_PAYMENT" && paymentStatus === "TOKEN_PENDING";
  const chooseScreenshot = (file) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setMessage("Please upload a PNG, JPG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage("The screenshot must be smaller than 10 MB.");
      return;
    }
    setMessage("");
    setScreenshot(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!screenshot) {
      setMessage("Choose your payment screenshot first.");
      return;
    }
    setMessage("");
    try {
      await onSubmit({ screenshot });
      setScreenshot(null);
      if (inputRef.current) inputRef.current.value = "";
      setMessage("Your payment proof has been submitted and is awaiting admin verification.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="be-offline-payment">
      <div className="be-offline-payment__header">
        <div>
          <span>Booking status</span>
          <strong>{String(booking.status || "").replace(/_/g, " ")}</strong>
        </div>
        <div>
          <span>Payment status</span>
          <strong>{paymentStatus.replace(/_/g, " ")}</strong>
        </div>
      </div>
      <div className="be-offline-payment__amounts">
        <div><span>Token amount</span><strong>{money(booking.tokenAmount, booking.priceSnapshot?.currency)}</strong></div>
        <div><span>Remaining amount</span><strong>{money(booking.remainingAmount ?? booking.paymentSummary?.remaining, booking.priceSnapshot?.currency)}</strong></div>
      </div>

      {booking.paymentRejectionReason && (
        <p className="be-offline-payment__notice is-error">Payment verification failed: {booking.paymentRejectionReason}</p>
      )}
      {paymentStatus === "TOKEN_VERIFICATION" && (
        <p className="be-offline-payment__notice">Your payment proof has been submitted and is awaiting admin verification.</p>
      )}

      {canSubmit && (
        <>
          <div className="be-offline-payment__methods">
            {methods.map((method) => (
              <article key={method.code}>
                <h4>{method.label}</h4>
                {method.qrImage && <img src={method.qrImage} alt={`${method.label} QR code`} />}
                {method.upiId && <p>UPI ID: <strong>{method.upiId}</strong></p>}
                {method.accountHolder && <p>Account holder: <strong>{method.accountHolder}</strong></p>}
                {method.bankAccount && <p>Account: <strong>{method.bankAccount}</strong></p>}
                {method.bankName && <p>Bank: <strong>{method.bankName}</strong></p>}
                {method.ifsc && <p>IFSC: <strong>{method.ifsc}</strong></p>}
                {method.instructions && <p>{method.instructions}</p>}
              </article>
            ))}
          </div>
          {booking.paymentConfiguration?.instructions && <p>{booking.paymentConfiguration.instructions}</p>}
          <form className="be-offline-payment__form" onSubmit={submit}>
            <div className="be-offline-payment__form-heading">
              <strong>Upload payment screenshot</strong>
              <span>No transaction ID or extra details needed.</span>
            </div>
            <input ref={inputRef} className="be-offline-payment__file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => chooseScreenshot(event.target.files?.[0])} />
            <button
              type="button"
              className={`be-offline-payment__dropzone ${dragging ? "is-dragging" : ""} ${screenshot ? "has-file" : ""}`}
              onClick={() => inputRef.current?.click()}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                chooseScreenshot(event.dataTransfer.files?.[0]);
              }}
            >
              {screenshot ? (
                <>
                  <img src={preview} alt="Selected payment screenshot preview" />
                  <span><strong>{screenshot.name}</strong><small>{(screenshot.size / (1024 * 1024)).toFixed(2)} MB · Click to replace</small></span>
                </>
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v3A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span><strong>Choose screenshot</strong><small>or drag and drop · PNG, JPG or WebP</small></span>
                </>
              )}
            </button>
            {screenshot && <button type="button" className="be-offline-payment__remove" onClick={() => {
              setScreenshot(null);
              if (inputRef.current) inputRef.current.value = "";
            }}>Remove screenshot</button>}
            <button type="submit" className="be-offline-payment__submit" disabled={submitting || !screenshot}>
              {submitting ? "Submitting..." : (booking.paymentRejectionReason ? "Upload Again" : "Submit Payment Proof")}
            </button>
          </form>
        </>
      )}
      {message && <p className="be-offline-payment__notice">{message}</p>}
      {(booking.paymentTimeline || []).length > 0 && (
        <div className="be-offline-payment__timeline">
          <h4>Payment Timeline</h4>
          {booking.paymentTimeline.map((entry) => (
            <div key={entry.id || entry._id || entry.createdAt}>
              <span>{String(entry.action || "").replace(/_/g, " ")}</span>
              <time>{new Date(entry.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</time>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
