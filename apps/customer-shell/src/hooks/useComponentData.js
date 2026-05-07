// src/hooks/useComponentData.js
import { useCallback, useEffect, useState } from "react";
import { fetchData } from "../utils/fetchData";

/**
 * useComponentData
 * - endpoint: string, e.g. "/hero" or "/tours/123"
 * - options: { auto: true|false, transform: fn(componentData) -> componentData }
 *
 * Returns: { loading, error, componentData, status, message, refetch }
 */
export default function useComponentData(endpoint, options = {}) {
    const { auto = true, transform = null } = options;

    const [state, setState] = useState({
        loading: !!auto,
        error: null,
        status: null,
        message: null,
        handler: null,
        componentData: {
            title: "",
            description: "",
            data: [],
            structure: {},
            config: {},
        },
    });

    const fetcher = useCallback(
        async (ep = endpoint) => {
            setState((s) => ({ ...s, loading: true, error: null }));
            try {
                const res = await fetchData(ep, options);

                // fetchData already returns { status, message, componentData } or error fallback
                const { status, message, componentData, handler } = res;
                console.log(componentData, "fetched componentData from", ep);

                // apply transform if provided              
                const finalComponentData = transform
                    ? transform(componentData || {
                        title: "",
                        description: "",
                        data: [],
                        structure: {},
                        config: {},
                    })
                    : componentData || {
                        title: "",
                        description: "",
                        data: [],
                        structure: {},
                        config: {},
                    };

                if (status === "success") {
                    setState({
                        loading: false,
                        error: null,
                        status,
                        message,
                        handler,
                        componentData: finalComponentData,
                    });
                } else {
                    setState({
                        loading: false,
                        error: message || "Failed to fetch",
                        status,
                        message,
                        handler,
                        componentData: finalComponentData,
                    });
                }
            } catch (err) {
                setState({
                    loading: false,
                    error: err.message || "Unknown error",
                    status: "error",
                    message: err.message || "Unknown error",
                    handler: null,
                    componentData: {
                        title: "",
                        description: "",
                        data: [],
                        structure: {},
                        config: {},
                    },
                });
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [endpoint, transform]
    );

    // auto fetch on mount if auto is true
    useEffect(() => {
        if (auto) fetcher();
    }, [fetcher, auto]);

    return {
        ...state,
        refetch: fetcher,
    };
}
