import React, { useEffect, useMemo, useState } from "react";
import { fetchData } from "@packages/trem-utils";
import { downloadPaymentProof } from "../../services/adminService";
import "./AdminPaymentsBookings.scss";

const label = (value) => String(value || "—").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
const money = (value, currency = "INR") => {
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(Number(value || 0)); }
  catch { return `₹${Number(value || 0).toLocaleString("en-IN")}`; }
};

function SettingsEditor() {
  const [settings, setSettings] = useState({ methods: [], instructions: "" });
  const [state, setState] = useState("");

  useEffect(() => {
    fetchData("/admin/bookings/payment-settings").then((response) => {
      if (response?.status === "success") setSettings(response.componentData?.data || { methods: [] });
    });
  }, []);

  const updateMethod = (index, field, value) => {
    setSettings((current) => ({
      ...current,
      methods: current.methods.map((method, methodIndex) => methodIndex === index ? { ...method, [field]: value } : method),
    }));
  };

  const save = async () => {
    setState("Saving...");
    const response = await fetchData("/admin/bookings/payment-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: settings,
    });
    setState(response?.status === "success" ? "Payment instructions saved" : (response?.message || "Save failed"));
  };

  return (
    <details className="apb-settings">
      <summary>Payment instruction settings</summary>
      <div className="apb-settings__grid">
        {(settings.methods || []).map((method, index) => (
          <fieldset key={method.code || index}>
            <legend>{method.label || method.code}</legend>
            <label><input type="checkbox" checked={method.enabled !== false} onChange={(event) => updateMethod(index, "enabled", event.target.checked)} /> Enabled</label>
            <label>Label<input value={method.label || ""} onChange={(event) => updateMethod(index, "label", event.target.value)} /></label>
            {method.code === "UPI" && <label>UPI ID<input value={method.upiId || ""} onChange={(event) => updateMethod(index, "upiId", event.target.value)} /></label>}
            {method.code === "UPI" && <label>QR image URL<input value={method.qrImage || ""} onChange={(event) => updateMethod(index, "qrImage", event.target.value)} /></label>}
            {method.code === "BANK" && <label>Account holder<input value={method.accountHolder || ""} onChange={(event) => updateMethod(index, "accountHolder", event.target.value)} /></label>}
            {method.code === "BANK" && <label>Bank account<input value={method.bankAccount || ""} onChange={(event) => updateMethod(index, "bankAccount", event.target.value)} /></label>}
            {method.code === "BANK" && <label>Bank name<input value={method.bankName || ""} onChange={(event) => updateMethod(index, "bankName", event.target.value)} /></label>}
            {method.code === "BANK" && <label>IFSC<input value={method.ifsc || ""} onChange={(event) => updateMethod(index, "ifsc", event.target.value)} /></label>}
            <label>Instructions<textarea value={method.instructions || ""} onChange={(event) => updateMethod(index, "instructions", event.target.value)} /></label>
          </fieldset>
        ))}
      </div>
      <label>General instructions<textarea value={settings.instructions || ""} onChange={(event) => setSettings((current) => ({ ...current, instructions: event.target.value }))} /></label>
      <button type="button" onClick={save}>Save Settings</button>
      {state && <span className="apb-settings__state">{state}</span>}
    </details>
  );
}

export default function AdminPaymentsBookings({ bookings = [], loading, onViewBooking }) {
  const [filter, setFilter] = useState("ALL");
  const [downloadState, setDownloadState] = useState({ paymentId: "", error: "" });
  const filtered = useMemo(() => bookings.filter((booking) => {
    if (filter === "ALL") return true;
    if (filter === "VERIFICATION") return booking.paymentStatus === "TOKEN_VERIFICATION";
    return booking.status === filter;
  }), [bookings, filter]);

  const downloadProof = async (event, booking, proof) => {
    event.preventDefault();
    event.stopPropagation();
    const bookingId = booking.id || booking._id;
    const paymentId = proof.id || proof._id;
    setDownloadState({ paymentId, error: "" });
    try {
      await downloadPaymentProof(bookingId, paymentId);
      setDownloadState({ paymentId: "", error: "" });
    } catch (error) {
      setDownloadState({ paymentId: "", error: error?.message || "Proof download failed" });
    }
  };

  return (
    <div className="apb">
      <header>
        <div><h1>Bookings & Payments</h1><p>{filtered.length} booking{filtered.length === 1 ? "" : "s"}</p></div>
        <nav>
          {["ALL", "VERIFICATION", "AWAITING_TOKEN_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED"].map((status) => (
            <button key={status} className={filter === status ? "is-active" : ""} onClick={() => setFilter(status)}>{label(status)}</button>
          ))}
        </nav>
      </header>
      {downloadState.error ? <p className="apb__download-error" role="alert">{downloadState.error}</p> : null}
      <SettingsEditor />
      {loading ? <p>Loading bookings...</p> : (
        <div className="apb__table-wrap">
          <table>
            <thead><tr><th>Booking</th><th>Trip</th><th>Customer</th><th>Booking Status</th><th>Payment Status</th><th>Token</th><th>Proof</th><th>Submitted</th><th>Remaining</th></tr></thead>
            <tbody>
              {filtered.map((booking) => {
                const trip = booking.trip || booking.tour || {};
                const proof = (booking.payments || []).find((payment) => payment.status === "VERIFICATION" && ["TOKEN", "deposit"].includes(payment.type));
                return (
                  <tr key={booking.id || booking._id} onClick={() => onViewBooking?.(booking)}>
                    <td><strong>{booking.bookingRef}</strong><small>{new Date(booking.createdAt).toLocaleDateString("en-IN")}</small></td>
                    <td>{trip.title || trip.name || "Trip"}</td>
                    <td>{booking.primaryContact?.name || booking.user?.name || "—"}<small>{booking.primaryContact?.phone || booking.user?.phone || ""}</small></td>
                    <td><span>{label(booking.status)}</span></td>
                    <td><span className={booking.paymentStatus === "TOKEN_VERIFICATION" ? "is-review" : ""}>{label(booking.paymentStatus)}</span></td>
                    <td>{money(booking.tokenAmount, booking.priceSnapshot?.currency)}</td>
                    <td>{proof?.paymentScreenshot ? (
                      <button type="button" className="apb__proof-download" onClick={(event) => downloadProof(event, booking, proof)} disabled={downloadState.paymentId === (proof.id || proof._id)}>
                        {downloadState.paymentId === (proof.id || proof._id) ? "Downloading..." : "Download proof"}
                      </button>
                    ) : "—"}</td>
                    <td>{proof?.submittedAt ? new Date(proof.submittedAt).toLocaleString("en-IN") : "—"}</td>
                    <td>{money(booking.remainingAmount ?? booking.paymentSummary?.remaining, booking.priceSnapshot?.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && <p className="apb__empty">No bookings match this filter.</p>}
        </div>
      )}
    </div>
  );
}
