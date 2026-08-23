/** Minor-unit (paise) formatting shared by pricing surfaces. */
export const formatMinor = (minor, currency) => {
  const amount = Number(minor);
  if (!Number.isFinite(amount)) return "—";
  if (currency) {
    try {
      return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount / 100);
    } catch {
      /* fall through to plain formatting */
    }
  }
  return `${amount} minor units`;
};

export const toDecimalMajor = (minor) => {
  const amount = Number(minor);
  return Number.isFinite(amount) ? amount / 100 : 0;
};

/** UI package tier labels ↔ backend tier enums. Mapping is supplied by the backend definition. */
export const resolveTierLabel = (tier, tierLabels = {}) =>
  tierLabels[tier] || (tier ? tier.charAt(0) + tier.slice(1).toLowerCase() : "");

export const enabledPackages = (packages = []) =>
  (packages || []).filter((item) => item?.enabled !== false);

export const componentsByGroup = (components = []) => {
  const groups = {};
  (components || [])
    .filter((component) => component.active !== false)
    .forEach((component) => {
      groups[component.type] = [...(groups[component.type] || []), component];
    });
  return groups;
};
