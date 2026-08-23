import { useEffect, useState } from "react";
import { fetchData } from "@packages/trem-utils";

export default function useTourDetailWidget(tourRef, widgetFile) {
    const [state, setState] = useState({
        loading: Boolean(tourRef && widgetFile),
        error: null,
        widgetData: null,
    });

    useEffect(() => {
        if (!tourRef || !widgetFile) {
            setState({ loading: false, error: "Missing tour reference", widgetData: null });
            return undefined;
        }

        let cancelled = false;
        setState((current) => ({ ...current, loading: true, error: null }));

        (async () => {
            const endpoint = `/tours.json/${encodeURIComponent(tourRef)}/widgets/${widgetFile}`;
            const res = await fetchData(endpoint);
            if (cancelled) return;

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
            cancelled = true;
        };
    }, [tourRef, widgetFile]);

    return state;
}
