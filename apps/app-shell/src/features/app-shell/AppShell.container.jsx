import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchData,
  notifyDataChanged,
  slugify,
  useRefreshOnActivation,
} from "@packages/trem-utils";
import { useEnquiryRealtime, useRealtimeStatus } from "@packages/trem-ui";
import { useAppShellConfig } from "../../app/providers/AppShellProvider";
import OverviewView from "../../views/OverviewView";
import FavoritesView from "../../views/FavoritesView";
import ProfileView from "../../views/ProfileView";
import BookingsView from "../../views/BookingsView";
import "./AppShell.styles.scss";

const PRODUCT_URLS = { trevista: process.env.REACT_APP_TREVISTA_URL };

export default function AppShellContainer({ activeTab = "overview", onTabChange }) {
  const navigate = useNavigate();
  const { session } = useAppShellConfig();
  const user = session?.user || {};
  const [planCards, setPlanCards] = useState(null);
  const [overviewRail, setOverviewRail] = useState(null);
  const [metricsDefinition, setMetricsDefinition] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [overviewDefinitionLoading, setOverviewDefinitionLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // The dashboard page definition carries user-scoped data (metrics, recent
  // bookings & enquiries, upcoming trips) in the same response as the markup.
  const loadOverview = useCallback(() => {
    setOverviewDefinitionLoading(true);
    return fetchData("/pages/app-shell/app-shell")
      .then((response) => {
        const component = response?.component;
        const widgets = component?.structure?.widgets || [];
        const widgetFor = (type) => widgets.find((item) => item?.type === type);
        const contentFor = (type) => {
          const widget = widgetFor(type);
          return widget?.props?.dataKey ? component?.data?.[widget.props.dataKey] : null;
        };
        const emptyStateFor = (type) => {
          const widget = widgetFor(type);
          return widget?.props?.emptyStateKey
            ? component?.data?.[widget.props.emptyStateKey]
            : null;
        };
        const metricsWidget = widgetFor("DashboardMetrics");
        if (!metricsWidget) return;
        setMetricsDefinition({
          items: metricsWidget.props?.items || [],
          labels: component.elements.labels || {},
          ariaLabelRef: metricsWidget.props?.ariaLabelRef,
        });
        setPlanCards(contentFor("PlanCards"));
        setOverviewRail(contentFor("OverviewRail"));
        setDashboardData({
          metrics: component?.data?.metrics || {},
          recentActivity: contentFor("RecentBookings") || [],
          upcomingTrips: contentFor("UpcomingTrips") || [],
          recentEmptyState: emptyStateFor("RecentBookings"),
          upcomingEmptyState: emptyStateFor("UpcomingTrips"),
        });
      })
      .catch(() => {
        setPlanCards(null);
        setOverviewRail(null);
        setDashboardData(null);
      })
      .finally(() => setOverviewDefinitionLoading(false));
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // Keep dashboard numbers honest while the overview tab is visible: realtime
  // events refresh instantly; focus/tab activation only runs as a fallback.
  const { isConnected } = useRealtimeStatus();
  useEnquiryRealtime(activeTab === "overview" ? loadOverview : null);
  useRefreshOnActivation(loadOverview, {
    enabled: activeTab === "overview" && !isConnected,
    resource: "enquiries",
  });

  useEffect(() => {
    let cancelled = false;
    fetchData("/auth/profile")
      .then((res) => {
        if (!cancelled && res?.status === "success") setProfile(res.componentData?.data || null);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  const loadFavorites = useCallback(async () => {
    setFavoritesLoading(true);
    try {
      const res = await fetchData("/tours.json/favorites");
      setFavorites(res?.status === "success" ? res.componentData?.data || [] : []);
    } catch {
      setFavorites([]);
    } finally {
      setFavoritesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "overview") loadFavorites();
  }, [activeTab, loadFavorites]);
  useRefreshOnActivation(loadFavorites, {
    enabled: activeTab === "favorites",
    resource: "favorites",
  });

  const handleSaveProfile = useCallback(async (data) => {
    setProfileSaving(true);
    try {
      const res = await fetchData("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (res?.status === "success") {
        setProfile(res.componentData?.data);
        return { success: true };
      }
      return { success: false, message: res?.message || "Something went wrong" };
    } finally {
      setProfileSaving(false);
    }
  }, []);

  const handleRemoveFavorite = useCallback(async (item) => {
    const tourId = item?._id || item?.id;
    if (!tourId) return;
    await fetchData("/tours.json/favorite/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { tourId, product: item?.product || "trevista" },
    }).catch(() => null);
    notifyDataChanged("favorites");
  }, []);

  const handleViewFavorite = useCallback(
    (item) => {
      const ref = slugify(item?.title || item?.name) || item?._id || item?.id;
      const product = item?.product || "trevista";
      if (!ref) return;
      if (product === "trevio") navigate(`/trip/${ref}`);
      else if (product === "trevista") navigate(`/tour/${ref}`);
      else
        window.open(
          `${PRODUCT_URLS[product] || "/"}/${product}/${ref}`,
          "_blank",
          "noopener,noreferrer",
        );
    },
    [navigate],
  );

  return (
    <div className="app-shell-page">
      {activeTab === "overview" && (
        <OverviewView
          user={user}
          stats={{
            ...(dashboardData?.metrics || {}),
            totalFavorites: favorites.length,
          }}
          metricsDefinition={metricsDefinition}
          recentActivity={dashboardData?.recentActivity || []}
          upcomingTrips={dashboardData?.upcomingTrips || []}
          recentEmptyState={dashboardData?.recentEmptyState}
          upcomingEmptyState={dashboardData?.upcomingEmptyState}
          planCards={planCards}
          overviewRail={overviewRail}
          overviewDefinitionLoading={overviewDefinitionLoading}
          overviewStatsLoading={favoritesLoading && !metricsDefinition}
          onTabChange={onTabChange}
        />
      )}
      {activeTab === "favorites" && (
        <FavoritesView
          favorites={favorites}
          loading={favoritesLoading}
          onRemoveFavorite={handleRemoveFavorite}
          onViewFavorite={handleViewFavorite}
        />
      )}
      {activeTab === "bookings" && <BookingsView />}
      {activeTab === "profile" && (
        <ProfileView
          user={profile || user}
          onSaveProfile={handleSaveProfile}
          saving={profileSaving}
        />
      )}
    </div>
  );
}
