import React from "react";
import { EmptyState } from "@packages/trem-ui";
import StatsCard from "../components/StatsCard";
import "./AdminOverviewView.scss";

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

export default function AdminOverviewView({ user, stats, recentBookings, onTabChange, onViewBooking }) {
  const tourCount = stats?.totalTours || 0;
  const tripCount = stats?.totalTrips || 0;
  const bookingCount = stats?.activeBookings || 0;
  const pendingCount = stats?.pendingReviews || 0;

  return (
    <div className="aov">
      <div className="aov__greeting">
        <h1>Good {getTimeOfDay()}, {user?.name?.split(" ")[0] || "Admin"}</h1>
        <p>Here's what's happening with your platform</p>
      </div>

      <div className="aov__stats">
        <StatsCard
          label="Total Tours"
          value={tourCount}
          icon="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          onClick={() => onTabChange?.("services")}
        />
        <StatsCard
          label="Total Trips"
          value={tripCount}
          icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          onClick={() => onTabChange?.("services")}
        />
        <StatsCard
          label="Active Bookings"
          value={bookingCount}
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          onClick={() => onTabChange?.("bookings")}
        />
        <StatsCard
          label="Pending Reviews"
          value={pendingCount}
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          onClick={() => onTabChange?.("bookings")}
        />
      </div>

      <div className="aov__section">
        <h2 className="aov__section-title">Recent Bookings</h2>
        {recentBookings && recentBookings.length > 0 ? (
          <div className="aov__recent">
            {recentBookings.slice(0, 5).map((b, i) => {
              const tour = b.tour || {};
              const tripName = tour.title || b.tripSelection?.packageId || "Trip";
              const product = b.product || "trevista";

              return (
                <div key={b.id || b._id || i} className="aov__recent-item" onClick={() => onViewBooking?.(b)}>
                  <div className="aov__recent-info">
                    <span className="aov__recent-name">{tripName}</span>
                    <div className="aov__recent-meta">
                      <span className={`aov__recent-product aov__recent-product--${product}`}>
                        {product === "trevio" ? "Trevio" : "Trevista"}
                      </span>
                      <span>{formatDate(b.createdAt)}</span>
                    </div>
                  </div>
                  <span className={`aov__recent-status aov__recent-status--${statusKey(b.status)}`}>
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
            description="Bookings will appear here as they come in."
          />
        )}
      </div>
    </div>
  );
}
