// src/hooks/useComponentData.js
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchData } from "../utils/fetchData";

const DEFAULT_COMPONENT_DATA = {
    title: "",
    description: "",
    data: [],
    structure: {},
    config: {},
};

const responseCache = new Map();
const inflightRequests = new Map();

const stableStringify = (value) => {
    if (!value || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
};

const getRequestKey = (endpoint, options = {}) => {
    const method = (options.method || "GET").toUpperCase();
    return stableStringify({
        endpoint,
        method,
        params: options.params || {},
        body: options.body || null,
    });
};

const readComponentData = async (endpoint, options) => {
    const method = (options.method || "GET").toUpperCase();
    const cacheable = method === "GET" && options.cache !== false;
    const key = getRequestKey(endpoint, options);

    if (cacheable && responseCache.has(key)) return responseCache.get(key);
    if (inflightRequests.has(key)) return inflightRequests.get(key);

    const request = fetchData(endpoint, options).then((res) => {
        if (cacheable && res?.status === "success") responseCache.set(key, res);
        return res;
    }).finally(() => {
        inflightRequests.delete(key);
    });

    inflightRequests.set(key, request);
    return request;
};

/**
 * useComponentData
 * - endpoint: string, e.g. "/hero" or "/tours/123"
 * - options: { auto: true|false, transform: fn(componentData) -> componentData }
 *
 * Returns: { loading, error, componentData, status, message, refetch }
 */
export default function useComponentData(endpoint, options = {}) {
    const { auto = true, transform = null } = options;
    const requestKey = getRequestKey(endpoint, options);
    const optionsRef = useRef(options);

    useEffect(() => {
        optionsRef.current = options;
    }, [requestKey, options]);

    const [state, setState] = useState({
        loading: !!auto,
        error: null,
        status: null,
        message: null,
        handler: null,
        componentData: DEFAULT_COMPONENT_DATA,
    });

    const fetcher = useCallback(
        async (ep = endpoint) => {
            if (!requestKey) return;
            setState((s) => ({ ...s, loading: true, error: null }));
            try {
                const res = await readComponentData(ep, optionsRef.current);

                const { status, message, componentData, handler } = res;

                const finalComponentData = transform
                    ? transform(componentData || DEFAULT_COMPONENT_DATA)
                    : componentData || DEFAULT_COMPONENT_DATA;

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
                    componentData: DEFAULT_COMPONENT_DATA,
                });
            }
        },
        [endpoint, requestKey, transform]
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
