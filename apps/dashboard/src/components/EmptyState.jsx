import React from "react";
import "./EmptyState.scss";

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="des">
      {icon && (
        <div className="des__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
            <path d={icon} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      <h3 className="des__title">{title || "Nothing here yet"}</h3>
      {description && <p className="des__desc">{description}</p>}
      {action && (
        <button className="des__action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
