import { fetchData } from "@packages/trem-utils";

const read = async (path, params, signal) => {
  const response = await fetchData(`/support${path}`, { params, signal });
  if (response?.status !== "success")
    throw new Error(response?.message || "Support content could not be loaded");
  return response.data || {};
};

const write = async (path, body) => {
  const response = await fetchData(`/support${path}`, { method: "POST", body });
  if (response?.status !== "success")
    throw new Error(response?.message || "Support request could not be completed");
  return response.data || {};
};

export const supportApi = {
  home: (signal) => read("/home", null, signal),
  search: (query, signal) => read("/search", { q: query }, signal),
  service: (id, signal) => read(`/services/${encodeURIComponent(id)}`, null, signal),
  topic: (id, signal) => read(`/topics/${encodeURIComponent(id)}`, null, signal),
  article: (id, signal) => read(`/articles/${encodeURIComponent(id)}`, null, signal),
  categories: (signal) => read("/categories", null, signal),
  contacts: (signal) => read("/contact-options", null, signal),
  tickets: (status, signal) => read("/tickets", status ? { status } : null, signal),
  ticket: (id, signal) => read(`/tickets/${encodeURIComponent(id)}`, null, signal),
  createTicket: (payload) => write("/tickets", payload),
  reply: (id, content) => write(`/tickets/${encodeURIComponent(id)}/messages`, { content }),
};
