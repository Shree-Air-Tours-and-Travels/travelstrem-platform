import { useEffect, useState } from "react";
import { fetchData } from "@packages/trem-utils";
import { useProductDetailContext } from "../context/ProductDetailContext.js";

export default function useTourDetailWidget(productRef, widgetFile, query = {}) {
    const { apiPrefix } = useProductDetailContext();
    const queryKey = JSON.stringify(query || {});
    const [state, setState] = useState({
        loading: Boolean(productRef && widgetFile),
        error: null,
        widgetData: null,
    });

    useEffect(() => {
        if (!productRef || !widgetFile) {
            setState({ loading: false, error: "Missing product reference", widgetData: null });
            return undefined;
        }

        const abortController = new AbortController();
        setState((current) => ({ ...current, loading: true, error: null }));

        (async () => {
            const search = new URLSearchParams(Object.entries(JSON.parse(queryKey)).filter(([, value]) => value !== "" && value != null)).toString();
            const endpoint = `${apiPrefix}/${encodeURIComponent(productRef)}/widgets/${widgetFile}${search ? `?${search}` : ""}`;
            const res = await fetchData(endpoint, { signal: abortController.signal });
            if (abortController.signal.aborted) return;

            if (res?.status === "success" && res.component) {
                setState({ loading: false, error: null, widgetData: res.component });
                return;
            }

            setState({
                loading: false,
                error: res?.message || "Widget data could not load",
                widgetData: res?.component || null,
            });
        })();

        return () => {
            abortController.abort();
        };
    }, [productRef, widgetFile, apiPrefix, queryKey]);

    return state;
}
