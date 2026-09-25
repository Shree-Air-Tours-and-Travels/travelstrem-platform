import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchData,
  slugify,
  useRefreshOnActivation,
} from "@packages/trem-utils";
import {
  REALTIME_EVENTS,
  showRealtimeToast,
  useEnquiryRealtime,
  useRealtimeEvent,
} from "@packages/trem-events";
import { useAppShellConfig } from "../../app/providers/AppShellProvider";
import { buildTrevistaTourPath } from "../../app/routing/navigationRegistry";
import resolveContractRefs from "../../core/config/resolveContractRefs";
import OverviewView from "../../views/OverviewView";
import ArticlesView from "../../views/ArticlesView";
import DashboardView from "../../views/DashboardView";
import FavoritesView from "../../views/FavoritesView";
import ProfileView from "../../views/ProfileView";
import { UserBookingJourney } from "@apps/booking-engine";
import { NoDataFound, Preloader, PRODUCT_TYPE } from "@packages/trem-ui";
import "./AppShell.styles.scss";

const PRODUCT_URLS = { [PRODUCT_TYPE.TREVISTA]: process.env.REACT_APP_TREVISTA_URL };
const USER_PROFILE_UPDATED_EVENT = "USER_PROFILE_UPDATED";
const GUEST_FAVORITES_VIEW = {
  hero: {
    eyebrow: "Your travel shortlist",
    title: "Saved journeys",
    description: "Sign in or start exploring to save journeys and compare them here.",
  },
  controls: {
    searchPlaceholder: "Search saved tours and destinations",
    productOptions: [{ value: "all", label: "All saved journeys" }],
    sortOptions: [{ value: "recent", label: "Recently saved" }],
  },
  labels: {
    saved: "Saved",
    products: "Available products",
    result: "saved journey",
    results: "saved journeys",
  },
  states: {
    emptyTitle: "Start building your travel shortlist",
    emptyDescription: "Explore available products and save the journeys you want to revisit.",
    filteredTitle: "No saved journeys match these filters",
    filteredDescription: "Try another search or clear your current filters.",
  },
  actions: { explore: "Explore tours", clear: "Clear filters" },
  summary: { savedCount: 0, productCount: 0 },
};
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

export default function AppShellContainer({
  activeTab = "overview",
  onTabChange,
  onArticleTitleChange,
}) {
  const navigate = useNavigate();
  const { session } = useAppShellConfig();
  const isAuthenticated = Boolean(session?.isAuthenticated);
  const user = session?.user || {};
  const overviewUserKey = String(user.id || user._id || "guest");
  const [journeyStory, setJourneyStory] = useState(null);
  const [featuredTravel, setFeaturedTravel] = useState(null);
  const [homeInsights, setHomeInsights] = useState(null);
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
  const [articlesPage, setArticlesPage] = useState(null);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articlesError, setArticlesError] = useState("");

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
        setJourneyStory(contentFor("JourneyStory"));
        setOverviewSections({
          recent: resolve(widgetFor("RecentBookings")?.props || {}),
          upcoming: resolve(widgetFor("UpcomingTrips")?.props || {}),
        });
        setFeaturedTravel(contentFor("HomeCardsWithFeature"));
        setHomeInsights(contentFor("HomeInsights"));
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
        setJourneyStory(null);
        setFeaturedTravel(null);
        setHomeInsights(null);
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

  const loadArticlesPage = useCallback(async ({ force = false, silent = false } = {}) => {
    if (!silent) setArticlesLoading(true);
    setArticlesError("");
    try {
      const response = await fetchData("/pages/app-shell/articles", {
        params: force ? { refresh: Date.now() } : {},
      });
      if (response?.status !== "success") {
        throw new Error(response?.message || "Articles could not be loaded");
      }
      const component = response?.component;
      const labels = component?.elements?.labels || {};
      const urls = component?.elements?.urls || {};
      const widget = (component?.structure?.widgets || []).find(
        (item) => item?.type === "ArticlesPage",
      );
      const dataKey = widget?.props?.dataKey;
      const resolved = dataKey
        ? resolveContractRefs(component?.data?.[dataKey], labels, urls)
        : null;
      if (!widget || !resolved) {
        throw new Error("Articles could not be loaded");
      }
      setArticlesPage(resolved);
    } catch (loadError) {
      if (silent && articlesPage) return;
      setArticlesPage(null);
      setArticlesError(loadError?.message || "Articles could not be loaded");
    } finally {
      if (!silent) setArticlesLoading(false);
    }
  }, [articlesPage]);

  useEffect(() => {
    if (activeTab === "articles" && !articlesPage && !articlesLoading && !articlesError) {
      loadArticlesPage();
    }
  }, [activeTab, articlesError, articlesLoading, articlesPage, loadArticlesPage]);
  useRefreshOnActivation(() => loadArticlesPage({ silent: true }), {
    resource: "articles",
    refreshOnMount: false,
  });

  const handleOpenArticle = useCallback(
    (article) => {
      const id =
        textValue(article?.articleId) || textValue(article?.id) || slugify(textValue(article?.title));
      const params = new URLSearchParams({ tab: "articles" });
      if (id) params.set("article", encodeURIComponent(id));
      navigate(`/articles?${params}`);
    },
    [navigate],
  );

  // Load once, then let realtime enquiry events update the overview.
  useEnquiryRealtime(
    activeTab === "overview" || activeTab === "dashboard"
      ? () => loadOverview({ force: true })
      : null,
  );
  useRealtimeEvent(REALTIME_EVENTS.PRODUCT_CATALOG_UPDATED, () =>
    loadOverview({ force: true }),
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetchData("/auth/profile")
      .then((res) => {
        if (!cancelled && res?.status === "success") setProfile(res.componentData?.data || null);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const loadFavorites = useCallback(async ({ silent = false } = {}) => {
    if (!isAuthenticated) {
      setFavorites([]);
      setFavoritesView(GUEST_FAVORITES_VIEW);
      setFavoritesError("");
      setFavoritesLoading(false);
      return;
    }
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
  }, [isAuthenticated]);

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
      const product = item?.product || PRODUCT_TYPE.TREVISTA;
      if (!ref) return;
      if (product === PRODUCT_TYPE.TREVISTA) {
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

  const handleHeroSearch = useCallback(({ mode, values = {}, choice }) => {
    const paths = {
      flight: "/trehub/flights",
      hotel: "/trehub/hotels",
      trip: "/trevio/trips",
      tour: "/trevista/tours",
    };
    const path = paths[mode];
    if (!path) return;
    const params = new URLSearchParams();
    if (mode === "trip" || mode === "tour") {
      const destination = String(values.destination || "").trim();
      if (destination) params.set(mode === "trip" ? "search" : "q", destination);
      if (values.startDate) params.set(mode === "trip" ? "startDate" : "departure", values.startDate);
      if (values.endDate) params.set(mode === "trip" ? "endDate" : "return", values.endDate);
      if (values.travellers) params.set("travellers", String(values.travellers));
      if (choice) params.set(mode === "trip" ? "category" : "tags", choice);
    } else {
      if (choice) params.set("choice", choice);
      Object.entries(values).forEach(([key, value]) => {
        if (value === "" || value == null) return;
        params.set(key, Array.isArray(value) ? value.join(",") : String(value));
      });
    }
    navigate(`${path}${params.size ? `?${params}` : ""}`);
  }, [navigate]);

  return (
    <div className={`app-shell-page${activeTab === "overview" ? " app-shell-page--home" : ""}`}>
      {activeTab === "overview" && (
        overviewDefinitionLoading && !journeyHero ? (
          <div className="app-shell-home-preloader">
            <Preloader variant="hero" label="Loading home page" />
            <Preloader variant="grid" count={3} label="Loading featured travel" />
          </div>
        ) : (
          <OverviewView
            journeyHero={journeyHero}
            journeyStory={journeyStory}
            featuredTravel={featuredTravel}
            homeInsights={homeInsights}
            onHeroSearch={handleHeroSearch}
            onTabChange={onTabChange}
            onArticleSelect={handleOpenArticle}
          />
        )
      )}
      {activeTab === "dashboard" && (
        <DashboardView
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
      {activeTab === "articles" && (
        <ArticlesView
          page={articlesPage}
          loading={articlesLoading}
          error={articlesError}
          onRetry={loadArticlesPage}
          onArticleTitleChange={onArticleTitleChange}
        />
      )}
      {activeTab === "bookings" && (
        isAuthenticated ? (
          <UserBookingJourney />
        ) : (
          <NoDataFound
            icon="reservations"
            title="No bookings to show yet"
            description="Sign in to manage existing bookings, or start a new booking so your travel updates appear here."
          />
        )
      )}
      {activeTab === "profile" && (
        !isAuthenticated ? (
          <NoDataFound
            icon="user"
            title="Profile is available after sign in"
            description="Continue exploring as a guest, or sign in when you are ready to manage your account details."
          />
        ) : (
          <ProfileView
            user={profile || user}
            onSaveProfile={handleSaveProfile}
            onUpdatePassword={handleUpdatePassword}
            onUpdateAvatar={handleUpdateAvatar}
            saving={profileSaving}
            passwordSaving={passwordSaving}
            avatarSaving={avatarSaving}
          />
        )
      )}
    </div>
  );
}
