import { useCallback, useEffect, useRef, useState } from "react";
import { useEnquiryRealtime } from "@packages/trem-events";
import { fetchData } from "@packages/trem-utils";

export default function useEnquiryBookings(journeyType = "") {
  const requestRef = useRef(0);
  const pendingRef = useRef(null);
  const inFlightRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const [filters, setFilters] = useState({});
  const [state, setState] = useState({
    enquiries: [],
    bookings: [],
    view: {},
    loading: true,
    error: "",
  });

  const fetchRecords = useCallback(async () => {
    const requestId = ++requestRef.current;
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const response = await fetchData("/enquiries", { params: Object.fromEntries(Object.entries({ ...filters, journeyType }).map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : value])) });
      if (response?.status !== "success") throw new Error(response?.message);
      if (requestId !== requestRef.current) return;
      const component = response.componentData || {};
      const records = Array.isArray(component.data) ? component.data : [];
      const visibleRecords = journeyType
        ? records.filter((item) => item.journeyType === journeyType)
        : records;
      setState({
        enquiries: visibleRecords.filter((item) => item.recordType !== "booking"),
        bookings: visibleRecords.filter((item) => item.recordType === "booking"),
        view: component,
        loading: false,
        error: "",
      });
    } catch (error) {
      if (requestId !== requestRef.current) return;
      setState((current) => ({
        ...current,
        loading: false,
        error: error?.message || "The booking enquiries could not be loaded.",
      }));
    }
  }, [journeyType, filters]);

  // Collapse mutation callbacks and their realtime echoes into one trailing refresh.
  const load = useCallback(() => {
    if (!pendingRef.current) {
      let resolve;
      const promise = new Promise((done) => { resolve = done; });
      pendingRef.current = { promise, resolve };
    }
    clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      const pending = pendingRef.current;
      pendingRef.current = null;
      // A later event must run after an older request, never race it.
      if (inFlightRef.current) await inFlightRef.current;
      const request = fetchRecords();
      inFlightRef.current = request;
      await request;
      if (inFlightRef.current === request) inFlightRef.current = null;
      pending?.resolve();
    }, 150);
    return pendingRef.current.promise;
  }, [fetchRecords]);

  useEffect(() => {
    load();
    return () => {
      clearTimeout(refreshTimerRef.current);
      pendingRef.current?.resolve();
      pendingRef.current = null;
      requestRef.current += 1;
    };
  }, [load]);
  useEnquiryRealtime(load);

  return { ...state, load, filters, applyFilters: setFilters };
}
