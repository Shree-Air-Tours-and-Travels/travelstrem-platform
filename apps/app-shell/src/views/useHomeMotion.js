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
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (target.hasAttribute("data-home-ambient")) {
          target.dataset.homeVisible = String(isIntersecting && !preference.matches);
          return;
        }
        if (!isIntersecting) return;
        observer.unobserve(target);
        if (preference.matches) return;
        const isHeading = target.dataset.homeReveal === "title";
        const isCard = target.matches(".dov__advantage-card, .dov__article-card, .trem-home-feature-card");
        const isSearch = target.classList.contains("dov__hero-search");
        const distance = isSearch ? 26 : isHeading || isCard ? 20 : 14;
        const animation = target.animate([
          { opacity: isHeading || isCard ? 0.48 : 0.62, transform: `translateY(${distance}px)` },
          { opacity: 1, transform: "translateY(0)" },
        ], {
          duration: isSearch ? 820 : isHeading ? 760 : 650,
          delay: Math.min(Number(target.dataset.homeOrder) || 0, 3) * 75,
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
