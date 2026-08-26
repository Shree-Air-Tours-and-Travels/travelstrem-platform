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
  const departures = (Array.isArray(tour.departures) ? tour.departures : [])
    .filter((departure) => !["cancelled", "completed"].includes(departure?.status))
    .map((departure) => {
      const departureDate = formatTourDate(departure.departureDate);
      const returnDate = formatTourDate(departure.returnDate);
      return {
        id: departure.id || `${departure.departureDate}-${departure.returnDate}`,
        label:
          departureDate !== "Flexible" && returnDate !== "Flexible"
            ? `${departureDate} ${labels.to || "to"} ${returnDate}`
            : departureDate,
      };
    });
  const duration = tour.period?.days
    ? `${tour.period.days} ${labels.days || "days"}${tour.period.nights ? ` · ${tour.period.nights} ${labels.nights || "nights"}` : ""}`
    : labels.onRequest || "On request";

  const facts = [
    {
      icon: "mapPin",
      label: hasExplicitRoute ? labels.route || "Route" : "Destination",
      value: getCityDisplay(tour),
    },
    { icon: "clock", label: labels.duration || "Duration", value: duration },
    {
      icon: "calendar",
      label: departures.length > 1 ? labels.departures || "Departures" : labels.dates || "Dates",
      value: departures.length ? (
        <span className="tour-detail__departure-list">
          {departures.map((departure) => (
            <span key={departure.id}>{departure.label}</span>
          ))}
        </span>
      ) : (
        dateRange
      ),
    },
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
