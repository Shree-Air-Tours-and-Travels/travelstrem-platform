import { fetchData } from "@packages/trem-utils";

const read = async (path, params, signal) => {
  const response = await fetchData(`/support${path}`, { params, signal });
  if (response?.status !== "success") throw new Error(response?.message || "Support content could not be loaded");
  return response.data || {};
};

const write = async (path, body) => {
  const response = await fetchData(`/support${path}`, { method: "POST", body });
  if (response?.status !== "success") throw new Error(response?.message || "Support request could not be completed");
  return response.data || {};
};

export const supportApi = {
  home: (signal) => read("/home", null, signal),
  search: (query, signal) => read("/search", { q: query }, signal),
  service: (id, signal) => read(`/services/${encodeURIComponent(id)}`, null, signal),
  topic: (id, signal) => read(`/topics/${encodeURIComponent(id)}`, null, signal),
  article: (id, signal) => read(`/articles/${encodeURIComponent(id)}`, null, signal),
  bookings: (signal) => read("/bookings", null, signal),
  booking: (id, signal) => read(`/bookings/${encodeURIComponent(id)}`, null, signal),
  categories: (bookingId, signal) => read("/categories", bookingId ? { bookingId } : null, signal),
  contacts: (bookingId, signal) => read("/contact-options", bookingId ? { bookingId } : null, signal),
  tickets: (status, signal) => read("/tickets", status ? { status } : null, signal),
  ticket: (id, signal) => read(`/tickets/${encodeURIComponent(id)}`, null, signal),
  createTicket: (payload) => write("/tickets", payload),
  reply: (id, content) => write(`/tickets/${encodeURIComponent(id)}/messages`, { content }),
  eligibility: (bookingId, type, signal) => read(`/bookings/${encodeURIComponent(bookingId)}/${type.toLowerCase()}-eligibility`, null, signal),
  submitBookingRequest: (bookingId, type, payload) => write(`/bookings/${encodeURIComponent(bookingId)}/${type.toLowerCase()}-request`, payload),
};
