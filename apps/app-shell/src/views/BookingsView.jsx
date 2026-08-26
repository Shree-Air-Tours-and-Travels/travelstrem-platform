import React, { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  EnquiryCenter,
  InputField,
} from "@packages/trem-ui";
import { useEnquiryRealtime, useRealtimeStatus } from "@packages/trem-events";
import { fetchData, useRefreshOnActivation } from "@packages/trem-utils";
import "./BookingsView.scss";

export default function BookingsView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [enquiries, setEnquiries] = useState([]);
  const [view, setView] = useState({});
  const selectedId = searchParams.get("enquiry") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enquiryRef, setEnquiryRef] = useState("");
  const [claimState, setClaimState] = useState({ saving: false, message: "", error: false });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchData("/enquiries");
      if (response?.status !== "success") throw new Error(response?.message);
      const component = response.componentData || {};
      setEnquiries(Array.isArray(component.data) ? component.data : []);
      setView(component);
    } catch (loadError) {
      setError(loadError?.message);
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
      if (response?.status !== "success") throw new Error(response?.message);
      setClaimState({ saving: false, message: response.message, error: false });
      setEnquiryRef("");
      await load();
    } catch (claimError) {
      setClaimState({
        saving: false,
        message: claimError?.message,
        error: true,
      });
    }
  };

  const selectEnquiry = (item) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "bookings");
    next.set("enquiry", item.reference || item.enquiryRef || item.id);
    setSearchParams(next);
  };

  return (
    <div className="customer-enquiries">
      {!selectedId && view.claim ? (
        <form className="customer-enquiries__claim" onSubmit={claim}>
          <div>
            <h2>{view.claim.title}</h2>
            <p>{view.claim.description}</p>
          </div>
          <InputField
            label={view.claim.fieldLabel}
            value={enquiryRef}
            placeholder={view.claim.placeholder}
            onChange={setEnquiryRef}
          />
          <Button
            type="submit"
            primaryClassName="customer-enquiries__claim-submit"
            text={claimState.saving ? view.claim.submitting : view.claim.submit}
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
        title={view.title}
        description={view.description}
        view={view}
        enquiries={enquiries}
        selectedId={selectedId}
        loading={loading}
        error={error}
        onRetry={load}
        onSelect={selectEnquiry}
      />
    </div>
  );
}
