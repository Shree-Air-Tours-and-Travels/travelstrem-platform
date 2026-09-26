import { getPath, isEmptyValue } from "./paths.js";
import { evaluateCondition } from "./conditions.js";

/**
 * Frontend validation is UX only — the backend revalidates everything.
 * Rule shapes come from backend widget definitions:
 *   { type, value?, message?, path?, min?, max?, visibleWhen? }
 */
const evaluate = (rule) => {
  if (!rule || typeof rule !== "object") return false;
  switch (rule.type) {
    case "REQUIRED":
      return false;
    case "MIN_LENGTH":
      return String(rule.actual ?? "").trim().length < Number(rule.value);
    case "MAX_LENGTH":
      return String(rule.actual ?? "").length > Number(rule.value);
    case "MIN":
      return rule.actual != null && rule.actual !== "" && Number(rule.actual) < Number(rule.value);
    case "MAX":
      return rule.actual != null && rule.actual !== "" && Number(rule.actual) > Number(rule.value);
    case "INTEGER_MIN": {
      const parsed = Number(rule.actual);
      return (
        rule.actual != null &&
        rule.actual !== "" &&
        (!Number.isSafeInteger(parsed) || parsed < Number(rule.value))
      );
    }
    case "PATTERN":
      try {
        return (
          rule.actual != null &&
          rule.actual !== "" &&
          !new RegExp(rule.value).test(String(rule.actual))
        );
      } catch {
        return true;
      }
    case "MIN_ITEMS":
      return Array.isArray(rule.actual) && rule.actual.length < Number(rule.value);
    case "MAX_ITEMS":
      return Array.isArray(rule.actual) && rule.actual.length > Number(rule.value);
    case "GTE_PATH":
      return (
        rule.actual != null && rule.compared != null && Number(rule.actual) < Number(rule.compared)
      );
    case "ENABLED_COUNT": {
      const enabled = (Array.isArray(rule.actual) ? rule.actual : []).filter(
        (item) => item?.enabled !== false,
      );
      if (rule.min != null && enabled.length < Number(rule.min)) return true;
      if (rule.max != null && enabled.length > Number(rule.max)) return true;
      return false;
    }
    case "DAY_SEQUENCE": {
      const days = Array.isArray(rule.actual) ? rule.actual : [];
      return days.some(
        (day, index) => Number(day?.day ?? day?.dayNumber ?? index + 1) !== index + 1,
      );
    }
    default:
      return false;
  }
};

export const validateValue = (widget = {}, value, values) => {
  const errors = [];
  const rules = (Array.isArray(widget.validation) ? widget.validation : []).filter(
    (rule) => rule && typeof rule === "object",
  );
  rules.forEach((rule) => {
    if (isEmptyValue(value)) {
      // Empty lists still violate minimum-size rules.
      if (rule.type === "MIN_ITEMS" && Number(rule.value) > 0) {
        errors.push(
          rule.message || `${widget.label || widget.key} needs at least ${rule.value} entries`,
        );
      } else if (rule.type === "REQUIRED" || widget.required) {
        errors.push(rule.message || `${widget.label || widget.key} is required`);
      }
      return;
    }
    const failed = evaluate({
      ...rule,
      actual: value,
      compared: rule.path ? getPath(values, rule.path) : undefined,
    });
    if (failed) errors.push(rule.message || `${widget.label || widget.key} is invalid`);
  });
  // A required widget without an explicit REQUIRED rule still enforces presence.
  if (widget.required && isEmptyValue(value) && !rules.some((rule) => rule.type === "REQUIRED")) {
    errors.push(`${widget.label || widget.key} is required`);
  }
  return errors;
};

/** Validate a widget list against values; returns { path: [messages] }. */
export const validateWidgets = (widgets = [], values = {}, prefix = "", rootValues = values) => {
  const errors = {};
  (Array.isArray(widgets) ? widgets : []).forEach((widget) => {
    if (!widget || widget.readOnly) return;
    if (!evaluateCondition(rootValues, widget.visibleWhen)) return;
    const absolutePath = prefix ? `${prefix}.${widget.path}` : widget.path;
    if (!absolutePath || absolutePath.startsWith("$")) return;

    const messages = validateValue(widget, getPath(values, widget.path), values);
    if (messages.length) errors[absolutePath] = messages;

    const childPrefix = prefix ? `${prefix}.${widget.path}` : widget.path;
    if (widget.type === "OBJECT") {
      const objectValue = getPath(values, widget.path) || {};
      Object.assign(
        errors,
        validateWidgets(widget.widgets || [], objectValue, childPrefix, rootValues),
      );
    }
    if (widget.type === "REPEATER" || widget.type === "COLLECTION_REPEATER") {
      const items = getPath(values, widget.path) || [];
      items.forEach((item, index) => {
        Object.assign(
          errors,
          validateWidgets(widget.itemWidgets || [], item, `${childPrefix}.${index}`, rootValues),
        );
      });
    }
  });
  return errors;
};
