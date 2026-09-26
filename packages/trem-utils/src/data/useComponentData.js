import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_COMPONENT_DATA = {
  title: "",
  description: "",
  data: [],
  structure: {},
  config: {},
};

const DEFAULT_PAGE_COMPONENT = {
  data: {},
  dataScope: { options: {} },
  elements: { labels: {}, urls: {} },
  structure: { header: {}, widgets: [], config: {}, actions: [] },
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
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
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

const resolveNode = (value, labels, urls, options) => {
  if (Array.isArray(value)) return value.map((item) => resolveNode(item, labels, urls, options));
  if (!value || typeof value !== "object") return value;

  return Object.entries(value).reduce((acc, [key, child]) => {
    if (typeof child === "string" && key.endsWith("Ref") && key !== "iconRef") {
      const targetKey = key.slice(0, -3);
      const source =
        key === "optionsRef" ? options : key.toLowerCase().includes("url") ? urls : labels;
      acc[targetKey] = source[child] ?? child;
      acc[key] = child;
      return acc;
    }
    acc[key] = resolveNode(child, labels, urls, options);
    return acc;
  }, {});
};

export const buildResolvedView = (component = DEFAULT_PAGE_COMPONENT) => {
  const labels = component?.elements?.labels || {};
  const urls = component?.elements?.urls || {};
  const options = component?.dataScope?.options || {};
  return {
    structure: component?.structure || {},
    elements: { labels, urls },
    dataScope: { options },
    data: component?.data || DEFAULT_PAGE_COMPONENT.data,
    resolvedView: {
      ...component?.data,
      structure: resolveNode(component?.structure || {}, labels, urls, options),
      elements: { labels, urls },
      dataScope: { options },
    },
  };
};

const toLegacyComponentData = (component) => {
  if (!component) return DEFAULT_COMPONENT_DATA;
  const view = buildResolvedView(component);
  const hero = view.resolvedView.structure?.widgets?.find((widget) => widget.type === "Hero");
  if (hero) {
    const props = hero.props || {};
    return {
      title: component.data?.title || "",
      description: component.data?.description || "",
      data: component.data || {},
      structure: {
        eyebrow: props.title,
        highlight: props.highlight,
        buttonText: props.buttonText,
        secondaryButtonText: props.secondaryButtonText,
        featuredDestination: {
          label: props.featuredDestinationLabel,
          title: props.featuredDestinationTitle,
        },
        stats: props.stats || [],
        visual: {
          headline: props.visualHeadline,
          subline: props.visualSubline,
          orbitItems: props.orbitItems || [],
          gallery: props.gallery || [],
        },
      },
      config: {},
    };
  }
  const widgets = view.resolvedView.structure?.widgets || [];
  if (widgets.length === 1) {
    const [widget] = widgets;
    return {
      ...component.data,
      data: component.data,
      structure: {
        ...(widget.props || {}),
        actions: view.resolvedView.structure?.actions || [],
      },
      elements: view.elements,
      config: {
        options: view.dataScope.options,
      },
    };
  }
  return {
    ...component.data,
    data: component.data,
    structure: view.resolvedView.structure,
    elements: view.elements,
    config: {},
  };
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
    structure: DEFAULT_PAGE_COMPONENT.structure,
    elements: DEFAULT_PAGE_COMPONENT.elements,
    dataScope: DEFAULT_PAGE_COMPONENT.dataScope,
    data: DEFAULT_PAGE_COMPONENT.data,
    resolvedView: buildResolvedView().resolvedView,
  });

  const fetcher = useCallback(
    async (ep = endpoint) => {
      if (!requestKey) return;
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const res = await readComponentData(ep, optionsRef.current);
        const { status, message, componentData, component, handler } = res;
        const pageView = buildResolvedView(component || DEFAULT_PAGE_COMPONENT);
        const finalComponentData = transform
          ? transform(componentData || toLegacyComponentData(component))
          : componentData || toLegacyComponentData(component);

        setState({
          loading: false,
          error: status === "success" ? null : message || "Failed to fetch",
          status,
          message,
          handler,
          componentData: finalComponentData,
          ...pageView,
        });
      } catch (err) {
        setState({
          loading: false,
          error: err.message || "Unknown error",
          status: "error",
          message: err.message || "Unknown error",
          handler: null,
          componentData: DEFAULT_COMPONENT_DATA,
          structure: DEFAULT_PAGE_COMPONENT.structure,
          elements: DEFAULT_PAGE_COMPONENT.elements,
          dataScope: DEFAULT_PAGE_COMPONENT.dataScope,
          data: DEFAULT_PAGE_COMPONENT.data,
          resolvedView: buildResolvedView().resolvedView,
        });
      }
    },
    [endpoint, requestKey, transform],
  );

  useEffect(() => {
    if (auto) fetcher();
  }, [fetcher, auto]);

  return {
    ...state,
    refetch: fetcher,
  };
}
