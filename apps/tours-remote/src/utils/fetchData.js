// src/utils/fetchData.js
import api from "./api";

/**
 * Robust fetchData wrapper with debug logging of Authorization header.
 *
 * - Reads configured token key (auth_token_key_name) or falls back to token/auth_token.
 * - Ensures axios default Authorization header is set if token exists.
 * - Logs the Authorization header before each request and exposes it on window.__lastFetchAuthHeader.
 * - Returns normalized { status, message, componentData } shape used by your frontend.
 */

const readTokenFromStorage = () => {
  try {
    const configuredKey = localStorage.getItem("auth_token_key_name");
    if (configuredKey) {
      const t = localStorage.getItem(configuredKey);
      if (t) return t;
    }
    return localStorage.getItem("token") || localStorage.getItem("auth_token") || null;
  } catch (e) {
    return null;
  }
};

const readAuthUserFromStorage = () => {
  try {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

const ensureAuthHeader = () => {
  try {
    if (!api.defaults) api.defaults = {};
    if (!api.defaults.headers) api.defaults.headers = { common: {} };
    if (!api.defaults.headers.common || !api.defaults.headers.common.Authorization) {
      const token = readTokenFromStorage();
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch (e) {
    // swallow
  }
};

/**
 * Log header into console and expose it on window for debugging.
 */
const exposeAuthHeaderForDebug = () => {
  try {
    const header = (api.defaults && api.defaults.headers && api.defaults.headers.common && api.defaults.headers.common.Authorization) || null;
    window.__lastFetchAuthHeader = header;
    if (header) {
      // make the log conspicuous but non-verbose
      console.debug("[fetchData] Authorization header (sent):", header ? `${header.slice(0, 40)}...` : null);
    } else {
      console.debug("[fetchData] No Authorization header present.");
    }
  } catch (e) {
    // ignore
  }
};

export const fetchData = async (endpoint, options = {}) => {
  const { method = "GET", body = null, headers = {}, params = {} } = options;

  // Ensure header exists if token present
  ensureAuthHeader();
  // expose header for debugging
  exposeAuthHeaderForDebug();

  const methodUpper = (method || "GET").toUpperCase();

  // Copy params/body so we don't mutate caller values
  let finalParams = { ...(params || {}) };
  let finalBody = body;

  // Attach user fallback (non-invasive): inject user into JSON bodies if not present (dev convenience)
  const storedUser = readAuthUserFromStorage();
  if (storedUser) {
    try {
      if (methodUpper === "GET") {
        if (!finalParams.userId && (storedUser.id || storedUser._id)) finalParams.userId = storedUser.id || storedUser._id;
        if (!finalParams.userRole && storedUser.role) finalParams.userRole = storedUser.role;
      } else {
        if (!finalBody) {
          finalBody = JSON.stringify({ user: { id: storedUser.id || storedUser._id, role: storedUser.role } });
        } else if (typeof finalBody === "string") {
          try {
            const parsed = JSON.parse(finalBody);
            if (!parsed.user) parsed.user = { id: storedUser.id || storedUser._id, role: storedUser.role };
            finalBody = JSON.stringify(parsed);
          } catch (e) {
            // body not JSON (FormData, etc.) — don't mutate
          }
        } else if (typeof finalBody === "object" && !(finalBody instanceof FormData)) {
          if (!finalBody.user) finalBody.user = { id: storedUser.id || storedUser._id, role: storedUser.role };
          finalBody = JSON.stringify(finalBody);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  try {
    let res;
    if (methodUpper === "GET") {
      res = await api.get(endpoint, { params: finalParams, headers });
    } else if (methodUpper === "POST") {
      res = await api.post(endpoint, finalBody, { params: finalParams, headers });
    } else if (methodUpper === "PUT") {
      res = await api.put(endpoint, finalBody, { params: finalParams, headers });
    } else if (methodUpper === "PATCH") {
      res = await api.patch(endpoint, finalBody, { params: finalParams, headers });
    } else if (methodUpper === "DELETE") {
      res = await api.delete(endpoint, { data: finalBody, params: finalParams, headers });
    } else {
      if (api.request) {
        res = await api.request({ url: endpoint, method: methodUpper, data: finalBody, params: finalParams, headers });
      } else {
        throw new Error(`Unsupported method: ${method}`);
      }
    }

    const { status, message, componentData } = res?.data || {};
    if (status === "success") return { status, message, componentData };

    return {
      status: "error",
      message: message || "Something went wrong",
      componentData: componentData || {
        title: "",
        description: "",
        data: [],
        structure: {},
        config: {},
      },
    };
  } catch (err) {
    const serverMsg = err?.response?.data?.message || err.message || "Network error";
    const serverComponentData = err?.response?.data?.componentData;
    // also expose server error details in console for dev clarity
    console.debug("[fetchData] request failed:", serverMsg);
    return {
      status: "error",
      message: serverMsg,
      componentData: serverComponentData || {
        title: "",
        description: "",
        data: [],
        structure: {},
        config: {},
      },
    };
  }
};

export default fetchData;
