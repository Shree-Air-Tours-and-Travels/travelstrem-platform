import React from "react";
import DashboardFrame from "../shared/DashboardFrame";
import DashboardSnapshots from "../shared/DashboardSnapshots";
import DashboardOperations from "../shared/DashboardOperations";
export default function PartnerDashboardView(props) {
  return <DashboardFrame model={props.model}>
    <DashboardOperations {...props}>
      <DashboardSnapshots {...props} widgets={props.model.widgets} />
    </DashboardOperations>
  </DashboardFrame>;
}
