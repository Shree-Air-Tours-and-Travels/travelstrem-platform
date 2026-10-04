import React from "react";
import { Button } from "@packages/trem-ui";
import { ACTIVITY_ICONS, PLATFORM_ROWS, labelFor, timeOfDay, firstNameOf, buildStats } from "../shared/dashboardHelpers";
import { widgetsFromTourAnalytics } from "../../dashboardWidgetAdapters";

export default function buildAdminModel(props) {
  const { definition, user, loading, error, onRefresh, onTabChange, isMasterAdmin } = props;
  if (!definition) {
    if (loading) return { kind: "admin", pending: true };
    if (error) {
      return {
        kind: "admin",
        fatal: {
          variant: "empty",
          icon: "alertTriangle",
          title: "Administration dashboard unavailable",
          description: error,
          action: <Button text="Try again" iconLeft="refreshCw" onClick={onRefresh} />,
        },
      };
    }
    // Neither loading nor errored, yet the definition never arrived: render the
    // shell from an empty contract rather than leaving the portal blank.
    return buildAdminModel({ ...props, definition: {} });
  }

  const labels = definition.elements?.labels || {};
  const structure = definition.structure || {};
  const data = definition.data || {};
  const widget = (type) =>
    (structure.widgets || []).find((item) => item.type === type)?.props || {};

  const metricsWidget = widget("AdminMetrics");
  const inventoryWidget = widget("InventoryHealth");
  const governanceWidget = widget("GovernanceQueue");
  const platformWidget = widget("PlatformReach");
  const recentWidget = widget("RecentActivity");
  const actionWidget = widget("QuickActions");

  const inventory = (data[inventoryWidget.dataKey] || []).map((product) => ({
    id: product.id,
    label: product.label,
    icon: product.icon || "map",
    target: product.target,
    total: product.total,
    description: product.description || "",
    // The admin contract has no per-product description, so the publishing
    // counts stay on the single summary line the backend definition implies.
    statsDisplay: "inline",
    stats: buildStats([
      {
        id: "published",
        label: labelFor(labels, "published", "Published"),
        value: product.published,
      },
      { id: "draft", label: labelFor(labels, "draft", "Draft"), value: product.draft },
      { id: "pending", label: labelFor(labels, "pending", "Pending"), value: product.pending },
    ]),
  }));

  const workload = (data[governanceWidget.dataKey] || []).map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description || "",
    value: item.value,
    icon: item.icon,
    target: item.target,
    busy: Boolean(item.value),
  }));

  const activity = (data[recentWidget.dataKey] || []).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description || "",
    icon: item.icon || ACTIVITY_ICONS[item.type] || "map",
    status: item.status,
    occurredAt: item.occurredAt,
    target: item.target,
  }));

  const platformRows = PLATFORM_ROWS.map((key) => ({
    id: key,
    label: labelFor(labels, key),
    value: data[platformWidget.dataKey]?.[key] ?? 0,
  }));

  return {
    kind: "admin",
    hero: {
      eyebrow: labelFor(labels, "eyebrow"),
      eyebrowIcon: null,
      ariaLabel: labelFor(labels, "eyebrow"),
      title: `Good ${timeOfDay()}, ${firstNameOf(user) || "Admin"}`,
      description: labelFor(labels, "dashboardDescription"),
      meta: [],
      action: {
        label: labelFor(labels, "refresh"),
        iconLeft: "refreshCw",
        variant: "outline",
        disabled: loading,
        onClick: onRefresh,
      },
    },
    metrics: {
      ariaLabel: labelFor(labels, metricsWidget.ariaLabelRef, "Platform overview"),
      items: (metricsWidget.items || []).map((item) => ({
        id: item.id,
        label: item.label || labelFor(labels, item.labelRef, item.id),
        value: data.metrics?.[item.metric] ?? 0,
        icon: item.icon,
        trailingIcon: "chevronRight",
        onClick: item.target ? () => onTabChange?.(item.target) : undefined,
      })),
    },
    widgets:
      props.dashboardWidgets ||
      data.dashboardWidgets ||
      (data.tourAnalytics
        ? widgetsFromTourAnalytics(data.tourAnalytics, {
            title: "Platform tour performance",
            description:
              "Track traveller interest, conversion signals and automatically trending tours across the platform.",
            target: "services",
            onViewAll: isMasterAdmin ? () => onTabChange?.("tracking") : undefined,
          })
        : null),
    journey: null,
    panels: {
      inventory: inventory.length
        ? {
            title: labelFor(labels, inventoryWidget.titleRef),
            description: labelFor(labels, inventoryWidget.descriptionRef),
            items: inventory,
          }
        : null,
      workload: workload.length
        ? {
            title: labelFor(labels, governanceWidget.titleRef),
            description: labelFor(labels, governanceWidget.descriptionRef),
            items: workload,
          }
        : null,
    },
    activity: {
      ariaLabel: labelFor(labels, recentWidget.titleRef),
      title: labelFor(labels, recentWidget.titleRef),
      description: labelFor(labels, recentWidget.descriptionRef),
      items: activity,
      emptyState: {
        variant: "empty",
        icon: "clock",
        title: labelFor(labels, recentWidget.emptyTitleRef),
        description: labelFor(labels, recentWidget.emptyDescriptionRef),
      },
    },
    rail: {
      platform: platformRows.some((row) => row.value)
        ? {
            title: labelFor(labels, platformWidget.titleRef),
            description: labelFor(labels, platformWidget.descriptionRef),
            rows: platformRows,
          }
        : null,
      overview: null,
      quickActions: (structure.actions || []).filter(
        (action) => !action.masterOnly || isMasterAdmin,
      ).length
        ? {
            title: labelFor(labels, actionWidget.titleRef),
            description: labelFor(labels, actionWidget.descriptionRef),
            items: (structure.actions || [])
              .filter((action) => !action.masterOnly || isMasterAdmin)
              .map((action) => ({
                id: action.id,
                label: action.label || labelFor(labels, action.labelRef),
                description: action.description || labelFor(labels, action.descriptionRef),
                icon: action.icon,
                target: action.target,
                variant: action.variant,
              })),
          }
        : null,
    },
  };
}

