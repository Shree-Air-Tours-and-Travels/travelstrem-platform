import React, { useEffect, useRef, useState } from "react";
import "./Loader.styles.scss";

const HIDE_ANIMATION_DELAY = 450;
const FINISH_CALLBACK_DELAY = 550;

export default function GlobalLoader({
  visible = true,
  size = 120,
  text = "Preparing your TravelsTrem experience...",
  className = "",
  onFinish = () => {},
  autoHideAfter = null,
}) {
  const [show, setShow] = useState(visible);
  const [hiding, setHiding] = useState(false);
  const hideTimerRef = useRef(null);
  const autoHideRef = useRef(null);
  const finishTimerRef = useRef(null);

  const completeHide = React.useCallback(() => {
    setShow(false);
    setHiding(false);
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      window.scrollTo(0, 0);
    }
    finishTimerRef.current = setTimeout(() => onFinish?.(), FINISH_CALLBACK_DELAY);
  }, [onFinish]);

  // Keep show in sync with visible prop
  useEffect(() => {
    if (visible) {
      setShow(true);
      setHiding(false);
    } else if (show) {
      setHiding(true);
      hideTimerRef.current = setTimeout(completeHide, HIDE_ANIMATION_DELAY);
    }

    return () => {
      clearTimeout(hideTimerRef.current);
      clearTimeout(finishTimerRef.current);
    };
  }, [completeHide, show, visible]);

  // Optional auto-hide
  useEffect(() => {
    if (autoHideAfter && visible) {
      autoHideRef.current = setTimeout(() => {
        setHiding(true);
        hideTimerRef.current = setTimeout(completeHide, HIDE_ANIMATION_DELAY);
      }, autoHideAfter);
    }

    return () => {
      clearTimeout(autoHideRef.current);
      clearTimeout(hideTimerRef.current);
      clearTimeout(finishTimerRef.current);
    };
  }, [autoHideAfter, completeHide, visible]);

  // Lock body scroll while visible
  useEffect(() => {
    if (show) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [show]);

  // Safety: always restore body styles on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
    };
  }, []);

  if (!show) return null;

  const style = { width: size, height: size };

  return (
    <div
      className={`tt-loader tt-loader--fullscreen ${hiding ? "tt-loader--hiding" : ""} ${className}`}
      role="alert"
      aria-live="assertive"
      aria-busy={show}
    >
      <div className="tt-loader__box">
        <svg className="tt-globe" viewBox="0 0 100 100" style={style} aria-hidden="true">
          <g className="tt-globe__group">
            <circle className="tt-ring" cx="50" cy="50" r="40" fill="none" strokeWidth="3" />
            <ellipse className="tt-orbit" cx="50" cy="50" rx="42" ry="18" fill="none" />
            <g className="tt-latitudes">
              <ellipse cx="50" cy="34" rx="26" ry="6" />
              <ellipse cx="50" cy="50" rx="30" ry="8" />
              <ellipse cx="50" cy="66" rx="26" ry="6" />
            </g>
            <g className="tt-continents">
              <path d="M36 42c3-2 8-3 12-2s8 4 9 6-2 6-6 7-11 0-14-3-2-6-1-8z" />
              <path d="M62 58c3 1 6 1 9 0s5-3 6-4 1 4-1 7-5 4-8 4-6-2-6-7z" />
            </g>
            <circle className="tt-satellite" cx="50" cy="10" r="2.2" />
          </g>
        </svg>

        <div className="tt-loader__label">{text}</div>
      </div>
    </div>
  );
}
