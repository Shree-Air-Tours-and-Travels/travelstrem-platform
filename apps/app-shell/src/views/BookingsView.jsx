import React, { useCallback, useState } from "react";
import {
  Button,
  EnquiryCenter,
  InputField,
  useEnquiryRealtime,
  useRealtimeStatus,
} from "@packages/trem-ui";
import { fetchData, useRefreshOnActivation } from "@packages/trem-utils";
import "./BookingsView.scss";

export default function BookingsView() {
  const [enquiries, setEnquiries] = useState([]);
  const [meta, setMeta] = useState({
    title: "My bookings & enquiries",
    description: "Requests you have sent and bookings confirmed for your account.",
  });
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enquiryRef, setEnquiryRef] = useState("");
  const [claimState, setClaimState] = useState({ saving: false, message: "", error: false });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchData("/enquiries");
      if (response?.status !== "success")
        throw new Error(response?.message || "Failed to load enquiries.");
      const component = response.componentData || {};
      setEnquiries(Array.isArray(component.data) ? component.data : []);
      setMeta({
        title: component.title || "My bookings & enquiries",
        description: component.description || "",
      });
    } catch (loadError) {
      setError(loadError?.message || "Failed to load enquiries.");
    } finally {
      setLoading(false);
    }
  }, []);

  // The socket is the single source of updates while connected; focus/
  // tab-activation refetches only run as a realtime fallback. Data-changed
  // events (enquiry submitted/claimed in this tab) always refresh.
  const { isConnected } = useRealtimeStatus();
  useRefreshOnActivation(load, { resource: "enquiries", activationEnabled: !isConnected });
  useEnquiryRealtime(load);

  const claim = async (event) => {
    event.preventDefault();
    if (!enquiryRef.trim()) return;
    setClaimState({ saving: true, message: "", error: false });
    try {
      const response = await fetchData("/enquiries/claim", {
        method: "POST",
        body: { enquiryRef: enquiryRef.trim() },
      });
      if (response?.status !== "success")
        throw new Error(response?.message || "Could not add enquiry.");
      setClaimState({ saving: false, message: response.message || "Enquiry added.", error: false });
      setEnquiryRef("");
      await load();
    } catch (claimError) {
      setClaimState({
        saving: false,
        message: claimError?.message || "Could not add enquiry.",
        error: true,
      });
    }
  };

  return (
    <div className="customer-enquiries">
      {!selectedId ? (
        <form className="customer-enquiries__claim" onSubmit={claim}>
          <div>
            <h2>Add an enquiry</h2>
            <p>Submitted before signing in? Enter the enquiry ID from your confirmation email.</p>
          </div>
          <InputField
            label="Enquiry ID"
            value={enquiryRef}
            placeholder="ENQ-ABC123"
            onChange={setEnquiryRef}
          />
          <Button
            type="submit"
            text={claimState.saving ? "Adding…" : "Add enquiry"}
            disabled={claimState.saving || !enquiryRef.trim()}
          />
          {claimState.message ? (
            <p className={claimState.error ? "is-error" : "is-success"} role="status">
              {claimState.message}
            </p>
          ) : null}
        </form>
      ) : null}
      <EnquiryCenter
        {...meta}
        enquiries={enquiries}
        selectedId={selectedId}
        loading={loading}
        error={error}
        onRetry={load}
        onSelect={(item) => setSelectedId(item.id)}
        onBack={() => setSelectedId("")}
      />
    </div>
  );
}
