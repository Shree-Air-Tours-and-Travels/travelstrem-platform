import { useCallback, useEffect, useRef, useState } from "react";
import { useEnquiryRealtime } from "@packages/trem-events";
import { fetchData, useRefreshOnActivation } from "@packages/trem-utils";

export default function useEnquiryBookings(journeyType = "") {
  const requestRef = useRef(0);
  const [filters, setFilters] = useState({});
  const [state, setState] = useState({
    enquiries: [],
    bookings: [],
    view: {},
    loading: true,
    error: "",
  });

  const load = useCallback(async () => {
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

  useEffect(() => { load(); return () => { requestRef.current += 1; }; }, [load]);
  useRefreshOnActivation(load, { resource: "enquiries", refreshOnMount: false });
  useEnquiryRealtime(load);

  return { ...state, load, filters, applyFilters: setFilters };
}
