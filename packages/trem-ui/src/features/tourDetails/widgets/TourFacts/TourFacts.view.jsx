import React from "react";
import { Icon } from "../../../../index.js";
import { formatTourDate, getCityDisplay } from "../../helper";

export default function TourFactsView({ tour, labels = {} }) {
  if (!tour) return null;

  const facts = [
    { icon: "mapPin", label: labels.route || "Route", value: getCityDisplay(tour) },
    { icon: "mapPin", label: labels.distance || "Distance", value: tour.distance ? `${tour.distance} ${labels.km || "km"}` : labels.flexible || "Flexible" },
    { icon: "calendar", label: labels.startDate || "Start date", value: formatTourDate(tour.startDate) },
    { icon: "usersRound", label: labels.seats || "Seats", value: tour.availability?.seatsAvailable != null ? `${tour.availability.seatsAvailable} ${labels.available || "available"}` : labels.onRequest || "On request" },
  ];

  return (
    <div className="tour-detail__facts-bar" aria-label={labels.ariaLabel || "Trip facts"}>
      {facts.map((fact) => (
        <div key={fact.label} className="tour-detail__fact-card">
          <Icon name={fact.icon} />
          <div>
            <span>{fact.label}</span>
            <strong>{fact.value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
