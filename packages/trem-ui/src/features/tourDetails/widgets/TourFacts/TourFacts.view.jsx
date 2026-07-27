import React from "react";
import { Icon } from "../../../../index.js";
import { formatTourDate, getCityDisplay } from "../../helper";

export default function TourFactsView({ tour, labels = {} }) {
  if (!tour) return null;

  const startDate = formatTourDate(tour.startDate);
  const endDate = formatTourDate(tour.endDate);
  const dateRange = startDate && endDate && startDate !== "Flexible" && endDate !== "Flexible"
    ? `${startDate} ${labels.to || "to"} ${endDate}`
    : startDate !== "Flexible" ? startDate : labels.flexible || "Flexible";

  const facts = [
    { icon: "mapPin", label: labels.route || "Route", value: getCityDisplay(tour) },
    { icon: "mapPin", label: labels.distance || "Distance", value: tour.distance ? `${tour.distance} ${labels.km || "km"}` : labels.flexible || "Flexible" },
    { icon: "calendar", label: labels.dates || "Dates", value: dateRange },
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
