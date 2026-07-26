import React from "react";
import { GlobalLoader } from "@packages/trem-ui";

export default function DashboardPageView({
  loading,
  error,
  activeTab,
  user,
  stats,
  bookings,
  bookingsLoading,
  favorites,
  favoritesLoading,
  profile,
  profileSaving,
  onSaveProfile,
  onRemoveFavorite,
  onViewFavorite,
  onViewBooking,
}) {
  if (loading) return <GlobalLoader visible text="Loading dashboard" />;
  if (error) return <main className="dashboard-page dashboard-page--error">Error: {error}</main>;

  return null;
}
