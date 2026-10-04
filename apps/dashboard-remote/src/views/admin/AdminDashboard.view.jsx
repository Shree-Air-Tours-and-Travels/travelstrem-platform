import "./AdminDashboard.scss";
import React from "react";
import AdminDashboardWidgets from "../../widgets/AdminDashboardWidgets";
import DashboardFrame from "../shared/DashboardFrame";
import DashboardSnapshots from "../shared/DashboardSnapshots";
export default function AdminDashboardView({ model, definition, source, fetchWidgetData, onTabChange }) {
  return <DashboardFrame model={model}>
    <AdminDashboardWidgets definition={definition} fetchWidgetData={fetchWidgetData} onTabChange={onTabChange} />
    <DashboardSnapshots definition={definition} source={source} widgets={model.widgets} />
  </DashboardFrame>;
}
