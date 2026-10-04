import { useEffect, useRef } from "react";

const DEFAULT_DISTANCE = 0.5;

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

// The app-shell scrolls inside a nested container (.dash-content), not window.
// Walk up to find the nearest scrollable ancestor so scroll events fire reliably.
function getScrollParent(node) {
  let current = node?.parentElement;
  while (current && current !== document.documentElement) {
    const { overflowY } = window.getComputedStyle(current);
    if (/(auto|scroll|overlay)/.test(overflowY)) return current;
    current = current.parentElement;
  }
  return null; // document-level scrolling
}

// Ties content reveal to scroll position. Sets --reveal-progress on the element
// from 0 (fully hidden / sliding out) to 1 (settled in place) based on how far
// the section's top edge has travelled up from the bottom of the viewport:
// - Scrolling down: the section enters from below, progress rises 0 -> 1.
// - Scrolling up: the section moves back down, progress falls 1 -> 0.
// Scroll-linked, so it follows the scroll in both directions, every time.
export function useScrollReveal({ distance = DEFAULT_DISTANCE } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const setProgress = (value) => {
      el.style.setProperty("--reveal-progress", value.toFixed(3));
    };

    if (prefersReducedMotion()) {
      setProgress(1);
      return;
    }

    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const raw = (viewport - rect.top) / (distance * viewport);
      setProgress(Math.max(0, Math.min(1, raw)));
    };

    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    const scrollParent = getScrollParent(el) || window;
    scrollParent.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Belt-and-suspenders if the computed-style scan misses the container.
    window.addEventListener("scroll", schedule, { passive: true });
    update();

    return () => {
      scrollParent.removeEventListener("scroll", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [distance]);

  return ref;
}