import React from "react";
import PropTypes from "prop-types";
import Button from "../Button/Button.jsx";
import DetailedChip from "../DetailedChip/DetailedChip.jsx";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./FlightCard.styles.scss";

const formatMoney = (amount, currency) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const displayTime = (value) => value ? new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value)) : "";
const displayDate = (value) => value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "";
const displayCabin = (value) => String(value || "").toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
const displayDuration = (minutes) => minutes >= 60
  ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;

const normalizeFlight = (flight) => {
  if (!Array.isArray(flight.segments)) return flight;
  const outbound = flight.segments.filter((segment) => segment.direction === "OUTBOUND");
  const journey = outbound.length ? outbound : flight.segments;
  const first = journey[0] || {};
  const last = journey.at(-1) || first;
  const stops = Math.max(0, journey.length - 1);
  const durationMinutes = journey.reduce((total, segment) => total + Number(segment.durationMinutes || 0), 0);
  const journeys = flight.journeys?.length ? flight.journeys : [{
    origin: { time: displayTime(first.departureDateTime), code: first.origin?.iataCode, city: first.origin?.city, date: displayDate(first.departureDateTime) },
    destination: { time: displayTime(last.arrivalDateTime), code: last.destination?.iataCode, city: last.destination?.city },
    durationMinutes,
    stopsLabel: stops ? `${stops} stop${stops === 1 ? "" : "s"}` : "Non-stop",
  }];
  return {
    ...flight,
    airline: first.airline,
    flightNumber: first.flightNumber,
    badge: flight.fare?.brand,
    origin: { time: displayTime(first.departureDateTime), code: first.origin?.iataCode, city: first.origin?.city },
    destination: { time: displayTime(last.arrivalDateTime), code: last.destination?.iataCode, city: last.destination?.city },
    duration: displayDuration(durationMinutes),
    stopsLabel: stops ? `${stops} stop${stops === 1 ? "" : "s"}` : "Non-stop",
    departureDate: journeys[0]?.origin?.date || displayDate(first.departureDateTime),
    journeys,
    cabinLabel: displayCabin(flight.fare?.cabin),
    seatsLabel: flight.availability?.message,
    price: { amount: Number(flight.price?.total ?? 0) / 100, currency: flight.price?.currency || flight.currency },
  };
};

export default function FlightCard({ flight = {}, labels = {}, onSelect, hideAction = false, className = "" }) {
  const card = normalizeFlight(flight);
  const origin = card.origin || {};
  const destination = card.destination || {};
  const journeys = card.journeys?.length ? card.journeys : [{ origin, destination, duration: card.duration, stopsLabel: card.stopsLabel }];

  return (
    <article className={`trem-flight-card${className ? ` ${className}` : ""}`}>
      <header className="trem-flight-card__airline">
        <span className="trem-flight-card__logo" aria-hidden="true">
          {card.airline?.logo ? (
            <img src={card.airline.logo} alt="" />
          ) : card.airline?.icon ? (
            <Icon name={card.airline.icon} size={30} />
          ) : (
            card.airline?.initial || card.airline?.code
          )}
        </span>
        <span className="trem-flight-card__airline-copy">
          <strong>{card.airline?.name}</strong>
          <small>{card.flightNumber}</small>
        </span>
        {card.badge ? (
          <StatusBadge
            value={card.badge}
            tone="info"
            size="sm"
            showDot={false}
            icon="badgeCheck"
            appearance="accent"
          />
        ) : null}
      </header>

      <div className="trem-flight-card__journeys">
        {journeys.map((journey, index) => (
          <div className="trem-flight-card__journey" key={journey.index ?? index}>
            {journeys.length > 1 ? <small className="trem-flight-card__journey-label">{journey.label || `Journey ${index + 1}`}</small> : null}
            <div>
              <strong>{journey.origin?.time}</strong>
              <span>{journey.origin?.code}</span>
              <small>{journey.origin?.date || journey.origin?.city}</small>
            </div>
            <div className="trem-flight-card__route">
              <small>{journey.duration || displayDuration(journey.durationMinutes || 0)}</small>
              <span><Icon name="flight" size={22} /></span>
              <small>{journey.stopsLabel}</small>
            </div>
            <div>
              <strong>{journey.destination?.time}</strong>
              <span>{journey.destination?.code}</span>
              <small>{journey.destination?.date || journey.destination?.city}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="trem-flight-card__meta">
        <DetailedChip icon="calendar" label={labels.departureLabel} value={card.departureDate} />
        <DetailedChip icon="briefcaseBusiness" label={labels.cabinLabel} value={card.cabinLabel} />
        {card.seatsLabel ? (
          <DetailedChip icon="usersRound" value={card.seatsLabel} tone="success" />
        ) : null}
      </div>

      <footer className="trem-flight-card__footer">
        <div>
          <small>{labels.priceLabel}</small>
          <strong>{formatMoney(card.price?.amount, card.price?.currency)}</strong>
          {labels.priceSuffix ? <span>{labels.priceSuffix}</span> : null}
        </div>
        {!hideAction ? (
          <Button
            text={labels.selectLabel}
            iconRight="arrowUpRight"
            className="trem-flight-card__action"
            onClick={() => onSelect?.(flight)}
          />
        ) : null}
      </footer>
    </article>
  );
}

FlightCard.propTypes = {
  flight: PropTypes.object,
  labels: PropTypes.object,
  onSelect: PropTypes.func,
  hideAction: PropTypes.bool,
  className: PropTypes.string,
};
