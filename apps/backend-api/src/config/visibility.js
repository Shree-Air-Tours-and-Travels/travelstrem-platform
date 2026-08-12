import config from "./env.js";

const isInactive = (value) => value === true || value === "true";

const applyHideFlags = (node) => {
  if (Array.isArray(node)) return node.map(applyHideFlags);
  if (!node || typeof node !== "object") return node;

  const next = { ...node };
  const hasDisabled = Object.prototype.hasOwnProperty.call(next, "disabled");
  const hasEnabled = Object.prototype.hasOwnProperty.call(next, "enabled");

  if (hasDisabled || hasEnabled) {
    const isActive = hasDisabled
      ? !isInactive(next.disabled)
      : isInactive(next.enabled);
    next.hide = config.IS_PRODUCTION ? !isActive : false;
  }

  for (const key of Object.keys(next)) {
    next[key] = applyHideFlags(next[key]);
  }

  return next;
};

export default applyHideFlags;
