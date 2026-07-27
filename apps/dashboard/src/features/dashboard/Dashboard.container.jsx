import React, { useEffect, useState, useCallback } from "react";
import { fetchData, slugify } from "@packages/trem-utils";
import { useDashboardConfig } from "../../app/providers/DashboardProvider";
import OverviewView from "../../views/OverviewView";
import BookingsView from "../../views/BookingsView";
import FavoritesView from "../../views/FavoritesView";
import ProfileView from "../../views/ProfileView";
import BookingDetail from "../bookingDetail/BookingDetail.jsx";
import "./Dashboard.styles.scss";

const PRODUCT_URLS = {
  trevista: process.env.REACT_APP_TREVISTA_URL,
  trevio: process.env.REACT_APP_TREVIO_URL,
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

export default function DashboardContainer({ productFilter = "all", activeTab = "overview", onTabChange }) {
  const { session } = useDashboardConfig();
  const user = session?.user || {};
  const [viewingBookingId, setViewingBookingId] = useState(null);

  // Reset booking detail view when switching tabs
  useEffect(() => {
    setViewingBookingId(null);
  }, [activeTab]);

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
    }, 30000);
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
      window.open(`${base}/trevio/trip/${ref}`, "_blank", "noopener,noreferrer");
    } else {
      window.open(`${base}/trevista/${ref}`, "_blank", "noopener,noreferrer");
    }
  }, []);

  const handleViewBooking = useCallback((booking) => {
    if (booking.id || booking._id) {
      setViewingBookingId(booking.id || booking._id);
    }
  }, []);

  if (viewingBookingId) {
    return (
      <BookingDetail
        bookingId={viewingBookingId}
        onBack={() => setViewingBookingId(null)}
      />
    );
  }

  return (
    <div className="dashboard-page">
      {activeTab === "overview" && (
        <OverviewView user={user} stats={stats} recentBookings={bookings} onTabChange={onTabChange} onViewBooking={handleViewBooking} />
      )}
      {activeTab === "bookings" && (
        <BookingsView
          bookings={bookings}
          loading={bookingsLoading}
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
