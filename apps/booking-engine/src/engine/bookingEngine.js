import { fetchData } from "@packages/trem-utils";

export const unwrap = (response) => response?.componentData?.data
  || response?.component?.data
  || response?.data
  || response
  || {};

export const getError = (response, fallback) => response?.message || response?.error?.message || fallback;

export const resolveTemplate = (value, params = {}) => String(value || "").replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(params[key] ?? ""));

export const emptyTraveller = (fields = []) => fields.reduce((result, field) => {
  result[field.name] = field.defaultValue ?? "";
  return result;
}, {});

export const fieldRules = (field) => ({
  required: field.required === true || field.validation?.required === true,
  minLength: field.validation?.minLength ?? field.minLength,
  maxLength: field.validation?.maxLength ?? field.maxLength,
  min: field.validation?.min ?? field.min,
  max: field.validation?.max ?? field.max,
  pattern: field.validation?.pattern ?? field.pattern,
  message: field.validation?.message || field.messages?.required || `${field.label || field.name} is required`,
});

export const validateField = (value, field) => {
  const rules = fieldRules(field);
  if (field.type === "file" && value?.size && field.validation?.maxSize && value.size > Number(field.validation.maxSize)) return field.messages?.maxSize || `${field.label || field.name} exceeds the maximum file size`;
  const text = String(value ?? "").trim();
  if (rules.required && !text) return rules.message;
  if (!text) return "";
  if (rules.minLength && text.length < Number(rules.minLength)) return field.messages?.minLength || `${field.label || field.name} is too short`;
  if (rules.maxLength && text.length > Number(rules.maxLength)) return field.messages?.maxLength || `${field.label || field.name} is too long`;
  if (rules.min != null && Number(value) < Number(rules.min)) return field.messages?.min || `${field.label || field.name} is below the minimum`;
  if (rules.max != null && Number(value) > Number(rules.max)) return field.messages?.max || `${field.label || field.name} is above the maximum`;
  if (rules.pattern && !(new RegExp(rules.pattern).test(text))) return field.messages?.pattern || `${field.label || field.name} is invalid`;
  if (field.type === "email" && !/^\S+@\S+\.\S+$/.test(text)) return field.messages?.format || "Enter a valid email address";
  return "";
};

export const validateStep = (step, values) => {
  const errors = {};
  (step.fields || []).forEach((field) => {
    const error = validateField(values[field.name], field);
    if (error) errors[field.name] = error;
  });
  return errors;
};

export const priceFrom = (data) => data?.pricing || data?.priceSnapshot || data?.paymentSummary || data?.quote?.pricing || {};

export async function requestPricing(config, payload) {
  if (!config?.pricingEndpoint) return null;
  const endpoint = resolveTemplate(config.pricingEndpoint, { product: payload.product, tripId: payload.tripId, tripRef: payload.tripRef });
  const method = String(config.pricingMethod || "POST").toUpperCase();
  const response = await fetchData(endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(method === "GET" ? { params: payload } : { body: payload }),
  });
  if (response?.status !== "success") throw new Error(getError(response, "Unable to calculate pricing"));
  const data = unwrap(response);
  return { pricing: priceFrom(data), addons: data?.addons || [] };
}
