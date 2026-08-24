import { fetchData } from "@packages/trem-utils";
import api from "./apiClient";

function normalizeToursResponse(res) {
  if (!res || res.status !== "success") {
    throw new Error(res?.message || "Failed to fetch tours");
  }

  if (Array.isArray(res.component?.data?.tours)) return res.component.data.tours;

  const componentData = res.componentData || {};

  if (Array.isArray(componentData.data)) return componentData.data;
  if (componentData.state?.data && Array.isArray(componentData.state.data.tours)) {
    return componentData.state.data.tours;
  }
  if (Array.isArray(componentData.data?.tours)) return componentData.data.tours;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(componentData.data?.items)) return componentData.data.items;

  const nestedArray = Object.values(componentData).find((value) => Array.isArray(value));
  return nestedArray || [];
}

async function expectSuccess(request, fallbackMessage) {
  const res = await request;
  if (!res || res.status !== "success") {
    throw new Error(res?.message || fallbackMessage);
  }
  return res;
}

export async function fetchAgentTours(opts = {}) {
  const res = await fetchData("/tours.json", {
    signal: opts.signal,
    params: {
      scope: opts.scope || "mine",
      query: opts.query || undefined,
      sort: opts.sort || "newest",
      status: opts.status || undefined,
      limit: opts.limit || undefined,
    },
  });
  return normalizeToursResponse(res);
}

const TREVIO_TRIPS_URL = "/trevio/admin/trips";

export async function fetchPartnerTrevioTrips(opts = {}) {
  const res = await fetchData(TREVIO_TRIPS_URL, { signal: opts.signal });
  if (!res || res.status !== "success")
    throw new Error(res?.message || "Failed to load Trevio trips");
  return Array.isArray(res.componentData?.data) ? res.componentData.data : [];
}

export async function savePartnerTrevioTrip(payload, opts = {}) {
  const isEdit = Boolean(payload?._id);
  const res = await expectSuccess(
    fetchData(isEdit ? `${TREVIO_TRIPS_URL}/${payload._id}` : TREVIO_TRIPS_URL, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: opts.signal,
    }),
    "Failed to save Trevio trip",
  );
  return res.componentData?.data || res;
}

export async function deletePartnerTrevioTrip(id, opts = {}) {
  return expectSuccess(
    fetchData(`${TREVIO_TRIPS_URL}/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      signal: opts.signal,
    }),
    "Failed to delete Trevio trip",
  );
}

export async function approvePartnerTrevioTrip(trip, opts = {}) {
  return savePartnerTrevioTrip({ ...trip, status: "listed", isListed: true }, opts);
}

export async function uploadTripImage(file, opts = {}) {
  const fd = new FormData();
  fd.append("image", file);
  const response = await api.post("/tours.json/upload", fd, { signal: opts.signal });
  const res = response?.data || {};
  const url =
    res?.componentData?.data?.url || res?.componentData?.url || res?.data?.url || res?.url;
  if (!url) throw new Error(res?.message || "Upload returned no URL");
  return url;
}

export async function deleteAgentTour(id, opts = {}) {
  await expectSuccess(
    fetchData(`/tours.json/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      signal: opts.signal,
    }),
    "Delete failed",
  );
}

export async function deleteAllAgentTours(opts = {}) {
  await expectSuccess(
    fetchData("/tours.json", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: opts.signal,
    }),
    "Delete all failed",
  );
}

export async function saveAgentTour(payload, opts = {}) {
  if (!payload?._id) throw new Error("Tour creation must use the Tour Builder.");
  const res = await expectSuccess(
    fetchData(`/tours.json/${payload._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: opts.signal,
    }),
    "Failed to save tour",
  );

  return res.componentData?.state?.data?.tours?.[0] || res;
}

export async function submitAgentTourProcess({ tourId = null, nodeId, payload }, opts = {}) {
  if (!tourId) throw new Error("Tour creation must use the Tour Builder.");
  const res = await expectSuccess(
    fetchData("/tours.json/process/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tourId, nodeId, payload }),
      signal: opts.signal,
    }),
    "Failed to save tour draft",
  );
  return res.componentData?.state?.data || res.component?.data || res;
}

export async function fetchAgentProfile(opts = {}) {
  const response = await api.get("/auth/me", { signal: opts.signal });
  return response?.data || null;
}

export async function applyPartnerAgency(data, opts = {}) {
  const response = await api.post("/auth/partner-agencies/apply", data, { signal: opts.signal });
  const res = response?.data || {};
  if (res.status !== "success") throw new Error(res?.message || "Application submission failed");
  return res?.partnerAgency || null;
}

export async function checkPartnerApplication(email, opts = {}) {
  const response = await api.get(
    `/auth/partner-agencies/check?email=${encodeURIComponent(email)}`,
    { signal: opts.signal },
  );
  const res = response?.data || {};
  if (res.status !== "success") return null;
  return res?.data || null;
}

export async function fetchAgencyProfile(agencyId, opts = {}) {
  const response = await api.get(`/tenancy/agencies/${encodeURIComponent(agencyId || "me")}`, {
    signal: opts.signal,
  });
  const data = response?.data?.componentData?.data;
  return data?.agency || data || null;
}

export async function updateAgencyProfile(agencyId, data, opts = {}) {
  const response = await api.patch(
    `/tenancy/agencies/${encodeURIComponent(agencyId || "me")}`,
    data,
    { signal: opts.signal },
  );
  return response?.data?.componentData?.data || null;
}

export async function updatePassword(data, opts = {}) {
  const response = await api.put("/auth/password", data, { signal: opts.signal });
  const res = response?.data || {};
  if (res.status !== "success") throw new Error(res?.message || "Password update failed");
  return res;
}

export async function updateProfile(data, opts = {}) {
  const response = await api.put("/auth/profile", data, { signal: opts.signal });
  const res = response?.data || {};
  if (res.status !== "success") throw new Error(res?.message || "Profile update failed");
  return res;
}

export async function updateAvatar(avatar, opts = {}) {
  return updateProfile({ avatar }, opts);
}

export async function getAgentTourById(id, opts = {}) {
  const res = await fetchData(`/tours.json/${id}`, { signal: opts.signal });
  if (!res || res.status !== "success") {
    throw new Error(res?.message || "Failed to fetch tour");
  }
  return res.component?.data || null;
}

export async function uploadTourImage(file, opts = {}) {
  const fd = new FormData();
  fd.append("image", file);
  const response = await api.post("/tours.json/upload", fd, { signal: opts.signal });
  const res = response?.data || {};
  const url =
    res?.componentData?.data?.url || res?.componentData?.url || res?.data?.url || res?.url;
  if (!url) throw new Error(res?.message || "Upload returned no URL");
  return url;
}

export async function uploadTourImageUrl(sourceUrl, opts = {}) {
  const response = await api.post(
    "/tours.json/upload-url",
    { url: sourceUrl },
    { signal: opts.signal },
  );
  const res = response?.data || {};
  const url =
    res?.componentData?.data?.url || res?.componentData?.url || res?.data?.url || res?.url;
  if (!url) throw new Error(res?.message || "Image import returned no URL");
  return url;
}
