import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_COMPONENT_DATA = {
  title: "",
  description: "",
  data: [],
  structure: {},
  config: {},
};

const responseCache = new Map();
const inflightRequests = new Map();
let componentDataFetcher = null;

export const setComponentDataFetcher = (fetcher) => {
  componentDataFetcher = fetcher;
};

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
  if (!componentDataFetcher) {
    throw new Error("Component data fetcher has not been configured.");
  }

  const method = (options.method || "GET").toUpperCase();
  const cacheable = method === "GET" && options.cache !== false;
  const key = getRequestKey(endpoint, options);

  if (cacheable && responseCache.has(key)) return responseCache.get(key);
  if (inflightRequests.has(key)) return inflightRequests.get(key);

  const request = componentDataFetcher(endpoint, options)
    .then((res) => {
      if (cacheable && res?.status === "success") responseCache.set(key, res);
      return res;
    })
    .finally(() => {
      inflightRequests.delete(key);
    });

  inflightRequests.set(key, request);
  return request;
};

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
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const res = await readComponentData(ep, optionsRef.current);
        const { status, message, componentData, handler } = res;
        const finalComponentData = transform
          ? transform(componentData || DEFAULT_COMPONENT_DATA)
          : componentData || DEFAULT_COMPONENT_DATA;

        setState({
          loading: false,
          error: status === "success" ? null : message || "Failed to fetch",
          status,
          message,
          handler,
          componentData: finalComponentData,
        });
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

  useEffect(() => {
    if (auto) fetcher();
  }, [fetcher, auto]);

  return {
    ...state,
    refetch: fetcher,
  };
}
