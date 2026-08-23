import React from "react";
import { Icon } from "../../../../index.js";
import { formatTourDate, getCityDisplay } from "../../helper";

export default function TourFactsView({ tour, labels = {} }) {
  if (!tour) return null;

  const startDate = formatTourDate(tour.startDate);
  const endDate = formatTourDate(tour.endDate);
  const hasExplicitRoute = Boolean(
    typeof tour.city === "string" ? tour.city.trim() : tour.city?.from && tour.city?.to,
  );
  const dateRange =
    startDate && endDate && startDate !== "Flexible" && endDate !== "Flexible"
      ? `${startDate} ${labels.to || "to"} ${endDate}`
      : startDate !== "Flexible"
        ? startDate
        : labels.flexible || "Flexible";

  const facts = [
    {
      icon: "mapPin",
      label: hasExplicitRoute ? labels.route || "Route" : "Destination",
      value: getCityDisplay(tour),
    },
    tour.distance != null && Number(tour.distance) > 0
      ? {
          icon: "mapPin",
          label: labels.distance || "Distance",
          value: `${tour.distance} ${labels.km || "km"}`,
        }
      : null,
    { icon: "calendar", label: labels.dates || "Dates", value: dateRange },
    {
      icon: "usersRound",
      label: labels.seats || "Seats",
      value:
        tour.availability?.seatsAvailable != null
          ? `${tour.availability.seatsAvailable} ${labels.available || "available"}`
          : labels.onRequest || "On request",
    },
  ].filter(Boolean);

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
