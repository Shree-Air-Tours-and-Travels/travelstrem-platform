/**
 * Backend-driven conditional rendering.
 * Supports: { field, operator, value } | { all: [...] } | { any: [...] } | [rules]
 */
import { getPath } from "./paths.js";

export const OPERATORS = Object.freeze({
  EQUALS: (left, right) => left === right,
  NOT_EQUALS: (left, right) => left !== right,
  IN: (left, right) => Array.isArray(right) && right.includes(left),
  NOT_IN: (left, right) => Array.isArray(right) && !right.includes(left),
  EXISTS: (left) => left != null && left !== "",
  NOT_EXISTS: (left) => left == null || left === "",
  GREATER_THAN: (left, right) => Number(left) > Number(right),
  LESS_THAN: (left, right) => Number(left) < Number(right),
  TRUTHY: (left) => Boolean(left),
  FALSY: (left) => !left,
});

const singleRule = (values, rule) => {
  if (!rule || typeof rule !== "object") return true;
  const left = getPath(values, rule.field);
  const operator = OPERATORS[rule.operator] || OPERATORS.EQUALS;
  try {
    return operator(left, rule.value);
  } catch {
    return false;
  }
};

export const evaluateCondition = (values, condition) => {
  if (condition == null) return true;
  if (Array.isArray(condition)) return condition.every((rule) => singleRule(values, rule));
  if (condition.all) return condition.all.every((rule) => singleRule(values, rule));
  if (condition.any) return condition.any.some((rule) => singleRule(values, rule));
  return singleRule(values, condition);
};
