export function getScrollTargets() {
  if (typeof window === "undefined" || typeof document === "undefined") return [];
  return [
    window,
    ...document.querySelectorAll("[data-scroll-root]"),
  ];
}

export function getTargetScrollTop(target) {
  if (typeof window !== "undefined" && target === window) {
    return window.scrollY || document.documentElement.scrollTop || 0;
  }
  return target?.scrollTop || 0;
}

export function scrollTargetsToTop(behavior = "smooth") {
  getScrollTargets().forEach((target) => {
    target.scrollTo?.({ top: 0, left: 0, behavior });
  });
}
