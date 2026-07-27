import React from "react";
import { EmptyState } from "@packages/trem-ui";
import StatsCard from "../components/StatsCard";
import "./OverviewView.scss";

function normalizeStatus(status) {
  if (!status) return "Draft";
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusKey(status) {
  return String(status || "").toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default function OverviewView({ user, stats, recentBookings, onTabChange, onViewBooking }) {
  const bookingCount = stats?.totalBookings || 0;
  const favCount = stats?.totalFavorites || 0;
  const tripCount = stats?.tripsCompleted || 0;
  const pendingCount = stats?.pendingBookings || 0;

  return (
    <div className="dov">
      <div className="dov__greeting">
        <h1>Good {getTimeOfDay()}, {user?.name?.split(" ")[0] || "there"}</h1>
        <p>Here's what's happening with your travel plans</p>
      </div>

      <div className="dov__stats">
        <StatsCard
          label="Total Bookings"
          value={bookingCount}
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          onClick={() => onTabChange?.("bookings")}
        />
        <StatsCard
          label="Favorites"
          value={favCount}
          icon="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          onClick={() => onTabChange?.("favorites")}
        />
        <StatsCard
          label="Trips Completed"
          value={tripCount}
          icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          onClick={() => onTabChange?.("bookings")}
        />
        <StatsCard
          label="Pending"
          value={pendingCount}
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          onClick={() => onTabChange?.("bookings")}
        />
      </div>

      <div className="dov__section">
        <h2 className="dov__section-title">Recent Bookings</h2>
        {recentBookings && recentBookings.length > 0 ? (
          <div className="dov__recent">
            {recentBookings.slice(0, 5).map((b, i) => {
              const tour = b.tour || {};
              const tripName = tour.title || b.tripSelection?.packageId || "Trip";
              const product = b.product || "trevista";

              return (
                <div key={b.id || b._id || i} className="dov__recent-item" onClick={() => onViewBooking?.(b)}>
                  <div className="dov__recent-info">
                    <span className="dov__recent-name">{tripName}</span>
                    <div className="dov__recent-meta">
                      <span className={`dov__recent-product dov__recent-product--${product}`}>
                        {product === "trevio" ? "Trevio" : "Trevista"}
                      </span>
                      <span>{formatDate(b.createdAt)}</span>
                    </div>
                  </div>
                  <span className={`dov__recent-status dov__recent-status--${statusKey(b.status)}`}>
                    {normalizeStatus(b.status)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="calendar"
            title="No bookings yet"
            description="When you book a trip, it will appear here."
          />
        )}
      </div>
    </div>
  );
}
