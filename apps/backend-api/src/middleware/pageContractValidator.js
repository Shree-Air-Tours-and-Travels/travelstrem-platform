const isLabelRefKey = (key) => key.endsWith("Ref") && !/urlRef$/i.test(key) && key !== "iconRef" && key !== "optionsRef" && key !== "widgetRef";
const isUrlRefKey = (key) => /urlRef$/i.test(key) || key === "iconRef";

const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const collectRefs = (value, path = "structure", refs = []) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectRefs(item, `${path}[${index}]`, refs));
    return refs;
  }
  if (!isObject(value)) return refs;
  Object.entries(value).forEach(([key, child]) => {
    const childPath = `${path}.${key}`;
    if (typeof child === "string" && isLabelRefKey(key)) refs.push({ kind: "label", ref: child, path: childPath });
    if (typeof child === "string" && isUrlRefKey(key)) refs.push({ kind: "url", ref: child, path: childPath });
    collectRefs(child, childPath, refs);
  });
  return refs;
};

const detectVisibleStringsInStructure = (value, path = "structure", errors = []) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => detectVisibleStringsInStructure(item, `${path}[${index}]`, errors));
    return errors;
  }
  if (!isObject(value)) return errors;
  Object.entries(value).forEach(([key, child]) => {
    const childPath = `${path}.${key}`;
    if (["label", "title", "subtitle", "description", "placeholder", "text"].includes(key) && typeof child === "string") {
      errors.push({ path: childPath, message: `Visible string "${key}" must use a ref key.` });
    }
    detectVisibleStringsInStructure(child, childPath, errors);
  });
  return errors;
};

export class PageContractError extends Error {
  constructor(errors) {
    super("Page contract validation failed");
    this.name = "PageContractError";
    this.errors = errors;
  }
}

export const validatePageContract = (payload = {}) => {
  const errors = [];
  const component = payload.component;
  if (payload.status !== "success") errors.push({ path: "status", message: "Expected status to be success." });
  if (!isObject(component)) errors.push({ path: "component", message: "Expected component object." });
  if (!isObject(component?.data)) errors.push({ path: "component.data", message: "Expected data object." });
  if (!isObject(component?.dataScope)) errors.push({ path: "component.dataScope", message: "Expected dataScope object." });
  if (!isObject(component?.dataScope?.options)) errors.push({ path: "component.dataScope.options", message: "Expected options object." });
  if (!isObject(component?.elements?.labels)) errors.push({ path: "component.elements.labels", message: "Expected labels object." });
  if (!isObject(component?.elements?.urls)) errors.push({ path: "component.elements.urls", message: "Expected urls object." });
  if (!isObject(component?.structure)) errors.push({ path: "component.structure", message: "Expected structure object." });
  if (!isObject(component?.structure?.header)) errors.push({ path: "component.structure.header", message: "Expected header object." });
  if (!Array.isArray(component?.structure?.widgets)) errors.push({ path: "component.structure.widgets", message: "Expected widgets array." });
  if (!isObject(component?.structure?.config)) errors.push({ path: "component.structure.config", message: "Expected config object." });
  if (!Array.isArray(component?.structure?.actions)) errors.push({ path: "component.structure.actions", message: "Expected actions array." });

  if (component?.structure && component?.elements) {
    collectRefs(component.structure).forEach(({ kind, ref, path }) => {
      const bag = kind === "label" ? component.elements.labels : component.elements.urls;
      if (!(ref in bag)) errors.push({ path, message: `Unresolved ${kind} ref "${ref}".` });
    });
    errors.push(...detectVisibleStringsInStructure(component.structure));
  }

  if (errors.length) throw new PageContractError(errors);
  return { valid: true };
};

export default function pageContractValidator(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (body?.component) {
      try {
        validatePageContract(body);
      } catch (error) {
        return originalJson({
          status: "error",
          message: error.message,
          errors: error.errors,
        });
      }
    }
    return originalJson(body);
  };
  next();
}
