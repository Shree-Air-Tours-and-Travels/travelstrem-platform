import { useCallback, useState } from "react";
import { useEnquiryRealtime } from "@packages/trem-events";
import { fetchData, useRefreshOnActivation } from "@packages/trem-utils";

export default function useEnquiryBookings(journeyType = "") {
  const [state, setState] = useState({
    enquiries: [],
    bookings: [],
    view: {},
    loading: true,
    error: "",
  });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const response = await fetchData("/enquiries");
      if (response?.status !== "success") throw new Error(response?.message);
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
      setState((current) => ({
        ...current,
        loading: false,
        error: error?.message || "The booking enquiries could not be loaded.",
      }));
    }
  }, [journeyType]);

  useRefreshOnActivation(load, { resource: "enquiries" });
  useEnquiryRealtime(load);

  return { ...state, load };
}
