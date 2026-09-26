import React, { useEffect, useRef, useState } from "react";
import "./Loader.styles.scss";

const HIDE_ANIMATION_DELAY = 450;
const FINISH_CALLBACK_DELAY = 550;
const WAKE_UP_DELAY_SECONDS = 10;
const WAKE_UP_PHASES = [
  {
    title: "Waking up your travel workspace",
    description: "Our services are reconnecting after a quiet period.",
  },
  {
    title: "Opening your journey desk",
    description: "We are restoring tours, enquiries and booking tools.",
  },
  {
    title: "Bringing live updates online",
    description: "Your latest travel activity is being synchronized securely.",
  },
  {
    title: "Preparing the final details",
    description: "Your workspace is almost ready for take-off.",
  },
];

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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const hideTimerRef = useRef(null);
  const autoHideRef = useRef(null);
  const finishTimerRef = useRef(null);

  useEffect(() => {
    if (!visible) return undefined;
    setElapsedSeconds(0);
    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [visible]);

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
  const wakingUp = elapsedSeconds >= WAKE_UP_DELAY_SECONDS;
  const phaseIndex = wakingUp
    ? Math.min(WAKE_UP_PHASES.length - 1, Math.floor((elapsedSeconds - WAKE_UP_DELAY_SECONDS) / 10))
    : 0;
  const phase = WAKE_UP_PHASES[phaseIndex];
  const progress = Math.min(94, Math.max(8, Math.round((elapsedSeconds / 60) * 100)));

  return (
    <div
      className={`tt-loader tt-loader--fullscreen ${hiding ? "tt-loader--hiding" : ""} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy={show}
    >
      <div className="tt-loader__box">
        <div className="tt-loader__visual">
          <span className="tt-loader__eyebrow">TravelsTREM · Journey initialization</span>
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
          <div className="tt-loader__route" aria-hidden="true">
            <span />
            <span />
            <span />
            <b>✦</b>
          </div>
        </div>

        <div className="tt-loader__copy">
          <h1>{wakingUp ? phase.title : text}</h1>
          <p>
            {wakingUp
              ? phase.description
              : "Setting up a smooth, personalized travel experience for you."}
          </p>
        </div>

        <div className="tt-loader__progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>

        {wakingUp ? (
          <div className="tt-loader__wake-note">
            <strong>Your site is waking up</strong>
            <span>
              A sleeping service usually becomes ready within 60 seconds. Please stay with us.
            </span>
          </div>
        ) : null}

        <div className="tt-loader__milestones" aria-hidden="true">
          {["Workspace", "Journeys", "Live updates"].map((label, index) => (
            <span
              className={index <= Math.min(2, phaseIndex) && wakingUp ? "is-active" : ""}
              key={label}
            >
              <i />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
