import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchData,
  slugify,
  useRefreshOnActivation,
} from "@packages/trem-utils";
import { showRealtimeToast, useEnquiryRealtime } from "@packages/trem-events";
import { useAppShellConfig } from "../../app/providers/AppShellProvider";
import { buildTrevistaTourPath } from "../../app/routing/navigationRegistry";
import resolveContractRefs from "../../core/config/resolveContractRefs";
import OverviewView from "../../views/OverviewView";
import FavoritesView from "../../views/FavoritesView";
import ProfileView from "../../views/ProfileView";
import { UserBookingJourney } from "@apps/booking-engine";
import "./AppShell.styles.scss";

const PRODUCT_URLS = { trevista: process.env.REACT_APP_TREVISTA_URL };
const USER_PROFILE_UPDATED_EVENT = "USER_PROFILE_UPDATED";
let overviewResponseCache = null;
let overviewResponseUserKey = "";
let overviewRequest = null;
let overviewRequestUserKey = "";

const textValue = (value) => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    return text === "[object Object]" ? "" : text;
  }
  if (typeof value === "object") {
    return textValue(
      value.slug ||
        value.tourRef ||
        value.tripRef ||
        value.value ||
        value.label ||
        value.name ||
        value.title ||
        value.en ||
        value.default ||
        value._id ||
        value.id,
    );
  }
  return "";
};

const resolveFavoriteRef = (item) => {
  const directRef =
    textValue(item?.slug) ||
    textValue(item?.tourSlug) ||
    textValue(item?.tripSlug) ||
    textValue(item?.href).split("/").filter(Boolean).pop() ||
    "";
  if (directRef) return directRef;
  const titleRef = slugify(textValue(item?.title) || textValue(item?.name));
  return titleRef || textValue(item?._id) || textValue(item?.id);
};

export default function AppShellContainer({ activeTab = "overview", onTabChange }) {
  const navigate = useNavigate();
  const { session } = useAppShellConfig();
  const user = session?.user || {};
  const overviewUserKey = String(user.id || user._id || "guest");
  const [planCards, setPlanCards] = useState(null);
  const [overviewRail, setOverviewRail] = useState(null);
  const [metricsDefinition, setMetricsDefinition] = useState(null);
  const [overviewCopy, setOverviewCopy] = useState({});
  const [journeyHero, setJourneyHero] = useState(null);
  const [overviewSections, setOverviewSections] = useState({});
  const [dashboardData, setDashboardData] = useState(null);
  const [overviewDefinitionLoading, setOverviewDefinitionLoading] = useState(
    () => !(overviewResponseCache && overviewResponseUserKey === overviewUserKey),
  );
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoritesView, setFavoritesView] = useState({});
  const [favoritesError, setFavoritesError] = useState("");
  const [removingFavoriteIds, setRemovingFavoriteIds] = useState([]);
  const [profile, setProfile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);

  // The dashboard page definition carries user-scoped data (metrics, recent
  // bookings & enquiries, upcoming trips) in the same response as the markup.
  const loadOverview = useCallback(({ force = false } = {}) => {
    const hasCurrentCache =
      overviewResponseCache && overviewResponseUserKey === overviewUserKey;
    const hasCurrentRequest = overviewRequest && overviewRequestUserKey === overviewUserKey;
    setOverviewDefinitionLoading(!hasCurrentCache);
    let request;
    if (!force && hasCurrentCache) {
      request = Promise.resolve(overviewResponseCache);
    } else if (hasCurrentRequest) {
      request = overviewRequest;
    } else {
      request = fetchData("/pages/app-shell/app-shell").then((response) => {
        overviewResponseCache = response;
        overviewResponseUserKey = overviewUserKey;
        return response;
      });
      overviewRequest = request;
      overviewRequestUserKey = overviewUserKey;
    }
    return request
      .then((response) => {
        const component = response?.component;
        const labels = component?.elements?.labels || {};
        const urls = component?.elements?.urls || {};
        const resolve = (value) => resolveContractRefs(value, labels, urls);
        const widgets = component?.structure?.widgets || [];
        const widgetFor = (type) => widgets.find((item) => item?.type === type);
        const contentFor = (type) => {
          const widget = widgetFor(type);
          return widget?.props?.dataKey ? resolve(component?.data?.[widget.props.dataKey]) : null;
        };
        const emptyStateFor = (type) => {
          const widget = widgetFor(type);
          return widget?.props?.emptyStateKey
            ? resolve(component?.data?.[widget.props.emptyStateKey])
            : null;
        };
        const metricsWidget = widgetFor("DashboardMetrics");
        if (!metricsWidget) return;
        setMetricsDefinition({
          ...resolve(metricsWidget.props || {}),
        });
        setOverviewCopy(labels);
        setJourneyHero(resolve(widgetFor("JourneyHero")?.props || null));
        setOverviewSections({
          recent: resolve(widgetFor("RecentBookings")?.props || {}),
          upcoming: resolve(widgetFor("UpcomingTrips")?.props || {}),
        });
        setPlanCards(contentFor("PlanCards"));
        setOverviewRail(contentFor("OverviewRail"));
        setDashboardData({
          metrics: component?.data?.metrics || {},
          journeyStage: component?.data?.journeyStage || "discover",
          recentActivity: contentFor("RecentBookings") || [],
          upcomingTrips: contentFor("UpcomingTrips") || [],
          recentEmptyState: emptyStateFor("RecentBookings"),
          upcomingEmptyState: emptyStateFor("UpcomingTrips"),
        });
      })
      .catch(() => {
        if (overviewResponseCache && overviewResponseUserKey === overviewUserKey) return;
        setPlanCards(null);
        setOverviewRail(null);
        setJourneyHero(null);
        setOverviewSections({});
        setOverviewCopy({});
        setDashboardData(null);
      })
      .finally(() => {
        if (overviewRequest === request) {
          overviewRequest = null;
          overviewRequestUserKey = "";
        }
        setOverviewDefinitionLoading(false);
      });
  }, [overviewUserKey]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // Load once, then let realtime enquiry events update the overview.
  useEnquiryRealtime(activeTab === "overview" ? () => loadOverview({ force: true }) : null);

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

  const loadFavorites = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setFavoritesLoading(true);
    setFavoritesError("");
    try {
      const res = await fetchData("/tours.json/favorites");
      if (res?.status !== "success") throw new Error(res?.message || "Favorites could not be loaded");
      setFavorites(res.componentData?.data || []);
      setFavoritesView(res.componentData?.view || {});
    } catch (loadError) {
      setFavoritesError(loadError?.message || "Favorites could not be loaded");
    } finally {
      if (!silent) setFavoritesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);
  useRefreshOnActivation(() => loadFavorites({ silent: true }), {
    resource: "favorites",
    refreshOnMount: false,
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
        const nextProfile = res.componentData?.data;
        setProfile(nextProfile);
        if (nextProfile && typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent(USER_PROFILE_UPDATED_EVENT, { detail: { user: nextProfile } }),
          );
        }
        showRealtimeToast({
          title: "Profile updated",
          subtitle: "Your account details were saved.",
          status: "success",
          dedupeKey: `profile:${Date.now()}`,
        });
        return { success: true };
      }
      return { success: false, message: res?.message || "Something went wrong" };
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Profile update failed";
      showRealtimeToast({ title: "Profile update failed", subtitle: message, status: "error" });
      return { success: false, message };
    } finally {
      setProfileSaving(false);
    }
  }, []);

  const handleUpdatePassword = useCallback(async (data) => {
    setPasswordSaving(true);
    try {
      const res = await fetchData("/auth/password", {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (res?.status === "success") {
        showRealtimeToast({
          title: "Password updated",
          subtitle: "Use the new password next time you sign in.",
          status: "success",
          dedupeKey: `password:${Date.now()}`,
        });
        return { success: true };
      }
      return { success: false, message: res?.message || "Password update failed" };
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Password update failed";
      showRealtimeToast({ title: "Password update failed", subtitle: message, status: "error" });
      return { success: false, message };
    } finally {
      setPasswordSaving(false);
    }
  }, []);

  const handleUpdateAvatar = useCallback(
    async (avatar) => {
      setAvatarSaving(true);
      try {
        const res = await fetchData("/auth/profile", {
          method: "PUT",
          body: JSON.stringify({ avatar }),
          headers: { "Content-Type": "application/json" },
        });
        if (res?.status === "success") {
          const nextProfile = res.componentData?.data;
          setProfile(nextProfile);
          if (nextProfile && typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent(USER_PROFILE_UPDATED_EVENT, { detail: { user: nextProfile } }),
            );
          }
          showRealtimeToast({
            title: "Avatar updated",
            subtitle: "Your new avatar is visible across TravelsTREM.",
            status: "success",
            dedupeKey: `avatar:${Date.now()}`,
          });
          return { success: true };
        }
        return { success: false, message: res?.message || "Avatar update failed" };
      } catch (error) {
        const message = error?.response?.data?.message || error?.message || "Avatar update failed";
        showRealtimeToast({ title: "Avatar update failed", subtitle: message, status: "error" });
        return { success: false, message };
      } finally {
        setAvatarSaving(false);
      }
    },
    [],
  );

  const handleRemoveFavorite = useCallback(
    async (item) => {
      const tourId = textValue(item?.tourId) || textValue(item?._id) || textValue(item?.id);
      const favoriteKey = textValue(item?.favoriteId) || tourId;
      if (!tourId || !favoriteKey || removingFavoriteIds.includes(favoriteKey)) return;

      const previousFavorites = favorites;
      setRemovingFavoriteIds((current) => [...current, favoriteKey]);
      setFavorites((current) =>
        current.filter((favorite) => {
          const currentKey =
            textValue(favorite?.favoriteId) ||
            textValue(favorite?.tourId) ||
            textValue(favorite?._id);
          return currentKey !== favoriteKey;
        }),
      );

      try {
        const response = await fetchData("/tours.json/favorite/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: { tourId, product: item?.product },
        });
        if (response?.status !== "success") throw new Error(response?.message || "Remove failed");
        showRealtimeToast({
          title: "Removed from saved journeys",
          subtitle: item?.title || "Your shortlist has been updated.",
          status: "success",
          dedupeKey: `favorite-removed:${favoriteKey}`,
        });
      } catch (removeError) {
        setFavorites(previousFavorites);
        showRealtimeToast({
          title: "Could not update saved journeys",
          subtitle: removeError?.message || "Please try again.",
          status: "error",
          dedupeKey: `favorite-remove-error:${favoriteKey}`,
        });
      } finally {
        setRemovingFavoriteIds((current) => current.filter((id) => id !== favoriteKey));
      }
    },
    [favorites, removingFavoriteIds],
  );

  const handleViewFavorite = useCallback(
    (item) => {
      const ref = resolveFavoriteRef(item);
      const product = item?.product || "trevista";
      if (!ref) return;
      if (product === "trevista") {
        navigate(buildTrevistaTourPath(ref));
      }
      else
        window.open(
          `${PRODUCT_URLS[product] || "/"}/${product}/${encodeURIComponent(ref)}`,
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
            ...(!favoritesLoading ? { totalFavorites: favorites.length } : {}),
          }}
          copy={overviewCopy}
          journeyStage={dashboardData?.journeyStage}
          journeyHero={journeyHero}
          sections={overviewSections}
          metricsDefinition={metricsDefinition}
          recentActivity={dashboardData?.recentActivity || []}
          upcomingTrips={dashboardData?.upcomingTrips || []}
          recentEmptyState={dashboardData?.recentEmptyState}
          upcomingEmptyState={dashboardData?.upcomingEmptyState}
          planCards={planCards}
          overviewRail={overviewRail}
          overviewDefinitionLoading={overviewDefinitionLoading}
          overviewStatsLoading={!metricsDefinition}
          onTabChange={onTabChange}
        />
      )}
      {activeTab === "favorites" && (
        <FavoritesView
          favorites={favorites}
          view={favoritesView}
          loading={favoritesLoading}
          error={favoritesError}
          removingIds={removingFavoriteIds}
          onRetry={loadFavorites}
          onExplore={() => navigate("/trevista/tours")}
          onRemoveFavorite={handleRemoveFavorite}
          onViewFavorite={handleViewFavorite}
        />
      )}
      {activeTab === "bookings" && <UserBookingJourney />}
      {activeTab === "profile" && (
        <ProfileView
          user={profile || user}
          onSaveProfile={handleSaveProfile}
          onUpdatePassword={handleUpdatePassword}
          onUpdateAvatar={handleUpdateAvatar}
          saving={profileSaving}
          passwordSaving={passwordSaving}
          avatarSaving={avatarSaving}
        />
      )}
    </div>
  );
}
