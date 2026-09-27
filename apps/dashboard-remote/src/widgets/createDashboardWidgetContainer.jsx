import "../views/shared/DashboardSkeleton.scss";
import React, { useEffect, useState } from "react";
import { NoDataFound } from "@packages/trem-ui";

export default function createDashboardWidgetContainer(View) {
  return function DashboardWidgetContainer({ widget, fetchWidgetData, refreshKey, ...viewProps }) {
    const endpoint = widget?.props?.endpoint;
    const [retryKey, setRetryKey] = useState(0);
    const [state, setState] = useState({ loading: true, data: null, error: "" });

    useEffect(() => {
      let active = true;
      setState((current) => ({ ...current, loading: true, error: "" }));
      if (!endpoint || typeof fetchWidgetData !== "function") {
        setState({ loading: false, data: null, error: "Widget data source is unavailable." });
        return undefined;
      }
      const controller = new AbortController();
      fetchWidgetData(endpoint, { signal: controller.signal })
        .then((response) => {
          if (!active) return;
          if (response?.status !== "success") throw new Error(response?.message || "Widget data is unavailable.");
          setState({ loading: false, data: response.component?.data || response.data || {}, error: "" });
        })
        .catch((error) => {
          if (active) setState({ loading: false, data: null, error: error?.message || "Widget data is unavailable." });
        });
      return () => { active = false; controller.abort(); };
    }, [endpoint, fetchWidgetData, refreshKey, retryKey]);

    if (state.loading && !state.data) return <div className="admin-overview__skeleton is-widget" role="status" aria-label={`Loading ${widget?.type || "widget"}`} />;
    if (state.error && !state.data) {
      return <NoDataFound title="Widget unavailable" description={state.error} actionLabel="Try again" onAction={() => setRetryKey((key) => key + 1)} compact />;
    }
    return <View widget={widget} data={state.data} {...viewProps} />;
  };
}
