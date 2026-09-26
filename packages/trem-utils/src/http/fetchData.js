import axios from "axios";
import { showRealtimeToast } from "@packages/trem-events";

const normalizeBase = (raw) => {
  if (raw == null || raw === "") return raw;
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
  return `https://${raw}`.replace(/\/$/, "");
};

const createDefaultApi = () => {
  const configuredApiUrl = process.env.REACT_APP_API_URL;
  const configuredBackendUrl = process.env.REACT_APP_BACKEND_URL;
  const normalized = normalizeBase(configuredApiUrl || configuredBackendUrl || "") ?? "";
  const baseURL = (normalized.endsWith("/api") ? normalized : `${normalized}/api`).replace(
    /([^:]\/)\/+/g,
    "$1",
  );
  return axios.create({
    baseURL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });
};

let apiClient = createDefaultApi();

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("USER_LOGOUT", { detail: { reason: "unauthorized" } }));
    }
    return Promise.reject(error);
  },
);

export const setFetchDataApiClient = (api) => {
  apiClient = api || apiClient;
};

const attachStoredUser = (method, params, body) => {
  return { finalParams: params, finalBody: body };
};

export const fetchData = async (endpoint, options = {}) => {
  const { method = "GET", body = null, headers = {}, params = {}, signal } = options;
  const methodUpper = method.toUpperCase();

  const { finalParams, finalBody } = attachStoredUser(methodUpper, { ...(params || {}) }, body);

  try {
    let res;
    const config = { params: finalParams, headers, signal };
    const hasBody = finalBody !== null && finalBody !== undefined;
    if (methodUpper === "GET") {
      res = await apiClient.get(endpoint, config);
    } else if (methodUpper === "POST") {
      res = await apiClient.post(endpoint, hasBody ? finalBody : undefined, config);
    } else if (methodUpper === "PUT") {
      res = await apiClient.put(endpoint, hasBody ? finalBody : undefined, config);
    } else if (methodUpper === "PATCH") {
      res = await apiClient.patch(endpoint, hasBody ? finalBody : undefined, config);
    } else if (methodUpper === "DELETE") {
      res = await apiClient.delete(endpoint, { ...config, data: hasBody ? finalBody : undefined });
    } else {
      res = await apiClient.request({
        url: endpoint,
        method: methodUpper,
        data: hasBody ? finalBody : undefined,
        ...config,
      });
    }

    const rawResponse = res?.data || {};
    if (rawResponse?.notify) showRealtimeToast(rawResponse.notify);
    const { status, message, componentData, component } = rawResponse;
    // Newer domain endpoints return their payload directly at `data`, while
    // legacy component endpoints wrap it in `componentData.data` or
    // `component.data`. Preserve the direct payload instead of replacing it
    // with null during normalization.
    const data = componentData?.data ?? component?.data ?? rawResponse?.data ?? null;

    if (status === "success") {
      return { ...rawResponse, status, message, componentData, component, data };
    }

    return {
      status: "error",
      message: message || "Something went wrong",
      component,
      componentData: componentData || {
        title: "",
        description: "",
        data: [],
        structure: {},
        config: {},
      },
      data: null,
    };
  } catch (err) {
    if (axios.isCancel(err)) {
      return { status: "cancelled", message: "Request cancelled", data: null };
    }
    return {
      status: "error",
      message: err?.response?.data?.message || err.message || "Network error",
      component: err?.response?.data?.component,
      componentData: err?.response?.data?.componentData || {
        title: "",
        description: "",
        data: [],
        structure: {},
        config: {},
      },
      data: null,
    };
  }
};

export const fetchBinary = async (endpoint, options = {}) => {
  const { method = "GET", body = null, headers = {}, signal } = options;
  try {
    const response = await apiClient.request({
      url: endpoint,
      method: method.toUpperCase(),
      data: body ?? undefined,
      headers,
      signal,
      responseType: "blob",
    });
    return {
      status: "success",
      data: response.data,
      contentType: response.headers?.["content-type"] || "application/octet-stream",
      disposition: response.headers?.["content-disposition"] || "",
    };
  } catch (error) {
    let message = error?.message || "The file could not be loaded.";
    const payload = error?.response?.data;
    if (payload instanceof Blob) {
      try {
        const parsed = JSON.parse(await payload.text());
        message = parsed?.message || message;
      } catch {}
    }
    return { status: "error", message, data: null };
  }
};

export default fetchData;
