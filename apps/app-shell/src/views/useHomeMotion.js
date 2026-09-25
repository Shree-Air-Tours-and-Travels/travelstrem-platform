import { useEffect, useRef } from "react";

// Observe actual viewport entry, including the app shell's nested scroll area.
export function useHomeMotion() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !window.IntersectionObserver || !Element.prototype.animate) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet();
    const running = new Set();
    const selector = "[data-home-reveal], [data-home-ambient], .dov__hero-search, .dov__hero-trust, .trem-home-features__header, .trem-home-feature-card";
    const duration = parseFloat(getComputedStyle(root).getPropertyValue("--home-enter-duration")) || 660;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (target.hasAttribute("data-home-ambient")) {
          target.dataset.homeVisible = String(isIntersecting && !preference.matches);
          return;
        }
        if (!isIntersecting) return;
        observer.unobserve(target);
        if (preference.matches) return;
        const title = target.dataset.homeReveal === "title";
        const animation = target.animate([
          { opacity: 0, transform: `translateY(${title ? 30 : 22}px)`, ...(title ? { clipPath: "inset(0 0 100% 0)" } : {}) },
          { opacity: 1, transform: "translateY(0)", ...(title ? { clipPath: "inset(0 0 0 0)" } : {}) },
        ], {
          duration,
          delay: Math.min(Number(target.dataset.homeOrder || target.style.getPropertyValue("--feature-index") || 0), 4) * 70,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "backwards",
        });
        running.add(animation);
        animation.finished.then(() => running.delete(animation), () => running.delete(animation));
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
    const observe = () => root.querySelectorAll(selector).forEach((element) => {
      if (seen.has(element)) return;
      seen.add(element);
      observer.observe(element);
    });
    const stopMotion = () => {
      if (preference.matches) running.forEach((animation) => animation.cancel());
    };
    observe();
    const mutations = new MutationObserver((records) => {
      if (records.some(({ addedNodes }) => [...addedNodes].some((node) => node.nodeType === 1))) observe();
    });
    mutations.observe(root, { childList: true, subtree: true });
    preference.addEventListener("change", stopMotion);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      preference.removeEventListener("change", stopMotion);
      running.forEach((animation) => animation.cancel());
    };
  }, []);
  return ref;
}
