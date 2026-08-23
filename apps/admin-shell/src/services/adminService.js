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

export async function fetchAdminTours() {
  const res = await fetchData("/tours.json");
  return normalizeToursResponse(res);
}

export async function deleteTour(id) {
  await expectSuccess(
    fetchData(`/tours.json/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }),
    "Delete failed",
  );
}

export async function deleteAllTours() {
  await expectSuccess(
    fetchData("/tours.json", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),
    "Delete all failed",
  );
}

export async function saveTour(payload) {
  if (!payload?._id) throw new Error("Tour creation must use the Tour Builder.");
  const res = await expectSuccess(
    fetchData(`/tours.json/${payload._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    "Failed to save tour",
  );

  return res.componentData?.state?.data?.tours?.[0] || res;
}

export async function submitTourProcess({ tourId = null, nodeId, payload }) {
  if (!tourId) throw new Error("Tour creation must use the Tour Builder.");
  const res = await expectSuccess(
    fetchData("/tours.json/process/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tourId, nodeId, payload }),
    }),
    "Failed to save tour draft",
  );
  return res.componentData?.state?.data || res.component?.data || res;
}

export async function verifyAdminTour(id) {
  await expectSuccess(
    fetchData(`/tours.json/${id}/verify`, { method: "POST" }),
    "Failed to verify tour",
  );
}

export async function fetchPartnerAgencies(status = "") {
  const res = await api.get("/auth/partner-agencies", { params: status ? { status } : {} });
  return Array.isArray(res?.data?.data) ? res.data.data : [];
}

export async function reviewPartnerAgency(id, status) {
  const res = await api.post(`/auth/partner-agencies/${id}/review`, { status });
  return res?.data?.data;
}

export async function fetchAgents(status = "") {
  const res = await api.get("/auth/agents", { params: status ? { status } : {} });
  return Array.isArray(res?.data?.data) ? res.data.data : [];
}

export async function reviewAgent(id, status) {
  const res = await api.post(`/auth/agents/${id}/review`, { status });
  return res?.data?.data;
}

export async function fetchAdmins(status = "") {
  const res = await api.get("/auth/admins", { params: status ? { status } : {} });
  return Array.isArray(res?.data?.data) ? res.data.data : [];
}

export async function reviewAdmin(id, status) {
  const res = await api.post(`/auth/admins/${id}/review`, { status });
  return res?.data?.data;
}

export async function removeAdmin(id) {
  const res = await api.post(`/auth/admins/${id}/remove`, {});
  return res?.data?.data;
}

export async function uploadTourImage(file) {
  const fd = new FormData();
  fd.append("image", file);
  const response = await api.post("/tours.json/upload", fd);
  const res = response?.data || {};
  const url =
    res?.componentData?.data?.url || res?.componentData?.url || res?.data?.url || res?.url;
  if (!url) throw new Error(res?.message || "Upload returned no URL");
  return url;
}

export async function uploadTourImageUrl(sourceUrl) {
  const response = await api.post("/tours.json/upload-url", { url: sourceUrl });
  const res = response?.data || {};
  const url =
    res?.componentData?.data?.url || res?.componentData?.url || res?.data?.url || res?.url;
  if (!url) throw new Error(res?.message || "Image import returned no URL");
  return url;
}

const TRIP_BASE = "/trevio/admin/trips";

function normalizeTripsResponse(res) {
  if (!res || res.status !== "success") {
    throw new Error(res?.message || "Failed to fetch trips");
  }
  return Array.isArray(res.componentData?.data) ? res.componentData.data : [];
}

export async function fetchAdminTrips() {
  const res = await fetchData(TRIP_BASE);
  return normalizeTripsResponse(res);
}

export async function saveTrip(payload) {
  const method = payload._id ? "PUT" : "POST";
  const url = payload._id ? `${TRIP_BASE}/${payload._id}` : TRIP_BASE;
  const res = await expectSuccess(
    fetchData(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    "Failed to save trip",
  );
  return res.componentData?.data || res;
}

export async function verifyAdminTrip(id) {
  await expectSuccess(
    fetchData(`${TRIP_BASE}/${id}/verify`, { method: "POST" }),
    "Failed to verify trip",
  );
}

export async function deleteTrip(id) {
  await expectSuccess(
    fetchData(`${TRIP_BASE}/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }),
    "Delete trip failed",
  );
}

export async function deleteAllTrips() {
  await expectSuccess(
    fetchData(TRIP_BASE, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),
    "Delete all trips failed",
  );
}

export async function uploadTripImage(file) {
  const fd = new FormData();
  fd.append("image", file);
  const response = await api.post("/tours.json/upload", fd);
  const res = response?.data || {};
  const url =
    res?.componentData?.data?.url || res?.componentData?.url || res?.data?.url || res?.url;
  if (!url) throw new Error(res?.message || "Upload returned no URL");
  return url;
}

// ── Client Management ──────────────────────────────────────────

export async function fetchClients() {
  const res = await fetchData("/clients");
  if (!res || res.status !== "success") throw new Error(res?.message || "Failed to fetch clients");
  return res.componentData?.data?.clients || [];
}

export async function fetchClient(id) {
  const res = await fetchData(`/clients/${id}`);
  if (!res || res.status !== "success") throw new Error(res?.message || "Failed to fetch client");
  return res.componentData?.data?.client || null;
}

export async function createClient(payload) {
  const res = await expectSuccess(
    fetchData("/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    "Failed to create client",
  );
  return res.componentData?.data?.client || res;
}

export async function updateClient(id, payload) {
  const res = await expectSuccess(
    fetchData(`/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    "Failed to update client",
  );
  return res.componentData?.data?.client || res;
}

export async function deleteClient(id) {
  await expectSuccess(fetchData(`/clients/${id}`, { method: "DELETE" }), "Failed to delete client");
}

export async function uploadClientLogo(clientId, product, file) {
  const fd = new FormData();
  fd.append("image", file);
  const response = await api.post(`/clients/${clientId}/logo?product=${product}`, fd);
  const res = response?.data || {};
  const url = res?.componentData?.data?.url || res?.data?.url || res?.url;
  if (!url) throw new Error(res?.message || "Upload returned no URL");
  return { url, client: res?.componentData?.data?.client };
}
