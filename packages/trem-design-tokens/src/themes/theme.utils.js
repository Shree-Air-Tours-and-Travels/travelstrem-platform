import { defaultTheme } from "./default.js";

// API contract: { tenantId, light: { "--color-primary": "..." }, dark: { ... } }.
// Only supported colour variables may be overridden; no arbitrary CSS or URLs.
const validValue = value => typeof value === "string" && value.length < 256 &&
  !/[;{}<>\\]|url\s*\(|\/\*/i.test(value) &&
  /^(#[\da-f]{3,8}|(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color|color-mix|var)\([\w\s.,%#+*/()-]+\)|[a-z]+)$/i.test(value);
export function resolveTenantTheme({ tenantId, tenantTheme, tenantThemes = {}, mode = "light" } = {}) {
  const resolvedMode = mode === "dark" ? "dark" : "light";
  const config = tenantTheme && (!tenantId || !tenantTheme.tenantId || tenantTheme.tenantId === tenantId)
    ? tenantTheme : Object.prototype.hasOwnProperty.call(tenantThemes, tenantId) ? tenantThemes[tenantId] : null;
  const variables = { ...defaultTheme[resolvedMode] };
  for (const [key, value] of Object.entries(config?.[resolvedMode] || {})) {
    if (key.startsWith("--color-") && Object.prototype.hasOwnProperty.call(variables, key) && validValue(value)) {
      variables[key] = value;
    }
  }
  return { tenantId: config?.tenantId || (config ? tenantId : null) || defaultTheme.tenantId, mode: resolvedMode, variables };
}

export function applyTenantTheme(options = {}, element = typeof document === "undefined" ? null : document.documentElement) {
  if (!element) return () => {};
  const resolved = resolveTenantTheme(options);
  const previous = Object.entries(resolved.variables).map(([key]) => [key, element.style.getPropertyValue(key), element.style.getPropertyPriority(key)]);
  const tenant = element.getAttribute("data-tenant");
  for (const [key, value] of Object.entries(resolved.variables)) element.style.setProperty(key, value);
  element.setAttribute("data-tenant", resolved.tenantId);
  return () => {
    for (const [key, value, priority] of previous) {
      if (value) element.style.setProperty(key, value, priority);
      else element.style.removeProperty(key);
    }
    if (tenant === null) element.removeAttribute("data-tenant");
    else element.setAttribute("data-tenant", tenant);
  };
}
