import React from "react";

export const WidgetSkeleton = ({ compact = false }) => (
  <div className={`tour-detail__skeleton${compact ? " tour-detail__skeleton--compact" : ""}`} />
);

export const WidgetError = ({ message = "This section could not load." }) => (
  <p className="tour-detail__muted tour-detail__muted--error">{message}</p>
);
