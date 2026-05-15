import axios from "axios";

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

export const setFetchDataApiClient = (api) => {
  apiClient = api || apiClient;
};

const readTokenFromStorage = () => {
  try {
    const configuredKey = localStorage.getItem("auth_token_key_name");
    if (configuredKey) {
      const token = localStorage.getItem(configuredKey);
      if (token) return token;
    }
    return localStorage.getItem("token") || localStorage.getItem("auth_token") || null;
  } catch (err) {
    return null;
  }
};

const readAuthUserFromStorage = () => {
  try {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

const ensureAuthHeader = () => {
  const token = readTokenFromStorage();
  if (!token) return;
  apiClient.defaults.headers = apiClient.defaults.headers || {};
  apiClient.defaults.headers.common = apiClient.defaults.headers.common || {};
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
};

const exposeAuthHeaderForDebug = () => {
  try {
    window.__lastFetchAuthHeader = apiClient.defaults?.headers?.common?.Authorization || null;
  } catch (err) {
    // no-op outside browser contexts
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
  const { method = "GET", body = null, headers = {}, params = {} } = options;
  const methodUpper = method.toUpperCase();
  ensureAuthHeader();
  exposeAuthHeaderForDebug();

  const { finalParams, finalBody } = attachStoredUser(methodUpper, { ...(params || {}) }, body);

  try {
    let res;
    if (methodUpper === "GET") {
      res = await apiClient.get(endpoint, { params: finalParams, headers });
    } else if (methodUpper === "POST") {
      res = await apiClient.post(endpoint, finalBody, { params: finalParams, headers });
    } else if (methodUpper === "PUT") {
      res = await apiClient.put(endpoint, finalBody, { params: finalParams, headers });
    } else if (methodUpper === "PATCH") {
      res = await apiClient.patch(endpoint, finalBody, { params: finalParams, headers });
    } else if (methodUpper === "DELETE") {
      res = await apiClient.delete(endpoint, { data: finalBody, params: finalParams, headers });
    } else {
      res = await apiClient.request({ url: endpoint, method: methodUpper, data: finalBody, params: finalParams, headers });
    }

    const { status, message, componentData, component } = res?.data || {};
    if (status === "success") return { status, message, componentData, component };

    return {
      status: "error",
      message: message || "Something went wrong",
      component,
      componentData: componentData || { title: "", description: "", data: [], structure: {}, config: {} },
    };
  } catch (err) {
    return {
      status: "error",
      message: err?.response?.data?.message || err.message || "Network error",
      component: err?.response?.data?.component,
      componentData: err?.response?.data?.componentData || { title: "", description: "", data: [], structure: {}, config: {} },
    };
  }
};

export default fetchData;
