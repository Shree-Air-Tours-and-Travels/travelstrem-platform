const URL_REF_KEYS = new Set(["hrefRef", "actionHrefRef", "urlRef"]);

const resolveRefValue = (key, ref, labels, urls) => {
  if (URL_REF_KEYS.has(key) || /(?:href|url)Ref$/i.test(key)) {
    return urls?.[ref] ?? "";
  }
  return labels?.[ref] ?? "";
};

/**
 * Converts backend contract properties such as titleRef and hrefRef into
 * component-ready title and href values. The source contract remains fully
 * label/URL driven while presentation components receive ordinary props.
 */
export default function resolveContractRefs(value, labels = {}, urls = {}) {
  if (Array.isArray(value)) {
    return value.map((item) => resolveContractRefs(item, labels, urls));
  }
  if (!value || typeof value !== "object") return value;

  return Object.entries(value).reduce((resolved, [key, child]) => {
    if (key.endsWith("Ref") && typeof child === "string") {
      resolved[key.slice(0, -3)] = resolveRefValue(key, child, labels, urls);
      return resolved;
    }
    resolved[key] = resolveContractRefs(child, labels, urls);
    return resolved;
  }, {});
}
