export function applyDocumentBranding(brand = {}, { tenant = false } = {}) {
  if (typeof document === "undefined") return;
  document.title = brand.windowTitle || brand.label || brand.name || "Travel";
  const favicon = brand.faviconSrc || brand.logoSrc;
  document
    .querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')
    .forEach((link) => link.remove());
  const link = document.createElement("link");
  link.rel = "icon";
  link.href = favicon || "data:,";
  document.head.appendChild(link);
}
