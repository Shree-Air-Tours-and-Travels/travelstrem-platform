import React from "react";
import StatsCard from "../components/StatsCard";
import "./AdminOverviewView.scss";

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default function AdminOverviewView({ user, stats, onTabChange }) {
  const tourCount = stats?.totalTours || 0;
  const tripCount = stats?.totalTrips || 0;

  return (
    <div className="aov">
      <div className="aov__greeting">
        <h1>
          Good {getTimeOfDay()}, {user?.name?.split(" ")[0] || "Admin"}
        </h1>
        <p>Here is your current travel catalogue overview.</p>
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
      </div>
    </div>
  );
}
