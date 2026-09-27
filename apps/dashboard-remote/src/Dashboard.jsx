import React, { useMemo } from "react";
import { EmptyState, NoDataFound } from "@packages/trem-ui";
import AdminDashboardView from "./views/admin/AdminDashboard.view";
import buildAdminModel from "./views/admin/AdminDashboard.model";
import PartnerDashboardView from "./views/partner/PartnerDashboard.view";
import buildPartnerModel from "./views/partner/PartnerDashboard.model";
import TravellerDashboardView from "./views/traveller/TravellerDashboard.view";
import buildTravellerModel from "./views/traveller/TravellerDashboard.model";
import DashboardSkeleton from "./views/shared/DashboardSkeleton";

const PARTNER_SCHEMAS = new Set(["partner-dashboard.v1", "dashboard.v1"]);

function resolveModel(props) {
  const role = String(props.role || "");
  // Every shell states its role, so an explicit role always wins. Only fall
  // back to sniffing the payload when a caller omits it entirely.
  if (role) {
    if (role.startsWith("partner") || role.startsWith("client") || role.startsWith("support"))
      return buildPartnerModel(props);
    return role === "user" ? buildTravellerModel(props) : buildAdminModel(props);
  }
  if (PARTNER_SCHEMAS.has(props.source?.schemaVersion)) return buildPartnerModel(props);
  if (props.definition) return buildAdminModel(props);
  return buildTravellerModel(props);
}

export default function Dashboard(props) {
  const {
    loading,
    error,
    onRefresh,
    onTabChange,
    realtime,
    onActivityPageChange,
    definition,
    source,
    user,
    copy,
    metricsDefinition,
    stats,
    sections,
    journeyStage,
    journeyHero,
    recentActivity,
    upcomingTrips,
    recentEmptyState,
    upcomingEmptyState,
    overviewRail,
    isMasterAdmin,
    dashboardWidgets,
  } = props;

  const model = useMemo(
    () => resolveModel(props),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      props.role,
      definition,
      source,
      user,
      copy,
      metricsDefinition,
      stats,
      sections,
      journeyStage,
      journeyHero,
      recentActivity,
      upcomingTrips,
      recentEmptyState,
      upcomingEmptyState,
      overviewRail,
      loading,
      error,
      realtime,
      onActivityPageChange,
      onRefresh,
      onTabChange,
      isMasterAdmin,
      dashboardWidgets,
    ],
  );

  if (model?.pending) return <DashboardSkeleton />;

  if (model?.fatal) {
    if (model.fatal.variant === "noData") {
      return (
        <NoDataFound
          title={model.fatal.title}
          description={model.fatal.description}
          actionLabel={model.fatal.actionLabel}
          onAction={model.fatal.onAction}
        />
      );
    }
    // `variant` selects the renderer, so keep it out of EmptyState's DOM spread.
    const { variant: _variant, ...emptyStateProps } = model.fatal;
    return <EmptyState {...emptyStateProps} />;
  }

  if (!model) return null;

  const View = model.kind === "admin"
    ? AdminDashboardView
    : model.kind === "partner" ? PartnerDashboardView : TravellerDashboardView;
  return <View {...props} model={model} />;
}
