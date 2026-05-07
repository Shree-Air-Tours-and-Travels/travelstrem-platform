// components/Filters/filtersUtils.js
/**
 * Helpers to resolve select options and validate fields/values.
 * - getOptionList(field, serverOptions)
 * - validateField(name, value, field, serverOptions)
 * - validateAll(values, fieldsMap, serverOptions)
 */

export function getOptionList(field = {}, serverOptions = {}) {
  if (!field) return [];

  // explicit options (field.options)
  if (Array.isArray(field.options) && field.options.length) return field.options;

  // optionsSource (points to serverOptions key)
  if (field.optionsSource && serverOptions[field.optionsSource]) {
    return serverOptions[field.optionsSource];
  }

  // config helpers: featured, ratings
  const label = (field.label || "").toLowerCase();
  if (label.includes("featured") && Array.isArray(serverOptions.featured)) return serverOptions.featured;
  if (label.includes("rating") && Array.isArray(serverOptions.ratings)) return serverOptions.ratings;

  // fallback: if serverOptions has a key with the field name
  if (serverOptions[field.name]) return serverOptions[field.name];

  // default empty
  return [];
}

/**
 * Validate a single field value.
 * Returns { ok: boolean, error: string|null }.
 */
export function validateField(name, value, field = {}, serverOptions = {}) {
  const type = field.type || "text";

  // treat missing value as empty string for text/number/date
  if (value === undefined || value === null) value = "";

  // Common validation containers
  if (type === "number") {
    // empty is allowed (means "not set"). If you want to force numeric presence, add field.required in JSON.
    if (value === "") return { ok: true, error: null };
    if (Number.isNaN(Number(value))) return { ok: false, error: "Must be a number" };
    const num = Number(value);
    if (field.min !== undefined && num < field.min) return { ok: false, error: `Minimum ${field.min}` };
    if (field.max !== undefined && num > field.max) return { ok: false, error: `Maximum ${field.max}` };

    // extra heuristics: guest counts use serverOptions.maxGuests
    if (name === "adults" && serverOptions.maxGuests && num < 1) return { ok: false, error: "At least 1 adult required" };
    return { ok: true, error: null };
  }

  if (type === "date") {
    if (value === "") return { ok: true, error: null };
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return { ok: false, error: "Invalid date" };

    // check dateRange from serverOptions (if present)
    const dateRange = serverOptions.dateRange || {};
    if (dateRange.earliest) {
      const earliest = new Date(dateRange.earliest);
      if (!Number.isNaN(earliest.getTime()) && d < earliest) return { ok: false, error: `Date must be on/after ${dateRange.earliest}` };
    }
    if (dateRange.latest) {
      const latest = new Date(dateRange.latest);
      if (!Number.isNaN(latest.getTime()) && d > latest) return { ok: false, error: `Date must be on/before ${dateRange.latest}` };
    }
    return { ok: true, error: null };
  }

  if (type === "select") {
    // allow blank (means Any)
    if (value === "" || value === null) return { ok: true, error: null };
    const opts = getOptionList(field, serverOptions);
    // if options are strings
    if (Array.isArray(opts) && opts.length > 0 && typeof opts[0] === "string") {
      if (!opts.includes(value)) return { ok: false, error: "Invalid selection" };
      return { ok: true, error: null };
    }
    // array of {label,value}
    if (Array.isArray(opts) && opts.length > 0) {
      if (!opts.find((o) => String(o.value) === String(value))) return { ok: false, error: "Invalid selection" };
      return { ok: true, error: null };
    }
    // no options to validate against
    return { ok: true, error: null };
  }

  // text field: check required/length if specified
  if (type === "text") {
    if (field.required && (value === "" || value === null)) return { ok: false, error: "Required" };
    if (field.maxLength && value.length > field.maxLength) return { ok: false, error: `Max ${field.maxLength} chars` };
    return { ok: true, error: null };
  }

  // fallback
  return { ok: true, error: null };
}

/**
 * Validate entire form:
 * - runs validateField for each field in fieldsMap
 * - additional cross-field validation: returnDate >= arrivalDate, minPrice <= maxPrice, minDays <= maxDays
 * Returns: { ok: boolean, errors: { [fieldName]: string } }
 */
export function validateAll(values = {}, fieldsMap = {}, serverOptions = {}) {
  const errors = {};
  console.log(values , serverOptions, "validateAll", fieldsMap)

  // per-field
  for (const name of Object.keys(fieldsMap)) {
    const f = fieldsMap[name];
    const v = values[name];
    const res = validateField(name, v, f, serverOptions);
    if (!res.ok) errors[name] = res.error || "Invalid";
  }

  // cross-field checks
  // price range
  const minPrice = values.minPrice;
  const maxPrice = values.maxPrice;
  if (minPrice !== "" && maxPrice !== "" && minPrice !== undefined && maxPrice !== undefined) {
    const mn = Number(minPrice);
    const mx = Number(maxPrice);
    if (!Number.isNaN(mn) && !Number.isNaN(mx) && mn > mx) {
      errors.minPrice = errors.minPrice || "Min price must be <= max price";
      errors.maxPrice = errors.maxPrice || "Max price must be >= min price";
    }
  }

  // days range
  const minDays = values.minDays;
  const maxDays = values.maxDays;
  if (minDays !== "" && maxDays !== "" && minDays !== undefined && maxDays !== undefined) {
    const mn = Number(minDays);
    const mx = Number(maxDays);
    if (!Number.isNaN(mn) && !Number.isNaN(mx) && mn > mx) {
      errors.minDays = errors.minDays || "Min days must be <= max days";
      errors.maxDays = errors.maxDays || "Max days must be >= min days";
    }
  }

  // date range
  const arrival = values.arrivalDate;
  const ret = values.returnDate;
  if (arrival && ret) {
    const a = new Date(arrival);
    const r = new Date(ret);
    if (!Number.isNaN(a.getTime()) && !Number.isNaN(r.getTime()) && a > r) {
      errors.arrivalDate = errors.arrivalDate || "Arrival must be on/before Return";
      errors.returnDate = errors.returnDate || "Return must be on/after Arrival";
    }
  }

  const ok = Object.keys(errors).length === 0;
  return { ok, errors };
}
