import React from "react";
import "./StatsCard.scss";

export default function StatsCard({ label, value, icon, trend, trendLabel }) {
  return (
    <div className="dsc">
      <div className="dsc__header">
        <span className="dsc__label">{label}</span>
        {icon && (
          <span className="dsc__icon">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path fillRule="evenodd" d={icon} clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>
      <div className="dsc__value">{value}</div>
      {(trend || trendLabel) && (
        <div className={`dsc__trend ${trend === "up" ? "dsc__trend--up" : trend === "down" ? "dsc__trend--down" : ""}`}>
          {trend === "up" && <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M8 4l4 4H9v4H7V8H4l4-4z" /></svg>}
          {trend === "down" && <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M8 12l-4-4h3V4h2v4h3l-4 4z" /></svg>}
          <span>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
