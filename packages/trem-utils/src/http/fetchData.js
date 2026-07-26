import axios from "axios";
import { tokenStore } from "./tokenStore.js";

const normalizeBase = (raw) => {
  if (raw == null || raw === "") return raw;
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
  return `https://${raw}`.replace(/\/$/, "");
};

const createDefaultApi = () => {
  const normalized = normalizeBase(process.env.REACT_APP_API_URL || "") ?? "";
  const baseURL = (normalized.endsWith("/api") ? normalized : `${normalized}/api`).replace(/([^:]\/)\/+/g, "$1");
  return axios.create({
    baseURL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });
};

let apiClient = createDefaultApi();

// ── Request interceptor: attach Bearer token ──────────────────────
apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── 401 interceptor: refresh token and retry once ─────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for auth endpoints themselves or if already retried
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (!token) return Promise.reject(error);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      }).catch(() => Promise.reject(error));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // The httpOnly refresh-token cookie is sent automatically with withCredentials: true
      const { data } = await apiClient.post("/auth/refresh");
      const newToken = data?.token;
      if (newToken) {
        tokenStore.set(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
      // No token in response — refresh cookie may still be valid
      processQueue(error);
      return Promise.reject(error);
    } catch (refreshError) {
      tokenStore.clear();
      processQueue(error);
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export const setFetchDataApiClient = (api) => {
  apiClient = api || apiClient;
};

const readAuthUserFromStorage = () => {
  try {
    const prefix = typeof window !== "undefined" ? window.__TREM_AUTH_STORAGE_PREFIX__ : "";
    const raw = prefix ? localStorage.getItem(`${prefix}:auth_user`) : localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

const attachStoredUser = (method, params, body) => {
  const storedUser = readAuthUserFromStorage();
  if (!storedUser) return { finalParams: params, finalBody: body };

  const user = { id: storedUser.id || storedUser._id, role: storedUser.role };
  if (method === "GET") {
    return {
      finalParams: {
        ...params,
        ...(params.userId ? {} : { userId: user.id }),
        ...(params.userRole ? {} : { userRole: user.role }),
      },
      finalBody: body,
    };
  }

  if (!body) return { finalParams: params, finalBody: JSON.stringify({ user }) };
  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      if (!parsed.user) parsed.user = user;
      return { finalParams: params, finalBody: JSON.stringify(parsed) };
    } catch (err) {
      return { finalParams: params, finalBody: body };
    }
  }
  if (typeof body === "object" && !(body instanceof FormData)) {
    return { finalParams: params, finalBody: JSON.stringify({ ...body, user: body.user || user }) };
  }
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
      res = await apiClient.request({ url: endpoint, method: methodUpper, data: hasBody ? finalBody : undefined, ...config });
    }

    const { status, message, componentData, component } = res?.data || {};
    const data = componentData?.data ?? component?.data ?? null;

    // Auto-capture token from auth responses
    if (res?.data?.token) {
      tokenStore.set(res.data.token);
    }

    if (status === "success") return { status, message, componentData, component, data };

    return {
      status: "error",
      message: message || "Something went wrong",
      component,
      componentData: componentData || { title: "", description: "", data: [], structure: {}, config: {} },
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
      componentData: err?.response?.data?.componentData || { title: "", description: "", data: [], structure: {}, config: {} },
      data: null,
    };
  }
};

export default fetchData;
