import React, { useCallback, useState } from "react";
import { EnquiryCenter, useEnquiryRealtime, useRealtimeStatus } from "@packages/trem-ui";
import { fetchData, useRefreshOnActivation } from "@packages/trem-utils";

export default function EnquiriesPage() {
  const [state, setState] = useState({
    enquiries: [],
    title: "Bookings & enquiries received",
    description: "Requests received from travellers and their confirmed bookings.",
    loading: true,
    error: "",
  });
  const [selectedId, setSelectedId] = useState("");

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const response = await fetchData("/enquiries");
      if (response?.status !== "success")
        throw new Error(response?.message || "Failed to load enquiries.");
      const component = response.componentData || {};
      setState({
        enquiries: Array.isArray(component.data) ? component.data : [],
        title: component.title,
        description: component.description,
        loading: false,
        error: "",
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error?.message || "Failed to load enquiries.",
      }));
    }
  }, []);

  // Live inbox: the socket is the single source of updates while connected.
  const { isConnected } = useRealtimeStatus();
  // Focus/tab-activation refetches run only as a fallback when realtime is
  // down; data-changed events (real enquiry created in this tab) always load.
  useRefreshOnActivation(load, { resource: "enquiries", activationEnabled: !isConnected });
  useEnquiryRealtime(load);

  return (
    <EnquiryCenter
      title={state.title}
      description={state.description}
      enquiries={state.enquiries}
      selectedId={selectedId}
      loading={state.loading}
      error={state.error}
      onRetry={load}
      onSelect={(item) => setSelectedId(item.id)}
      onBack={() => setSelectedId("")}
    />
  );
}
