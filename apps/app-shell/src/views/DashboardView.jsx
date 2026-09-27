import React, { Suspense } from "react";
import { Preloader } from "@packages/trem-ui";

const Dashboard = React.lazy(() => import("dashboard/Dashboard"));

export default function DashboardView({
  onSearch, onSearchSelect, searchConfig, featuredTravel, travellerLayout,
  user,
  isAuthenticated,
  userSnapshots,
  guestDashboard,
  clientDashboard,
  supportDashboard,
  stats,
  copy = {},
  journeyStage = "discover",
  journeyHero,
  sections = {},
  metricsDefinition,
  recentActivity = [],
  upcomingTrips = [],
  recentEmptyState,
  upcomingEmptyState,
  overviewRail,
  overviewDefinitionLoading = false,
  overviewStatsLoading = false,
  onTabChange,
}) {
  return (
    <Suspense fallback={<Preloader variant="grid" count={4} label="Loading dashboard" />}>
      <Dashboard
        onSearch={onSearch} onSearchSelect={onSearchSelect} searchConfig={searchConfig}
        featuredTravel={featuredTravel} travellerLayout={travellerLayout}
        role={clientDashboard?.viewer?.role || supportDashboard?.viewer?.role || "user"}
        user={user}
        isAuthenticated={isAuthenticated}
        userSnapshots={userSnapshots}
        guestDashboard={guestDashboard}
        source={clientDashboard || supportDashboard}
        stats={stats}
        copy={copy}
        metricsDefinition={metricsDefinition}
        sections={sections}
        journeyStage={journeyStage}
        journeyHero={journeyHero}
        recentActivity={recentActivity}
        upcomingTrips={upcomingTrips}
        recentEmptyState={recentEmptyState}
        upcomingEmptyState={upcomingEmptyState}
        overviewRail={overviewRail}
        loading={overviewDefinitionLoading || overviewStatsLoading}
        onTabChange={onTabChange}
      />
    </Suspense>
  );
}
