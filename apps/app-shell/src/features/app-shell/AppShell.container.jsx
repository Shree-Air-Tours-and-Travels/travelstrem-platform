import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchData, slugify } from "@packages/trem-utils";
import { useAppShellConfig } from "../../app/providers/AppShellProvider";
import OverviewView from "../../views/OverviewView";
import BookingsView from "../../views/BookingsView";
import FavoritesView from "../../views/FavoritesView";
import ProfileView from "../../views/ProfileView";
import BookingDetail from "../bookingDetail/BookingDetail.jsx";
import "./AppShell.styles.scss";

const PRODUCT_URLS = {
  trevista: process.env.REACT_APP_TREVISTA_URL,
};

const getProductBaseUrl = (productKey) => {
  if (typeof window === "undefined") return "/";
  return PRODUCT_URLS[productKey] || "/";
};

const COMPLETED_STATUSES = new Set([
  "COMPLETED", "CONFIRMED", "PAID", "TICKETED", "TRAVEL_READY",
]);
const PENDING_STATUSES = new Set([
  "DRAFT", "QUOTE_REQUESTED", "QUOTE_READY", "QUOTE_SENT",
  "UNDER_REVIEW", "PAYMENT_PENDING", "PARTIALLY_PAID",
]);

export default function AppShellContainer({ productFilter = "all", activeTab = "overview", onTabChange }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useAppShellConfig();
  const user = session?.user || {};
  const [viewingBookingId, setViewingBookingId] = useState(null);
  const [planCards, setPlanCards] = useState(null);
  const [overviewRail, setOverviewRail] = useState(null);
  const [metricsDefinition, setMetricsDefinition] = useState(null);
  const [recentBookingsEmptyState, setRecentBookingsEmptyState] = useState(null);
  const [bookingTableDefinition, setBookingTableDefinition] = useState(null);
  const [overviewDefinitionLoading, setOverviewDefinitionLoading] = useState(true);

  // Keep shareable booking-detail URLs in sync with the reusable bookings view.
  useEffect(() => {
    setViewingBookingId(activeTab === "bookings" ? searchParams.get("bookingId") : null);
  }, [activeTab, searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadOverviewDefinition() {
      try {
        const response = await fetchData("/pages/app-shell/app-shell");
        const component = response?.component;
        const widgets = component?.structure?.widgets || [];
        const contentFor = (type) => {
          const widget = widgets.find((item) => item?.type === type);
          return widget?.props?.dataKey ? component?.data?.[widget.props.dataKey] : null;
        };

        if (!cancelled) {
          setPlanCards(contentFor("PlanCards"));
          setOverviewRail(contentFor("OverviewRail"));
          const metricsWidget = widgets.find((item) => item?.type === "DashboardMetrics");
          setMetricsDefinition(metricsWidget ? {
            ...metricsWidget.props,
            labels: component?.elements?.labels || {},
          } : null);
          setRecentBookingsEmptyState(component?.data?.recentBookingsEmptyState || null);
          const bookingTableWidget = widgets.find((item) => item?.type === "BookingTable");
          setBookingTableDefinition(bookingTableWidget ? {
            props: bookingTableWidget.props,
            labels: component?.elements?.labels || {},
            options: component?.dataScope?.options || {},
          } : null);
        }
      } catch {
        if (!cancelled) {
          setPlanCards(null);
          setOverviewRail(null);
          setMetricsDefinition(null);
          setRecentBookingsEmptyState(null);
          setBookingTableDefinition(null);
        }
      } finally {
        if (!cancelled) setOverviewDefinitionLoading(false);
      }
    }

    loadOverviewDefinition();
    return () => {
      cancelled = true;
    };
  }, []);

  const [stats, setStats] = useState({
    totalBookings: 0,
    totalFavorites: 0,
    tripsCompleted: 0,
    pendingBookings: 0,
  });
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const res = await fetchData("/auth/profile").catch(() => null);
        if (!cancelled && res?.status === "success") {
          setProfile(res.componentData?.data || null);
        }
      } catch {}
    }
    loadProfile();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadBookings() {
      setBookingsLoading(true);
      try {
        const params = { limit: 100, skip: 0 };
        if (productFilter && productFilter !== "all") params.product = productFilter;

        const res = await fetchData("/engine/my-bookings", { params });
        if (!res || res.status !== "success") throw new Error(res?.message || "Failed to load bookings");

        const data = res.componentData?.data?.bookings || [];
        const total = Number(res.componentData?.data?.total || data.length || 0);

        if (!cancelled) {
          setBookings(data);
          setStats((prev) => ({
            ...prev,
            totalBookings: total,
            pendingBookings: data.filter((b) => PENDING_STATUSES.has(String(b.status || "").toUpperCase())).length,
            tripsCompleted: data.filter((b) => COMPLETED_STATUSES.has(String(b.status || "").toUpperCase())).length,
          }));
        }
      } catch {
        if (!cancelled) setBookings([]);
      } finally {
        if (!cancelled) setBookingsLoading(false);
      }
    }
    loadBookings();
    return () => { cancelled = true; };
  }, [productFilter]);

  useEffect(() => {
    if (activeTab !== "bookings" && activeTab !== "overview") return;
    const interval = setInterval(async () => {
      try {
        const params = { limit: 100, skip: 0 };
        if (productFilter && productFilter !== "all") params.product = productFilter;

        const res = await fetchData("/engine/my-bookings", { params });
        if (!res || res.status !== "success") return;

        const data = res.componentData?.data?.bookings || [];
        const total = Number(res.componentData?.data?.total || data.length || 0);

        setBookings(data);
        setStats((prev) => ({
          ...prev,
          totalBookings: total,
          pendingBookings: data.filter((b) => PENDING_STATUSES.has(String(b.status || "").toUpperCase())).length,
          tripsCompleted: data.filter((b) => COMPLETED_STATUSES.has(String(b.status || "").toUpperCase())).length,
        }));
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
  }, [activeTab, productFilter]);

  const loadFavorites = useCallback(async () => {
    setFavoritesLoading(true);
    try {
      const res = await fetchData("/tours.json/favorites");
      if (res?.status === "success") {
        const data = res.componentData?.data || [];
        setFavorites(data);
        setStats((prev) => ({ ...prev, totalFavorites: data.length }));
      } else {
        setFavorites([]);
      }
    } catch {
      setFavorites([]);
    } finally {
      setFavoritesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

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
    const product = item?.product || "trevista";
    if (!tourId) return;
    try {
      await fetchData("/tours.json/favorite/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { tourId, product },
      });
      loadFavorites();
    } catch {
      loadFavorites();
    }
  }, [loadFavorites]);

  const handleViewFavorite = useCallback((item) => {
    const ref = slugify(item?.title || item?.name) || item?._id || item?.id;
    const product = item?.product || "trevista";
    if (!ref) return;
    const base = getProductBaseUrl(product);
    if (product === "trevio") {
      navigate(`/trip/${ref}`);
    } else {
      window.open(`${base}/trevista/${ref}`, "_blank", "noopener,noreferrer");
    }
  }, [navigate]);

  const handleViewBooking = useCallback((booking) => {
    const bookingId = booking.bookingId || booking.id || booking._id;
    if (!bookingId) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", "bookings");
    next.set("bookingId", bookingId);
    setSearchParams(next);
    setViewingBookingId(bookingId);
  }, [searchParams, setSearchParams]);

  const handleCloseBooking = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("bookingId");
    setSearchParams(next);
    setViewingBookingId(null);
  }, [searchParams, setSearchParams]);

  if (viewingBookingId) {
    return (
      <BookingDetail
        bookingId={viewingBookingId}
        onBack={handleCloseBooking}
      />
    );
  }

  return (
    <div className="app-shell-page">
      {activeTab === "overview" && (
        <OverviewView
          user={user}
          stats={stats}
          metricsDefinition={metricsDefinition}
          planCards={planCards}
          overviewRail={overviewRail}
          overviewDefinitionLoading={overviewDefinitionLoading}
          overviewStatsLoading={bookingsLoading || favoritesLoading}
          bookingsLoading={bookingsLoading}
          recentBookingsEmptyState={recentBookingsEmptyState}
          recentBookings={bookings}
          onTabChange={onTabChange}
          onViewBooking={handleViewBooking}
        />
      )}
      {activeTab === "bookings" && (
        <BookingsView
          definition={bookingTableDefinition}
          loading={overviewDefinitionLoading}
          onViewBooking={handleViewBooking}
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
