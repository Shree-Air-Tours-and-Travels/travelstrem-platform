import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ScrollToTopButton from "../ScrollToTopButton/ScrollToTopButton.jsx";
import { scrollTargetsToTop } from "./scrollTargets.js";

export default function ScrollToTop({
  behavior = "instant",
  showButton = true,
  buttonProps = {},
} = {}) {
  const { pathname, search } = useLocation();

  useEffect(() => {
    scrollTargetsToTop(behavior);
  }, [behavior, pathname, search]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    let activeField = null;
    let frame = 0;
    const editableSelector =
      "input:not([type='hidden']):not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable='true']";

    const keepFieldVisible = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const keyboardInset = Math.max(
          0,
          window.innerHeight - viewport.height - viewport.offsetTop,
        );
        document.documentElement.style.setProperty("--trem-keyboard-inset", `${keyboardInset}px`);

        if (!activeField?.isConnected || keyboardInset < 80) return;
        const rect = activeField.getBoundingClientRect();
        const visibleTop = viewport.offsetTop + 16;
        const visibleBottom = viewport.offsetTop + viewport.height - 24;

        if (rect.bottom > visibleBottom || rect.top < visibleTop) {
          activeField.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
      });
    };

    const handleFocusIn = (event) => {
      if (!event.target?.matches?.(editableSelector)) return;
      activeField = event.target;
      keepFieldVisible();
      window.setTimeout(keepFieldVisible, 180);
    };

    const handleFocusOut = () => {
      activeField = null;
      window.setTimeout(keepFieldVisible, 120);
    };

    viewport.addEventListener("resize", keepFieldVisible);
    viewport.addEventListener("scroll", keepFieldVisible);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      window.cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", keepFieldVisible);
      viewport.removeEventListener("scroll", keepFieldVisible);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      document.documentElement.style.removeProperty("--trem-keyboard-inset");
    };
  }, []);

  return showButton ? <ScrollToTopButton {...buttonProps} /> : null;
}
