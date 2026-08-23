import React from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import Button from "../Button/Button.jsx";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import "./TrevioTripCard.scss";

const money = (value, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  } catch {
    return `${currency} ${Number(value || 0).toLocaleString("en-IN")}`;
  }
};

export default function TrevioTripCard({
  trip = {},
  labels = {},
  favorited = false,
  onFavorite,
  onView,
  management = false,
  ownershipMode = "agency",
  onApprove,
  onEdit,
  onDelete,
  deleteLabel = "Delete",
  approveLabel = "Approve and publish",
}) {
  const image = trip.image || trip.photo || trip.photos?.[0];
  const price =
    typeof trip.price === "object" ? trip.price?.amount : (trip.price ?? trip.priceInfo?.min);
  const currency = trip.priceInfo?.currency || trip.price?.currency || "INR";
  const chips = trip.chips || trip.tags || [];
  const location = trip.location || trip.address?.city || trip.city?.to || "India";
  const duration = trip.duration || `${trip.period?.days || 0}D / ${trip.period?.nights || 0}N`;
  const seatsAvailable = trip.availability?.seatsAvailable ?? trip.seatsAvailable;
  const isSoldOut = seatsAvailable === 0;
  const rating = Number(trip.avgRating ?? trip.rating);
  const ratingLabel = Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : "";
  const reviewCount = Number(trip.reviewCount || trip.reviews?.length || 0);
  const agencyInitials = trip.agency?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const owner =
    trip.operator ||
    (trip.ownerAgent && typeof trip.ownerAgent === "object" ? trip.ownerAgent : null);
  const ownerName = trip.ownerAgentName || owner?.name || "";
  const ownership =
    ownershipMode === "agent"
      ? { label: labels.agent || "Added by agent", name: ownerName, logo: "" }
      : {
          label: labels.agency || "Agency",
          name: trip.agency?.name || labels.platformAgency || "TravelsTREM",
          logo: trip.agency?.logo || "",
        };
  const ownershipInitials = ownership.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <article className={`trevio-trip-card${isSoldOut ? " trevio-trip-card--sold-out" : ""}`}>
      <div
        className="trevio-trip-card__image"
        style={image ? { backgroundImage: `url("${image}")` } : undefined}
      >
        <div className="trevio-trip-card__badges">
          <div className="trevio-trip-card__badge-group">
            {trip.tag || trip.category ? (
              <span className="trevio-trip-card__tag">{trip.tag || trip.category}</span>
            ) : null}
            {trip.tremVerified ? (
              <span className="trevio-trip-card__verified">
                <Icon name="badgeCheck" size={14} />
                TREM verified
              </span>
            ) : null}
          </div>
          {ratingLabel ? (
            <span className="trevio-trip-card__rating">
              <Icon name="star" size={13} />
              {ratingLabel}
              {reviewCount ? <small>({reviewCount})</small> : null}
            </span>
          ) : null}
        </div>
        {typeof onFavorite === "function" ? (
          <button
            type="button"
            className={`trevio-trip-card__favorite${favorited ? " is-saved" : ""}`}
            aria-label={favorited ? "Remove trip from wishlist" : "Save trip to wishlist"}
            aria-pressed={favorited}
            onClick={(event) => {
              event.stopPropagation();
              onFavorite?.(trip);
            }}
          >
            <Icon name="heart" size={20} />
          </button>
        ) : null}
        {isSoldOut && (
          <div className="trevio-trip-card__sold-out-note">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 10.5v-5m0 3.5h.01"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {trip.availability?.availabilityMessage}
          </div>
        )}
      </div>
      <div className="trevio-trip-card__body">
        <h3 className="trevio-trip-card__title">{trip.title}</h3>
        {trip.desc || trip.description ? (
          <p className="trevio-trip-card__desc">{trip.desc || trip.description}</p>
        ) : null}
        <div className="trevio-trip-card__facts">
          {location ? (
            <span>
              <Icon name="mapPin" size={14} />
              {location}
            </span>
          ) : null}
          {duration ? (
            <span>
              <Icon name="calendar" size={14} />
              {duration}
            </span>
          ) : null}
          {trip.availability?.seatsAvailable != null && !isSoldOut ? (
            <span>
              <Icon name="usersRound" size={14} />
              {trip.availability.availabilityMessage}
            </span>
          ) : null}
        </div>
        {ownership.name ? (
          <div className="trevio-trip-card__agency">
            {ownership.logo ? (
              <img src={ownership.logo} alt={`${ownership.name} logo`} />
            ) : (
              <span className="trevio-trip-card__agency-avatar" aria-hidden="true">
                {ownershipInitials || agencyInitials || "TT"}
              </span>
            )}
            <span>
              <small>{ownership.label}</small>
              <strong>{ownership.name}</strong>
              {management &&
              ownershipMode === "agent" &&
              (owner?.agentRef || trip.ownerAgentRef) ? (
                <em>{owner?.agentRef || trip.ownerAgentRef}</em>
              ) : null}
            </span>
          </div>
        ) : null}
        <div className="trevio-trip-card__chips">
          {chips.slice(0, 3).map((chip) => (
            <span key={chip} className="trevio-trip-card__chip">
              {chip}
            </span>
          ))}
        </div>
        <div className="trevio-trip-card__footer">
          <div className="trevio-trip-card__price">
            <small>{labels.price}</small>
            <strong>{money(price, currency)}</strong>
          </div>
          {!management && onView ? (
            <button
              type="button"
              className="trevio-trip-card__link"
              onClick={() => onView(trip)}
              disabled={isSoldOut}
            >
              {isSoldOut ? labels.soldOutAction : labels.action}
              <Icon name="chevronRight" size={16} />
            </button>
          ) : null}
        </div>
        {management ? (
          <div
            className="trevio-trip-card__management"
            onClick={(event) => event.stopPropagation()}
          >
            <StatusBadge value={trip.status || "draft"} />
            <div className="trevio-trip-card__management-actions">
              {onApprove ? (
                <Button
                  size="small"
                  variant="solid"
                  color="primary"
                  text={approveLabel}
                  onClick={() => onApprove(trip)}
                />
              ) : null}
              {onView ? (
                <Button size="small" variant="outline" text="View" onClick={() => onView(trip)} />
              ) : null}
              {onEdit ? (
                <Button size="small" variant="outline" text="Edit" onClick={() => onEdit(trip)} />
              ) : null}
              {onDelete ? (
                <Button
                  size="small"
                  variant="text"
                  color="danger"
                  text={deleteLabel}
                  onClick={() => onDelete(trip)}
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
