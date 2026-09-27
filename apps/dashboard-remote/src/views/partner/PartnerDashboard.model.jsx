import React from "react";
import { Button } from "@packages/trem-ui";
import { ACTIVITY_ICONS, formatNumber, buildStats } from "../shared/dashboardHelpers";
import { widgetsFromTourAnalytics } from "../../dashboardWidgetAdapters";

export default function buildPartnerModel({
  source,
  dashboardWidgets,
  loading,
  error,
  onRefresh,
  onTabChange,
  realtime,
  onActivityPageChange,
}) {
  const open = (target) => {
    if (target) onTabChange?.(target);
  };
  const count = (value) => formatNumber(value, "en-IN");

  if (loading && !source) return { kind: "partner", pending: true };
  if (error && !source) {
    return {
      kind: "partner",
      fatal: {
        variant: "empty",
        icon: "alertTriangle",
        title: "Dashboard unavailable",
        description: error,
        action: <Button text="Try again" iconLeft="refreshCw" onClick={onRefresh} />,
      },
    };
  }
  if (!PARTNER_SCHEMAS.has(source?.schemaVersion)) {
    return {
      kind: "partner",
      fatal: {
        variant: "noData",
        title: "Dashboard data is unavailable",
        description: "Refresh the workspace to load the latest agency operations.",
        actionLabel: "Refresh",
        onAction: onRefresh,
      },
    };
  }

  const isClient = source.scope === "client" || source.scope === "client-agent";
  const isSupport = source.scope === "support" || source.scope === "assigned-support";

  const products = (source.products || []).map((product) => ({
    id: product.key || product.id,
    label: product.label,
    icon: product.icon || "map",
    target: product.target,
    total: product.total,
    description: product.description || "",
    statsDisplay: "row",
    stats: buildStats([
      { id: "published", label: "Published", value: count(product.published) },
      { id: "draft", label: "Drafts", value: count(product.draft) },
      { id: "pending", label: "Pending", value: count(product.pending) },
      { id: "upcoming", label: "Upcoming", value: count(product.upcoming) },
    ]),
  }));

  const workload = (source.workload || []).map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description || "",
    value: count(item.value),
    icon: item.icon,
    target: item.target,
    busy: Boolean(item.value),
  }));

  const activity = (source.recentActivity || []).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description || "",
    icon: item.icon || ACTIVITY_ICONS[item.type] || "map",
    status: item.status,
    occurredAt: item.occurredAt,
    target: item.target,
  }));

  const pagination = source.recentActivityPagination;
  const showPagination = Number(pagination?.totalPages) > 1;

  return {
    kind: "partner",
    live: realtime || null,
    notice: error
      ? {
          message: `${error} Showing the last available dashboard data.`,
          actionLabel: "Retry",
          onAction: onRefresh,
        }
      : null,
    hero: {
      eyebrow: source.hero?.eyebrow || source.viewer?.roleLabel,
      eyebrowIcon: isSupport ? "support" : "building2",
      ariaLabel: source.hero?.eyebrow,
      title: source.hero?.title,
      description: source.hero?.description,
      meta: [
        {
          label: source.agency?.name || source.client?.name,
          status: source.agency?.status || (isClient ? "active" : undefined),
        },
        { label: source.viewer?.roleLabel },
      ].filter((entry) => entry.label),
      action: {
        label: loading ? "Refreshing" : "Refresh",
        iconLeft: "refreshCw",
        variant: "outline",
        disabled: loading,
        onClick: onRefresh,
      },
    },
    metrics: {
      ariaLabel: source.kpiAriaLabel || "Operational summary",
      items: (source.kpis || []).map((metric) => ({
        id: metric.id,
        label: metric.label,
        value: count(metric.value),
        helper: metric.helper,
        icon: metric.icon,
        trailingIcon: metric.target ? "arrowUpRight" : "",
        onClick: metric.target ? () => open(metric.target) : undefined,
      })),
    },
    widgets:
      dashboardWidgets ||
      source.dashboardWidgets ||
      (source.tourAnalytics
        ? widgetsFromTourAnalytics(source.tourAnalytics, {
            title: "Tour performance",
            description: "Interest and booking activity for your tours.",
            target: "/agent/services/tours",
          })
        : null),
    journey: null,
    panels: {
      inventory: products.length
        ? {
            title: isClient ? "Client products" : "Product overview",
            description: isClient
              ? "Products assigned to this client."
              : "Publishing health across enabled TravelsTREM products.",
            items: products,
          }
        : null,
      workload: workload.length
        ? {
            ariaLabel: "Operational workload",
            eyebrow: "Today's focus",
            title: isSupport ? "Support workload" : "Operational workload",
            description: "Items that need attention across your current scope.",
            items: workload,
          }
        : null,
    },
    activity: Array.isArray(source.recentActivity)
      ? {
          ariaLabel: "Recent activity",
          title: "Recent activity",
          description: isClient
            ? "Updates belonging to this client will appear here."
            : isSupport
              ? "Updates from support tickets in your scope."
              : "Updates from products, enquiries and customer records.",
          items: activity,
          emptyState: {
            variant: "noData",
            title: "No recent activity",
            description: isClient
              ? "Client-owned activity will appear once records are linked to this client."
              : isSupport
                ? "Support ticket updates will appear here."
                : "Product, customer and enquiry updates will appear here.",
          },
          pagination: showPagination
            ? {
                currentPage: pagination.page,
                totalPages: pagination.totalPages,
                onPageChange: onActivityPageChange,
                disabled: loading,
                ariaLabel: "Recent activity pages",
              }
            : null,
        }
      : null,
    rail: {
      platform: null,
      overview: null,
      quickActions: {
        eyebrow: "Shortcuts",
        title: "Quick actions",
        description: "Jump directly to common partner workflows.",
        items: (source.quickActions || []).map((action) => ({
          id: action.id,
          label: action.label,
          description: action.description,
          icon: action.icon,
          target: action.target,
          variant: action.variant,
        })),
      },
    },
  };
}

