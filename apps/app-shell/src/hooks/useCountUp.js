import { useEffect, useMemo, useRef, useState } from "react";

export function parseStatValue(value) {
  const text = String(value ?? "").trim();
  const match = /^(\d+)(.*)$/.exec(text);
  if (!match) return { value: 0, suffix: "", text };
  return { value: Number(match[1]), suffix: match[2], text };
}

// Fast easing with a slight overshoot (~2% past target) that settles exactly on it.
function easeOutBack(t) {
  const c1 = 0.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

const DEFAULT_DURATION = 900;
const VIEWPORT_MARGIN = "0px 0px -10% 0px";

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

export function useCountUp(targetText, { duration = DEFAULT_DURATION } = {}) {
  const parsed = useMemo(() => parseStatValue(targetText), [targetText]);
  const ref = useRef(null);
  const [display, setDisplay] = useState(() => {
    if (prefersReducedMotion() || !parsed.value) return parsed.text;
    return `0${parsed.suffix}`;
  });

  useEffect(() => {
    const { value, suffix, text } = parsed;

    if (!value) {
      setDisplay(text);
      return;
    }

    if (
      prefersReducedMotion() ||
      !ref.current ||
      typeof IntersectionObserver === "undefined"
    ) {
      setDisplay(text);
      return;
    }

    let raf = 0;
    let started = false;
    let startTime = 0;

    const tick = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const t = Math.min((timestamp - startTime) / duration, 1);
      const current = Math.round(value * easeOutBack(t));
      setDisplay(`${current}${suffix}`);
      if (t < 1) raf = window.requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          observer.disconnect();
          raf = window.requestAnimationFrame(tick);
        }
      },
      { rootMargin: VIEWPORT_MARGIN },
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [parsed, duration]);

  return [ref, display];
}