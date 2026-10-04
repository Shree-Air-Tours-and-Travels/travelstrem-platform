import "./DashboardFrame.scss";
import React from "react";
import { Preloader } from "@packages/trem-ui";

export default function DashboardSkeleton() {
  return <div className="admin-overview admin-overview--loading">
    <Preloader variant="dashboard" label="Loading dashboard" />
  </div>;
}
