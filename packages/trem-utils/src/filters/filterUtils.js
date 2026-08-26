const emptyValues = [undefined, null, ""];

const defaultMessages = {
  required: "Required",
  email: "Enter a valid email",
  phone: "Enter a valid phone number",
  number: "Enter a valid number",
  integer: "Enter a whole number",
  date: "Enter a valid date",
  option: "Choose a valid option",
  options: "Choose valid options",
  pattern: "Enter a valid value",
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (emptyValues.includes(value)) return [];
  return [value];
};

const toOptionValue = (option) => {
  if (typeof option === "string") return option;
  return option?.value;
};

const getOptionValues = (options = []) =>
  new Set(options.map((option) => String(toOptionValue(option))));

export function getOptionList(field = {}, serverOptions = {}) {
  if (!field) return [];
  if (Array.isArray(field.options) && field.options.length) return field.options;
  if (field.optionsSource && Array.isArray(serverOptions[field.optionsSource]))
    return serverOptions[field.optionsSource];
  if (Array.isArray(serverOptions[field.name])) return serverOptions[field.name];
  return [];
}

export function getActiveFilterCount(values = {}, defaults = {}) {
  return Object.keys(values).reduce((count, key) => {
    const value = values[key];
    const fallback = defaults[key];
    if (Array.isArray(value)) return count + (value.length ? 1 : 0);
    if (!emptyValues.includes(value) && value !== fallback) return count + 1;
    return count;
  }, 0);
}

const getMessage = (field = {}, key, fallback) =>
  field.messages?.[key] ||
  field.validation?.messages?.[key] ||
  fallback ||
  defaultMessages[key] ||
  "Invalid";

const getRuleValue = (field = {}, key) => {
  if (field[key] !== undefined) return field[key];
  if (field.validation && field.validation[key] !== undefined) return field.validation[key];
  return undefined;
};

const isEmptyValue = (value) =>
  emptyValues.includes(value) || (Array.isArray(value) && !value.length);

const normalizeComparableDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function validateField(name, value, field = {}, serverOptions = {}) {
  const type = field.type || field.inputType || "text";
  const required = !!getRuleValue(field, "required");

  if (isEmptyValue(value)) {
    return required
      ? { ok: false, error: getMessage(field, "required") }
      : { ok: true, error: null };
  }

  if (type === "number") {
    const number = Number(value);
    const min = getRuleValue(field, "min");
    const max = getRuleValue(field, "max");
    if (!Number.isFinite(number)) return { ok: false, error: getMessage(field, "number") };
    if (getRuleValue(field, "integer") && !Number.isInteger(number))
      return { ok: false, error: getMessage(field, "integer") };
    if (min !== undefined && number < Number(min))
      return { ok: false, error: getMessage(field, "min", `Minimum ${min}`) };
    if (max !== undefined && number > Number(max))
      return { ok: false, error: getMessage(field, "max", `Maximum ${max}`) };
    return { ok: true, error: null };
  }

  if (type === "date") {
    const date = normalizeComparableDate(value);
    if (!date) return { ok: false, error: getMessage(field, "date") };
    const dateRange = serverOptions.dateRange || {};
    const minDate = getRuleValue(field, "minDate") || dateRange.earliest;
    const maxDate = getRuleValue(field, "maxDate") || dateRange.latest;
    if (minDate && date < new Date(minDate))
      return { ok: false, error: getMessage(field, "minDate", `Earliest ${minDate}`) };
    if (maxDate && date > new Date(maxDate))
      return { ok: false, error: getMessage(field, "maxDate", `Latest ${maxDate}`) };
    return { ok: true, error: null };
  }

  if (type === "email") {
    const email = String(value).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { ok: false, error: getMessage(field, "email") };
    return { ok: true, error: null };
  }

  if (type === "tel" || type === "phone") {
    const phone = String(value).replace(/\D/g, "");
    if (phone.length !== 10)
      return { ok: false, error: getMessage(field, "phone", "Enter a valid 10-digit phone number") };
    return { ok: true, error: null };
  }

  if (type === "select") {
    const options = getOptionList(field, serverOptions);
    const values = getOptionValues(options);
    if (values.size && !values.has(String(value)))
      return { ok: false, error: getMessage(field, "option") };
    return { ok: true, error: null };
  }

  if (type === "multiselect") {
    const options = getOptionList(field, serverOptions);
    const values = getOptionValues(options);
    const selected = toArray(value).map(String);
    const minItems = getRuleValue(field, "minItems");
    const maxItems = getRuleValue(field, "maxItems");
    if (minItems !== undefined && selected.length < Number(minItems))
      return { ok: false, error: getMessage(field, "minItems", `Choose at least ${minItems}`) };
    if (maxItems !== undefined && selected.length > Number(maxItems))
      return { ok: false, error: getMessage(field, "maxItems", `Choose up to ${maxItems}`) };
    if (values.size && selected.some((item) => !values.has(item)))
      return { ok: false, error: getMessage(field, "options") };
    return { ok: true, error: null };
  }

  if (["text", "textarea", "password"].includes(type)) {
    const text = String(value);
    const minLength = getRuleValue(field, "minLength");
    const maxLength = getRuleValue(field, "maxLength");
    const pattern = getRuleValue(field, "pattern");
    if (minLength && text.trim().length < Number(minLength))
      return { ok: false, error: getMessage(field, "minLength", `Min ${minLength} characters`) };
    if (maxLength && text.length > Number(maxLength))
      return { ok: false, error: getMessage(field, "maxLength", `Max ${maxLength} characters`) };
    if (pattern && !new RegExp(pattern).test(text))
      return { ok: false, error: getMessage(field, "pattern") };
    return { ok: true, error: null };
  }

  return { ok: true, error: null };
}

export function validateAll(values = {}, fieldsMap = {}, serverOptions = {}) {
  const errors = {};

  Object.keys(fieldsMap).forEach((name) => {
    const result = validateField(name, values[name], fieldsMap[name], serverOptions);
    if (!result.ok) errors[name] = result.error || "Invalid";
  });

  const checkRange = (minName, maxName, message) => {
    const min = values[minName];
    const max = values[maxName];
    if (emptyValues.includes(min) || emptyValues.includes(max)) return;
    const minNumber = Number(min);
    const maxNumber = Number(max);
    if (Number.isFinite(minNumber) && Number.isFinite(maxNumber) && minNumber > maxNumber) {
      errors[minName] = errors[minName] || message.min;
      errors[maxName] = errors[maxName] || message.max;
    }
  };

  checkRange("minPrice", "maxPrice", {
    min: "Min price must be below max",
    max: "Max price must be above min",
  });
  checkRange("minDays", "maxDays", {
    min: "Min days must be below max",
    max: "Max days must be above min",
  });

  if (values.arrivalDate && values.returnDate) {
    const arrival = new Date(values.arrivalDate);
    const ret = new Date(values.returnDate);
    if (!Number.isNaN(arrival.getTime()) && !Number.isNaN(ret.getTime()) && arrival > ret) {
      errors.arrivalDate = errors.arrivalDate || "Arrival must be before return";
      errors.returnDate = errors.returnDate || "Return must be after arrival";
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}

export const validateFields = validateAll;
