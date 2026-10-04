import { useCallback, useEffect, useState, useRef } from "react";
import { fetchData, useRefreshOnActivation } from "@packages/trem-utils";
import { useEnquiryRealtime, useRealtimeEvent, REALTIME_EVENTS } from "@packages/trem-events";

export default function useDashboard(userId, product = "") {
  const requestId = useRef(0);
  const [state, setState] = useState({ loading: true, data: null, error: "", status: null });
  const load = useCallback(async () => {
    const id = ++requestId.current;

    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      // Tenant, products and permissions come exclusively from the authenticated backend.
      const response = await fetchData("/dashboard/home", { params: product ? { product } : {} });
      if (!response?.success || !response.data?.context)
        throw Object.assign(new Error(response?.message || "Dashboard could not be loaded."), {
          status: response?.httpStatus,
        });
      if (id !== requestId.current) return;
      setState({ loading: false, data: response.data, error: "", status: null });
    } catch (error) {
      if (id !== requestId.current) return;
      setState({
        loading: false,
        data: null,
        status: error?.response?.status || error?.status,
        error: error?.response?.data?.message || error.message || "Dashboard could not be loaded.",
      });
    }
  }, [userId, product]);
  useEffect(() => {
    setState({ loading: true, data: null, error: "", status: null });
    load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);
  useRefreshOnActivation(load, { enabled: true, refreshOnMount: false });
  useEnquiryRealtime(load);
  useRealtimeEvent(REALTIME_EVENTS.NOTIFICATION_CREATED, load);
  useRealtimeEvent(REALTIME_EVENTS.PAYMENT_SUCCESS, load);
  useRealtimeEvent(REALTIME_EVENTS.PAYMENT_REFUNDED, load);
  useRealtimeEvent(REALTIME_EVENTS.SUPPORT_TICKET_CREATED, load);
  useRealtimeEvent(REALTIME_EVENTS.SUPPORT_CONVERSATION_UPDATED, load);
  return { ...state, reload: load };
}
