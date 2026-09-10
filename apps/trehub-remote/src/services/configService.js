const normalizeApiBase = (raw) => {
  const base = String(raw || "/api").replace(/\/$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
};

export const API_BASE = normalizeApiBase(process.env.REACT_APP_API_URL);

export const readComponentData = async (path, params = {}) => {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.message || "This request could not be completed.");
    error.code = payload?.code;
    error.details = payload?.details;
    error.status = response.status;
    throw error;
  }
  return payload;
};

export const createComponentData = async (path, body = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload?.message || `Trehub request failed: ${path}`);
    error.code = payload?.code;
    error.details = payload?.details;
    throw error;
  }
  return payload;
};

export const getHeaderConfig = (params) => readComponentData("/header-config", params);
export const getPageConfig = (params) => readComponentData("/page-config", params);
