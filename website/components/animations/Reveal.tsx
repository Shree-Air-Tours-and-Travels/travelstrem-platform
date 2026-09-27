"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";

type RevealProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  delay?: number;
  variant?: "rise" | "media" | "slide";
};

// Content is visible without JavaScript. Motion only starts when it enters view.
export function Reveal({ children, className = "", delay = 0, variant = "rise", ...props }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    if (!node || preference.matches) return;
    let animation: Animation | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const frames = variant === "media"
        ? [{ clipPath: "inset(5% 0 0 round 16px)", transform: "translateY(20px) scale(.98)" }, { clipPath: "inset(0 round 16px)", transform: "none" }]
        : [{ transform: variant === "slide" ? "translateX(24px)" : "translateY(24px)", opacity: .6 }, { transform: "none", opacity: 1 }];
      animation = node.animate(frames, { duration: 700, delay, easing: "cubic-bezier(0, 0, 0.2, 1)" });
      observer.disconnect();
    }, { threshold: .08 });
    const stop = () => { if (preference.matches) { animation?.cancel(); observer.disconnect(); } };
    observer.observe(node);
    preference.addEventListener("change", stop);
    return () => { observer.disconnect(); animation?.cancel(); preference.removeEventListener("change", stop); };
  }, [delay, variant]);
  return <div ref={ref} className={`reveal ${className}`} {...props}>{children}</div>;
}
