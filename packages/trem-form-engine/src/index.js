const getPath = (source, path = "") =>
  String(path)
    .split(".")
    .filter(Boolean)
    .reduce((value, key) => value?.[key], source);

const setPath = (target, path, value) => {
  const parts = String(path).split(".").filter(Boolean);
  const leaf = parts.pop();
  if (!leaf) return;
  const parent = parts.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== "object") current[key] = {};
    return current[key];
  }, target);
  parent[leaf] = value;
};

const isEmpty = (value) =>
  value == null || value === "" || (Array.isArray(value) && value.length === 0);

const isVisible = (field, values) => {
  if (!field.visibleWhen?.field) return true;
  const accepted = field.visibleWhen.values || [field.visibleWhen.equals];
  return accepted.includes(getPath(values, field.visibleWhen.field));
};

const normalize = (field, value) => {
  if (field.type === "checkbox") return value === true || value === "true";
  if (field.type === "number") return value === "" || value == null ? "" : Number(value);
  if (field.type === "stringList") {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    return String(value || "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (field.type === "entityList") return Array.isArray(value) ? value : [];
  return typeof value === "string" && field.trim !== false ? value.trim() : value;
};

const validate = (field, value, now) => {
  if (field.required && field.type === "checkbox" && value !== true)
    return field.requiredMessage || `${field.label} must be confirmed`;
  if (field.required && isEmpty(value))
    return field.requiredMessage || `${field.label} is required`;
  if (isEmpty(value)) return null;
  if (field.type === "money" && !/^\d+(?:\.\d{1,2})?$/.test(String(value)))
    return `${field.label} must be a valid amount with at most 2 decimal places`;
  if (field.type === "number" && !Number.isFinite(value)) return `${field.label} must be a number`;
  if (field.min != null && Number(value) < Number(field.min))
    return `${field.label} must be at least ${field.min}`;
  if (field.max != null && Number(value) > Number(field.max))
    return `${field.label} must be at most ${field.max}`;
  if (field.minLength != null && String(value).length < Number(field.minLength))
    return `${field.label} must contain at least ${field.minLength} characters`;
  if (field.maxLength != null && String(value).length > Number(field.maxLength))
    return `${field.label} allows at most ${field.maxLength} characters`;
  if (field.pattern) {
    try {
      if (!new RegExp(field.pattern).test(String(value)))
        return field.patternMessage || `${field.label} has an invalid format`;
    } catch {
      return `${field.label} has an invalid validation pattern`;
    }
  }
  if (field.minItems != null && (!Array.isArray(value) || value.length < Number(field.minItems)))
    return `${field.label} needs at least ${field.minItems} items`;
  if (field.options?.length && !field.options.some((option) => option.value === value))
    return `${field.label} contains an unsupported value`;
  if (field.minDate === "today") {
    const selected = new Date(`${value}T00:00:00.000Z`);
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    if (Number.isNaN(selected.getTime()) || selected < today)
      return `${field.label} cannot be in the past`;
  }
  return null;
};

/** Picks, normalizes and validates only fields declared by backend JSON. */
export function validateFormFields(fields = [], input = {}, options = {}) {
  const data = {};
  const errors = {};
  const now = options.now || new Date();
  fields.forEach((field) => {
    if (!field?.path) return;
    const value = normalize(field, getPath(input, field.path));
    const error = validate(field, value, now);
    if (error) errors[field.path] = error;
    if (field.type === "entityList" && Array.isArray(value)) {
      value.forEach((item, index) => {
        (field.itemFields || []).forEach((itemField) => {
          if (!isVisible(itemField, item)) return;
          const normalized = normalize(itemField, getPath(item, itemField.path));
          const itemError = validate(itemField, normalized, now);
          if (itemError) errors[`${field.path}.${index}.${itemField.path}`] = itemError;
          if (normalized !== undefined) setPath(item, itemField.path, normalized);
        });
      });
    }
    if (value !== undefined) setPath(data, field.path, value);
  });
  return { valid: Object.keys(errors).length === 0, data, errors };
}

export { getPath, setPath };
