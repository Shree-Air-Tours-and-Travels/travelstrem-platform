import React, { useCallback, useState } from "react";
import { EnquiryCenter } from "@packages/trem-ui";
import { useEnquiryRealtime } from "@packages/trem-events";
import { fetchData, useRefreshOnActivation } from "@packages/trem-utils";

export default function EnquiriesPage() {
  const [state, setState] = useState({
    enquiries: [],
    view: {},
    loading: true,
    error: "",
  });
  const [selectedId, setSelectedId] = useState("");

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const response = await fetchData("/enquiries");
      if (response?.status !== "success") throw new Error(response?.message);
      const component = response.componentData || {};
      setState({
        enquiries: Array.isArray(component.data) ? component.data : [],
        view: component,
        loading: false,
        error: "",
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error?.message,
      }));
    }
  }, []);

  useRefreshOnActivation(load, { resource: "enquiries" });
  useEnquiryRealtime(load);

  return (
    <EnquiryCenter
      title={state.view.title}
      description={state.view.description}
      view={state.view}
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
