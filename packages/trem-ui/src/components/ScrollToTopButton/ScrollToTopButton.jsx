import React, { useCallback, useEffect, useState } from "react";
import {
  getScrollTargets,
  getTargetScrollTop,
  scrollTargetsToTop,
} from "../ScrollToTop/scrollTargets.js";
import "./ScrollToTopButton.styles.scss";

const SCROLL_THRESHOLD = 400;

export default function ScrollToTopButton({ bottom = "1.5rem", right = "1.5rem" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(getScrollTargets().some(
        (target) => getTargetScrollTop(target) > SCROLL_THRESHOLD,
      ));
    }
    const targets = getScrollTargets();
    targets.forEach((target) => target.addEventListener("scroll", handleScroll, { passive: true }));
    handleScroll();
    return () => targets.forEach((target) => target.removeEventListener("scroll", handleScroll));
  }, []);

  const handleClick = useCallback(() => {
    scrollTargetsToTop("smooth");
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="trem-scroll-top"
      onClick={handleClick}
      aria-label="Scroll to top"
      style={{ bottom, right }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 16V4M10 4l-5 5M10 4l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
