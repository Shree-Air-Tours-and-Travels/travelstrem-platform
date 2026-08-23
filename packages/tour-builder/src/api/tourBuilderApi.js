import { fetchData } from "@packages/trem-utils";

/**
 * Transport adapter for the shared builder. Portal apps may override any
 * function via configureTourBuilderApi so route strings never leak into the
 * renderer. Defaults use the standard trem-utils client (base URL "/api").
 */
const defaultRequest = async ({ url, method = "GET", body, signal }) => {
  const response = await fetchData(url, {
    method,
    ...(body !== undefined ? { body } : {}),
    ...(signal ? { signal } : {}),
  });
  if (response.status === "error" || response.status === "cancelled") {
    throw Object.assign(new Error(response.message || "Tour builder request failed"), {
      cancelled: response.status === "cancelled",
      fieldErrors: response.errors || null,
    });
  }
  return response;
};

let adapter = { request: defaultRequest };

export const configureTourBuilderApi = (overrides = {}) => {
  adapter = { ...adapter, ...overrides };
};

const unwrapEnvelope = (response) => {
  const payload = response?.builder
    ? response
    : response?.component?.data || response?.data || response;
  return payload;
};

const hydrateLabelRefs = (value, labels = {}) => {
  if (Array.isArray(value)) return value.map((item) => hydrateLabelRefs(item, labels));
  if (!value || typeof value !== "object") return value;
  const hydrated = {};
  Object.entries(value).forEach(([key, child]) => {
    hydrated[key] = hydrateLabelRefs(child, labels);
    if (
      key.endsWith("Ref") &&
      typeof child === "string" &&
      Object.prototype.hasOwnProperty.call(labels, child)
    ) {
      hydrated[key.slice(0, -3)] = labels[child];
    }
  });
  return hydrated;
};

const hydrateBuilderEnvelope = (response) => {
  const envelope = unwrapEnvelope(response);
  const labels = envelope?.elements?.labels || {};
  return {
    ...envelope,
    ...(envelope?.builder ? { builder: hydrateLabelRefs(envelope.builder, labels) } : {}),
    ...(envelope?.step ? { step: hydrateLabelRefs(envelope.step, labels) } : {}),
  };
};

export const tourBuilderApi = {
  async fetchDefinition() {
    const response = await adapter.request({ url: "/tours.json/builder/definition" });
    const envelope = hydrateBuilderEnvelope(response);
    return envelope?.builder || envelope?.component?.data?.builder || null;
  },

  /**
   * Schema-grounded JSON template. Without stepKey returns the complete
   * tour shape; with stepKey only the branches that step owns (or the
   * backing collection's sample record).
   */
  async fetchTemplate(stepKey) {
    const query = stepKey ? `?stepKey=${encodeURIComponent(stepKey)}` : "";
    const response = await adapter.request({ url: `/tours.json/builder/template${query}` });
    return unwrapEnvelope(response);
  },

  async loadStep({ tourId, stepKey, signal } = {}) {
    const query = tourId ? `?tourId=${encodeURIComponent(tourId)}` : "";
    const response = await adapter.request({
      url: `/tours.json/builder/steps/${encodeURIComponent(stepKey)}${query}`,
      signal,
    });
    return hydrateBuilderEnvelope(response);
  },

  async saveStep({ tourId, stepKey, data, signal } = {}) {
    const response = await adapter.request({
      url: `/tours.json/builder/steps/${encodeURIComponent(stepKey)}`,
      method: "PATCH",
      body: { tourId: tourId || null, stepKey, data },
      signal,
    });
    return unwrapEnvelope(response);
  },

  async savePosition({ tourId, stepKey, signal } = {}) {
    const response = await adapter.request({
      url: "/tours.json/builder/position",
      method: "PATCH",
      body: { tourId, stepKey },
      signal,
    });
    return unwrapEnvelope(response);
  },

  async previewPricing({ tourId, data, signal } = {}) {
    const response = await adapter.request({
      url: "/tours.json/builder/pricing-preview",
      method: "POST",
      body: { tourId, data },
      signal,
    });
    return unwrapEnvelope(response);
  },
};

export default tourBuilderApi;
