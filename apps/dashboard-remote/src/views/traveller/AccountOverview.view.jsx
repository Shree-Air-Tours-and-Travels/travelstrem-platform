import React, { useEffect, useState } from "react";
import { TravelOverview, TravelOverviewWidget, Preloader, ErrorState } from "@packages/trem-ui";
import { fetchData } from "@packages/trem-utils";

function OverviewWidget({ widget, manifest, product, period, refreshKey, onNavigate }) {
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    setState({ loading: true, data: null, error: "" });
    fetchData(widget.endpoint, {
      params: { period, ...(product ? { product } : {}) }, signal: controller.signal,
    })
      .then((response) => {
        if (!active) return;
        if (response?.status !== "success")
          throw new Error(response?.message || manifest.errorTitle);
        setState({ loading: false, data: response.data, error: "" });
      })
      .catch((error) => {
        if (active) setState({ loading: false, data: null, error: error.message });
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [widget.endpoint, manifest, product, period, refreshKey, retry]);
  if (state.loading)
    return (
      <Preloader
        variant={
          widget.id === "analytics"
            ? "dashboardAnalytics"
            : widget.id === "services"
              ? "dashboardServices"
              : "dashboardWidget"
        }
        count={widget.id === "services" ? 4 : 3}
        label={widget.title}
      />
    );
  if (state.error)
    return (
      <ErrorState
        title={manifest.errorTitle}
        description={state.error}
        retryText={manifest.retryLabel}
        retry={() => setRetry((value) => value + 1)}
      />
    );
  return <TravelOverviewWidget data={state.data} onNavigate={onNavigate} />;
}

export default function AccountOverviewView({ data, product, onNavigate, onRefresh }) {
  const [period, setPeriod] = useState(data.period.value);
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <TravelOverview
      data={data}
      period={period}
      onPeriodChange={setPeriod}
      onRefresh={() => {
        setRefreshKey((value) => value + 1);
        onRefresh();
      }}
      renderWidget={(widget) => (
        <OverviewWidget
          widget={widget}
          manifest={data}
          product={product}
          period={widget.id === "analytics" ? period : data.period.value}
          refreshKey={refreshKey}
          onNavigate={onNavigate}
        />
      )}
    />
  );
}
