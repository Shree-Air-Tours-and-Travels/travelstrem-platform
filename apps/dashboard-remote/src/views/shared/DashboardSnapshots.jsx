import "./DashboardLayout.scss";
import React from "react";
import { MetricSnapshot } from "@packages/trem-ui";
export default function DashboardSnapshots({ source, definition, widgets }) {
  return <>
      {(() => {
        const data = source || definition?.data || {};
        const snapshots = [
          data.revenueSnapshot || widgets?.revenueSnapshot,
          data.responsePerformance || widgets?.responsePerformance,
        ]
          .filter(
            (snapshot, index) =>
              !definition?.structure?.widgets?.some(
                (widget) =>
                  widget.type === ["RevenueSnapshot", "ResponsePerformance"][index] &&
                  widget.props?.endpoint &&
                  widget.props?.hidden !== true,
              ),
          )
          .filter((snapshot) =>
            snapshot?.items?.some((item) => item.value != null && item.value !== ""),
          );
        return snapshots.length ? (
          <div className="admin-overview__activity-grid admin-overview__snapshots">
            {snapshots.map((snapshot, index) => (
              <MetricSnapshot key={snapshot.id || index} {...snapshot} />
            ))}
          </div>
        ) : null;
      })()}

  </>;
}
