import { useCallback, useState } from "react";
import { useEnquiryRealtime } from "@packages/trem-events";
import { fetchData, useRefreshOnActivation } from "@packages/trem-utils";

export default function useEnquiryBookings(journeyType = "") {
  const [state, setState] = useState({ enquiries: [], view: {}, loading: true, error: "" });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const response = await fetchData("/enquiries");
      if (response?.status !== "success") throw new Error(response?.message);
      const component = response.componentData || {};
      const enquiries = Array.isArray(component.data) ? component.data : [];
      setState({
        enquiries: journeyType
          ? enquiries.filter((item) => item.journeyType === journeyType)
          : enquiries,
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
