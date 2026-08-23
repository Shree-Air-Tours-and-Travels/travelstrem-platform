import React, { useEffect, useRef, useState } from "react";
import "./SmoothScroll.styles.scss";

const VARIANT_MAP = {
  fadeIn: "ss-fade-in",
  slideUp: "ss-slide-up",
  slideDown: "ss-slide-down",
  slideLeft: "ss-slide-left",
  slideRight: "ss-slide-right",
  scaleIn: "ss-scale-in",
  zoomIn: "ss-zoom-in",
};

export default function SmoothScroll({
  children,
  variant = "slideUp",
  delay = 0,
  duration = 0.6,
  threshold = 0.15,
  once = true,
  className = "",
  as = "div",
  style,
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const variantClass = VARIANT_MAP[variant] || "ss-slide-up";

  return React.createElement(
    as,
    {
      ref,
      className: `ss-wrapper ${variantClass}${visible ? " is-visible" : ""} ${className}`.trim(),
      style: {
        ...style,
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}s`,
      },
    },
    children,
  );
}
