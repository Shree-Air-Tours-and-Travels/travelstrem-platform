export const PAGE_KEY = "tours-remote/booking";
export const WIDGET_ENDPOINT = "/booking-traveler.json";

const resolveRef = (value, key, labels, options, extra) => {
  if (typeof value !== "string" || !key.endsWith("Ref")) return value;
  if (key === "optionsRef") return options[value];
  if (key === "maxRef" || key === "minRef") return extra[value];
  return labels[value] ?? value;
};

export const resolveConfig = (props = {}, labels = {}, options = {}, extra = {}) => {
  const walk = (node) => {
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === "object") {
      return Object.entries(node).reduce((acc, [key, value]) => {
        acc[key] = value;
        if (typeof value === "string" && key.endsWith("Ref")) {
          acc[key.slice(0, -3)] = resolveRef(value, key, labels, options, extra);
        } else if (Array.isArray(value) || (value && typeof value === "object")) {
          acc[key] = walk(value);
        }
        return acc;
      }, {});
    }
    return node;
  };
  return walk(props);
};

export const buildValidationFields = (config = {}, options = {}) => {
  const map = {};
  const addField = (field) => {
    if (!field?.name) return;
    map[field.name] = {
      name: field.name,
      type: field.validateType || field.type,
      required: !!field.required,
      ...(field.min != null && { min: field.min }),
      ...(field.max != null && { max: field.max }),
      ...(field.minLength != null && { minLength: field.minLength }),
      ...(field.maxLength != null && { maxLength: field.maxLength }),
      ...(field.pattern != null && { pattern: field.pattern }),
      ...(field.integer != null && { integer: field.integer }),
      ...(field.type === "select" && { options: Array.isArray(field.options) ? field.options : [] }),
      messages: field.validation?.messages,
    };
  };
  (config.leadFields || []).forEach(addField);
  (config.sections || []).forEach((section) => {
    (section.fields || []).forEach((entry) => {
      if (Array.isArray(entry)) entry.forEach(addField);
      else addField(entry);
    });
  });
  return map;
};

export const LEAD_FIELD_NAMES = ["contactEmail", "contactPhone", "guests"];
