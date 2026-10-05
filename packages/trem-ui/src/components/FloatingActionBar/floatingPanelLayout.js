// Share the layout across federated apps that load their own Trem UI bundle.
const layoutKey = Symbol.for("trem.floatingPanelLayout");

function getLayout() {
  const layout = (window[layoutKey] ||= { panels: new Set(), hosts: new Map() });
  // Remove spacers left by an older bundle during development hot reload.
  if (layout.spacers) {
    for (const spacer of layout.spacers.values()) spacer.remove();
    delete layout.spacers;
  }
  layout.hosts ||= new Map();
  return layout;
}

function syncLayout() {
  const { panels, hosts: previousHosts } = getLayout();
  for (const [host, original] of previousHosts) {
    host.style.maxHeight = original.maxHeight;
    host.style.paddingBottom = original.paddingBottom;
  }
  const visible = [...panels].filter((panel) =>
    panel.isConnected && getComputedStyle(panel).position === "fixed" &&
    panel.getBoundingClientRect().height > 0,
  );
  const footers = visible.filter((panel) => panel.classList.contains("trem-fab--variant-mobile-navigation"));
  const actions = visible.filter((panel) => !footers.includes(panel));
  let bottom = 0;
  for (const panel of [...footers, ...actions]) {
    const original = panel.dataset.tremOriginalBottom;
    if (original) panel.style.bottom = original;
    else panel.style.removeProperty("bottom");
    const base = parseFloat(getComputedStyle(panel).bottom) || 0;
    // Footer navigation owns the bottom edge; page actions stack above it.
    panel.style.bottom = `${Math.max(base, bottom)}px`;
    bottom = window.innerHeight - panel.getBoundingClientRect().top + 12;
  }

  const hosts = new Set();
  const isScrollable = (node) => /(auto|scroll)/.test(getComputedStyle(node).overflowY);
  for (const panel of visible) {
    const scope = panel.closest(".trem-app-footer--withActions")?.parentElement || panel.parentElement;
    // Only independently scrolling content needs its own viewport limit.
    for (const node of scope.querySelectorAll("*")) {
      if (isScrollable(node) && node.clientHeight > 0 && node.scrollHeight > node.clientHeight &&
          !node.closest('[role="dialog"], .trem-fab')) hosts.add(node);
    }
    let host = scope;
    while (host && host !== document.body && !isScrollable(host)) host = host.parentElement;
    hosts.add(host || document.body);
  }

  for (const host of previousHosts.keys()) {
    if (!hosts.has(host)) previousHosts.delete(host);
  }
  for (const host of hosts) {
    if (!previousHosts.has(host)) previousHosts.set(host, {
      maxHeight: host.style.maxHeight,
      paddingBottom: host.style.paddingBottom,
    });
    if (host === document.body) {
      // Document scrolling has no independently sized viewport to shorten.
      const padding = parseFloat(getComputedStyle(host).paddingBottom) || 0;
      host.style.paddingBottom = `${padding + bottom}px`;
    } else {
      const available = Math.max(0, window.innerHeight - bottom - host.getBoundingClientRect().top);
      const existing = parseFloat(getComputedStyle(host).maxHeight);
      host.style.maxHeight = `${Number.isFinite(existing) ? Math.min(existing, available) : available}px`;
    }
  }
  const root = document.documentElement;
  if (bottom) root.style.setProperty("--trem-floating-action-clearance", `${Math.ceil(bottom)}px`);
  else root.style.removeProperty("--trem-floating-action-clearance");
}

export function registerFloatingPanel(panel) {
  const { panels } = getLayout();
  panel.dataset.tremOriginalBottom = panel.style.bottom;
  panels.add(panel);
  syncLayout();
  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(syncLayout) : null;
  observer?.observe(panel);
  window.addEventListener("resize", syncLayout);
  window.visualViewport?.addEventListener("resize", syncLayout);
  return () => {
    observer?.disconnect();
    window.removeEventListener("resize", syncLayout);
    window.visualViewport?.removeEventListener("resize", syncLayout);
    panels.delete(panel);
    if (panel.dataset.tremOriginalBottom) panel.style.bottom = panel.dataset.tremOriginalBottom;
    else panel.style.removeProperty("bottom");
    delete panel.dataset.tremOriginalBottom;
    syncLayout();
  };
}
