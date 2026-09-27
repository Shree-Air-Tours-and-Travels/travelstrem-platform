import "./DashboardFrame.scss";
import "./DashboardSkeleton.scss";
import React from "react";

export default function DashboardSkeleton() {
  return (
    <div className="admin-overview admin-overview--loading" aria-label="Loading dashboard">
      <div className="admin-overview__skeleton is-hero" />
      <div className="admin-overview__skeleton-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="admin-overview__skeleton" key={index} />
        ))}
      </div>
      <div className="admin-overview__skeleton is-panel" />
    </div>
  );
}

