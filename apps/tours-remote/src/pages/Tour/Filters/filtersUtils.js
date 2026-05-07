const emptyValues = [undefined, null, ""];

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (emptyValues.includes(value)) return [];
  return [value];
};

const toOptionValue = (option) => {
  if (typeof option === "string") return option;
  return option?.value;
};

const getOptionValues = (options = []) => new Set(options.map((option) => String(toOptionValue(option))));

export function getOptionList(field = {}, serverOptions = {}) {
  if (!field) return [];
  if (Array.isArray(field.options) && field.options.length) return field.options;
  if (field.optionsSource && Array.isArray(serverOptions[field.optionsSource])) return serverOptions[field.optionsSource];
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

export function validateField(name, value, field = {}, serverOptions = {}) {
  const type = field.type || "text";
  const required = !!field.required;

  if (emptyValues.includes(value) || (Array.isArray(value) && !value.length)) {
    return required ? { ok: false, error: "Required" } : { ok: true, error: null };
  }

  if (type === "number") {
    const number = Number(value);
    if (!Number.isFinite(number)) return { ok: false, error: "Enter a valid number" };
    if (field.min !== undefined && number < Number(field.min)) return { ok: false, error: `Minimum ${field.min}` };
    if (field.max !== undefined && number > Number(field.max)) return { ok: false, error: `Maximum ${field.max}` };
    return { ok: true, error: null };
  }

  if (type === "date") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { ok: false, error: "Enter a valid date" };
    const dateRange = serverOptions.dateRange || {};
    if (dateRange.earliest && date < new Date(dateRange.earliest)) return { ok: false, error: `Earliest ${dateRange.earliest}` };
    if (dateRange.latest && date > new Date(dateRange.latest)) return { ok: false, error: `Latest ${dateRange.latest}` };
    return { ok: true, error: null };
  }

  if (type === "select") {
    const options = getOptionList(field, serverOptions);
    const values = getOptionValues(options);
    if (values.size && !values.has(String(value))) return { ok: false, error: "Choose a valid option" };
    return { ok: true, error: null };
  }

  if (type === "multiselect") {
    const options = getOptionList(field, serverOptions);
    const values = getOptionValues(options);
    const selected = toArray(value).map(String);
    if (values.size && selected.some((item) => !values.has(item))) return { ok: false, error: "Choose valid options" };
    return { ok: true, error: null };
  }

  if (type === "text") {
    const text = String(value);
    if (field.maxLength && text.length > field.maxLength) return { ok: false, error: `Max ${field.maxLength} characters` };
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
