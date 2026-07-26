import React from "react";
import "./Note.styles.scss";

const TONE_ICON = {
  info: "info",
  warning: "alertTriangle",
  danger: "alertCircle",
  success: "checkCircle",
};

export default function Note({ tone = "info", icon, title, children, className = "" }) {
  const iconName = icon || TONE_ICON[tone] || "info";

  return (
    <div className={`trem-note trem-note--${tone} ${className}`} role="note">
      <span className="trem-note__icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          {tone === "danger" && <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 10.5v-5m0 3.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
          {tone === "warning" && <path d="M7.13 1.66a1 1 0 011.74 0l5.8 10.05A1 1 0 0113.8 13H2.2a1 1 0 01-.87-1.27L7.13 1.66zM8 6v3m0 2.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
          {tone === "success" && <path d="M13.5 4.5l-7 7L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
          {tone === "info" && <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 6.5v4m0-7h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
      </span>
      <div className="trem-note__content">
        {title && <strong className="trem-note__title">{title}</strong>}
        {children && <span className="trem-note__text">{children}</span>}
      </div>
    </div>
  );
}
