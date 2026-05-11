// File: src/components/GlobalLoader/GlobalLoader.jsx
import React, { useEffect, useRef, useState } from "react";
import "./loader.style.scss";

/**
 * GlobalLoader
 * Props:
 * - visible: boolean - controls whether loader shows (fullscreen blocking). default: true
 * - size: number (px) - diameter of the SVG globe. default 96
 * - text: string - label below the loader. default: "Preparing your TravelsTREM experience..."
 * - className: string - extra class names
 * - onFinish: () => void - called after hide animation and smooth scroll complete
 * - autoHideAfter: number (ms) - optional timeout to auto-hide the loader
 *
 * Behavior:
 * - When visible=true, loader appears as a centered full-screen overlay and blocks all interaction.
 * - When visible becomes false (or autoHideAfter expires), loader plays a smooth fade-out,
 *   scrolls the page to top with smooth behavior, then calls onFinish.
 * - While visible, body scrolling is disabled to prevent background interaction.
 */
export default function GlobalLoader({
  visible = true,
  size = 120,
  text = "Preparing your TravelsTREM experience...",
  className = "",
  onFinish = () => {},
  autoHideAfter = null,
}) {
  const [show, setShow] = useState(visible);
  const [hiding, setHiding] = useState(false);
  const hideTimerRef = useRef(null);
  const autoHideRef = useRef(null);

  // Keep show in sync with visible prop
  useEffect(() => {
    if (visible) {
      setShow(true);
      setHiding(false);
    } else if (show) {
      // start hide animation
      setHiding(true);
      // after animation ends (match CSS --loader-fade-duration), complete hide
      hideTimerRef.current = setTimeout(() => {
        setShow(false);
        setHiding(false);
        // smooth scroll to top
        try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
        // allow scroll restoration after a short delay (match smooth scroll)
        setTimeout(() => onFinish && onFinish(), 550);
      }, 450);
    }

    return () => {
      clearTimeout(hideTimerRef.current);
    };
  }, [visible]);

  // Optional auto-hide
  useEffect(() => {
    if (autoHideAfter && visible) {
      autoHideRef.current = setTimeout(() => {
        setHiding(true);
        setTimeout(() => {
          setShow(false);
          setHiding(false);
          try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
          setTimeout(() => onFinish && onFinish(), 550);
        }, 450);
      }, autoHideAfter);
    }

    return () => clearTimeout(autoHideRef.current);
  }, [autoHideAfter, visible]);

  // Lock body scroll & keyboard focus while visible
  useEffect(() => {
    if (show) {
      // preserve previous values
      const prevOverflow = document.body.style.overflow;
      const prevPointer = document.body.style.pointerEvents;
      document.body.style.overflow = "hidden"; // prevent scrolling
      document.body.style.pointerEvents = "none"; // prevent clicks on body
      // allow interactions inside loader itself
      const overlay = document.querySelector('.tt-loader--fullscreen');
      if (overlay) overlay.style.pointerEvents = 'auto';

      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.pointerEvents = prevPointer;
      };
    }
  }, [show]);

  if (!show) return null;

  const style = { width: size, height: size };

  return (
    <div
      className={`tt-loader tt-loader--fullscreen ${hiding ? 'tt-loader--hiding' : ''} ${className}`}
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
