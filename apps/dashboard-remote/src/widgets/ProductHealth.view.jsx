import React from "react";
import { DashboardPanel } from "@packages/trem-ui";

export default function ProductHealthView({ widget, data, labels, onTabChange }) {
  return <DashboardPanel
    title={labels?.[widget.props?.titleRef] || "Product health"}
    description={labels?.[widget.props?.descriptionRef]}
    icon="travelPackage"
    items={(data.inventory || []).map((product) => ({
      id: product.id, icon: product.icon, label: product.label, value: product.total, target: product.target,
      stats: [
        { id: "published", value: product.published, label: labels?.published || "Published" },
        { id: "draft", value: product.draft, label: labels?.draft || "Draft" },
        { id: "pending", value: product.pending, label: labels?.pending || "Pending" },
      ],
    }))}
    onItemClick={onTabChange}
    emptyTitle="No active products"
  />;
}
