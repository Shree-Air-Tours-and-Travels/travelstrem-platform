import React from "react";
import { Link } from "react-router-dom";
import Button from "../Button/Button.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./TourCard.styles.scss";

const formatMoney = (value, currency = "INR") => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
};

const getPriceText = (tour) => {
  const t = tour || {};
  const price = t.priceInfo || t.price;
  if (!price) return "Price on request";
  const currency = price.currency || "INR";
  if (Number(price.min) <= 0 && Number(price.max) <= 0) return "Price on request";
  if (price.isFinal || Number(price.min) === Number(price.max))
    return formatMoney(price.min, currency);
  return `${formatMoney(price.min, currency)} – ${formatMoney(price.max, currency)}`;
};

const getRouteText = (tour) => {
  const t = tour || {};
  const origin = t.city?.from || "Flexible start";
  const destination = t.city?.to || t.address?.city || "Curated destination";
  return `${origin} to ${destination}`;
};

const getLocationText = (tour) => {
  const t = tour || {};
  const city = t.address?.city || t.city?.to || t.city?.from;
  const country = t.address?.country;
  return [city, country].filter(Boolean).join(", ") || "Curated destination";
};

const getCategory = (tour) => {
  const t = tour || {};
  const tag = Array.isArray(t.tags) && t.tags.length ? t.tags[0] : "";
  return tag ? `${tag.charAt(0).toUpperCase()}${tag.slice(1)}` : "Tour";
};

const TourCard = React.memo(function TourCard({
  tour,
  path,
  onView,
  favorited,
  onFavorite,
  withAgency = false,
  agencyLogo = "",
  ownerAgentName = "",
  showOwner = false,
  ownershipMode = "auto",
  ownershipLabels = {},
  isAdmin = false,
  onEdit,
  onDelete,
  className = "",
  variant = "list",
  size = "default",
  showActions = true,
}) {
  const t = tour || {};
  const {
    _id,
    title,
    photo,
    photos = [],
    period = {},
    desc,
    avgRating,
    maxGroupSize,
    featured,
    reviews = [],
    tags = [],
    highlights = [],
    inclusions = [],
    languages = [],
    availability = {},
  } = t;

  const imageSrc = photo ? photo : photos?.length ? photos[0] : null;
  const numericRating = Number(avgRating);
  const displayRating = Number.isFinite(numericRating)
    ? numericRating.toFixed(1)
    : "0.0";
  const priceText = getPriceText(tour);
  const routeText = getRouteText(tour);
  const locationText = getLocationText(tour);
  const category = getCategory(tour);
  const resolvedOwnerName = ownerAgentName || t.ownerAgentName || (typeof t.ownerAgent === "object" ? t.ownerAgent?.name : "");
  const reviewCount =
    t.reviewCount != null
      ? Number(t.reviewCount)
      : Array.isArray(reviews)
        ? reviews.length
        : 0;
  const truncatedDesc = desc
    ? `${desc.slice(0, 150)}${desc.length > 150 ? "..." : ""}`
    : "";
  const showHeart =
    typeof favorited === "boolean" && typeof onFavorite === "function";
  const hasTags = Array.isArray(tags) && tags.length > 0;
  const isCompact = variant === "compact";
  const isFeaturedCard = variant === "featured";
  const detailItems = [
    Array.isArray(highlights) && highlights[0]?.short
      ? { icon: highlights[0].icon || "sparkles", text: highlights[0].short }
      : null,
    Array.isArray(inclusions) && inclusions[0]
      ? { icon: "check", text: inclusions[0] }
      : null,
    Array.isArray(languages) && languages[0]
      ? { icon: "guide", text: `${languages.slice(0, 2).join(", ")} guide` }
      : null,
    availability?.seatsAvailable
      ? { icon: "ticket", text: `${availability.seatsAvailable} seats left` }
      : null,
  ].filter(Boolean).slice(0, 3);

  const handleClick = () => {
    if (!path && typeof onView === "function") onView(tour);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (path) return;
      onView?.(tour);
    }
  };

  const handleFavClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onFavorite?.(tour);
  };

  const handleView = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onView?.(tour);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(tour);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(tour);
  };

  const cardMedia = (
    <div className="tour-card__media" aria-hidden={!imageSrc}>
      {showHeart && (
        <button
          className={`tour-card__heart${favorited ? " is-favorited" : ""}`}
          onClick={handleFavClick}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          type="button"
        >
          <Icon name="heart" size={18} />
        </button>
      )}

      {featured && (
        <div className="tour-card__status-badges" aria-label="Tour status">
          <span className="tour-card__badge tour-card__badge--featured">
            <Icon name="sparkles" size={14} /> Trending
          </span>
        </div>
      )}

      {availability?.seatsAvailable != null && !isCompact ? (
        <span className={`tour-card__availability${Number(availability.seatsAvailable) === 0 ? " is-sold-out" : ""}`}>
          {Number(availability.seatsAvailable) === 0 ? "Sold out" : `${availability.seatsAvailable} seats`}
        </span>
      ) : null}

      {imageSrc ? (
        <img
          src={imageSrc}
          alt={title || "Tour image"}
          loading="lazy"
          className="tour-card__img"
        />
      ) : (
        <div className="tour-card__placeholder">
          <Icon name="mountain" size={48} />
        </div>
      )}

      {!isCompact && priceText && (isFeaturedCard || variant === "grid") && (
        <div className="tour-card__price-overlay">
          <span className="tour-card__price-label">From</span>
          <span className="tour-card__price-value">{priceText}</span>
        </div>
      )}

      {(withAgency || t.agency?.logo) && (agencyLogo || t.agency?.logo) && (
        <div className="tour-card__agency-logo">
          <img src={agencyLogo || t.agency.logo} alt="" />
        </div>
      )}
    </div>
  );

  const cardHeader = (
    <div className="tour-card__header">
      {!isFeaturedCard && !isCompact && (
        <div className="tour-card__kicker">
          <Icon name="route" size={12} />
          <span>{routeText}</span>
        </div>
      )}

      <h3
        className="tour-card__title"
        id={_id ? `tour-card-${_id}-title` : undefined}
      >
        {title || "Untitled Tour"}
      </h3>
    </div>
  );

  const cardLabels = !isCompact ? (
    <div className="tour-card__content-badges" aria-label="Tour labels">
      <span className="tour-card__content-badge">{category}</span>
      {t.tremVerified ? (
        <span className="tour-card__content-badge tour-card__content-badge--verified">
          <Icon name="badgeCheck" size={13} /> TREM verified
        </span>
      ) : null}
    </div>
  ) : null;

  const cardMeta = (
    <div className="tour-card__meta">
      <div className="tour-card__rating-wrapper">
        <Icon name="star" size={13} />
        <span className="tour-card__rating-value">{displayRating}</span>
        <span className="tour-card__review-count">({reviewCount})</span>
      </div>

      <div className="tour-card__location">
        <Icon name="mapPin" size={14} />
        <span>{locationText}</span>
      </div>
      {(ownershipMode === "agency" || ownershipMode === "auto") && (t.agency?.name || ownershipLabels.platformAgency) ? (
        <div className="tour-card__owner">
          <Icon name="building2" size={13} />
          <span><small>{ownershipLabels.agency || "Agency"}</small>{t.agency?.name || ownershipLabels.platformAgency}</span>
        </div>
      ) : null}
      {(ownershipMode === "agent" || (ownershipMode === "auto" && showOwner)) && resolvedOwnerName && (
        <div className="tour-card__owner">
          <Icon name="user" size={13} />
          <span><small>{ownershipLabels.agent || "Added by agent"}</small>{resolvedOwnerName}</span>
        </div>
      )}
    </div>
  );

  const cardDescription = !isCompact && truncatedDesc ? (
    <p className="tour-card__desc">{truncatedDesc}</p>
  ) : null;

  const cardSummary = !isCompact ? (
    <div className="tour-card__summary">
      {truncatedDesc ? (
        <p className="tour-card__desc">{truncatedDesc}</p>
      ) : (
        <p className="tour-card__desc">
          Curated {category.toLowerCase()} tour from {routeText}.
        </p>
      )}
      <div className="tour-card__route-note">
        <Icon name="route" size={13} />
        <span>{routeText}</span>
      </div>
    </div>
  ) : null;

  const cardDetails = !isCompact && detailItems.length ? (
    <div className="tour-card__details">
      {detailItems.map((item, index) => (
        <span className="tour-card__detail" key={`${item.text}-${index}`}>
          <Icon name={item.icon} size={13} />
          <span>{item.text}</span>
        </span>
      ))}
    </div>
  ) : null;

  const cardTags = !isCompact && hasTags ? (
    <div className="tour-card__tags">
      {tags.slice(0, isFeaturedCard ? 4 : 3).map((t, i) => (
        <span key={i} className="tour-card__tag">
          {t}
        </span>
      ))}
    </div>
  ) : null;

  const cardFacts = (
    <div className="tour-card__facts">
      <span className="tour-card__fact">
        <Icon name="calendar" size={14} />
        <span>{period?.days ?? "-"}d {period?.nights ?? "-"}n</span>
      </span>
      <span className="tour-card__fact">
        <Icon name="usersRound" size={14} />
        <span>Max {maxGroupSize ?? "-"}</span>
      </span>
    </div>
  );

  const cardFooter = (
    <div className="tour-card__footer">
      {cardFacts}

      <div className="tour-card__actions">
        {(variant === "list" || isFeaturedCard) && priceText && (
          <div className="tour-card__price">
            <span className="tour-card__price-prefix">From</span>
            <span className="tour-card__price-amount">{priceText}</span>
          </div>
        )}

        {showActions && variant === "list" && onView && !isAdmin && (
          <Button
            text="View tour"
            variant="solid"
            color="primary"
            size="small"
            onClick={handleView}
            primaryClassName="tour-card__view-btn"
          />
        )}

        {isAdmin && (
          <div
            className="tour-card__admin"
            role="group"
            aria-label="admin actions"
            onClick={(e) => e.stopPropagation()}
          >
            {onView && (
              <Button
                text="View"
                variant="solid"
                color="primary"
                size="small"
                onClick={handleView}
              />
            )}
            {onEdit && (
              <Button
                text="Edit"
                variant="outline"
                color="secondary"
                size="small"
                onClick={handleEdit}
              />
            )}
            {onDelete && (
              <Button
                text="Delete"
                variant="solid"
                color="danger"
                size="small"
                onClick={handleDelete}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );

  const cardBody = (
    <div className="tour-card__body">
      {cardLabels}
      {cardHeader}
      {!isCompact && cardMeta}
      {cardDescription}
      {cardDetails}
      {cardTags}
      <div className="tour-card__spacer" />
      {!isCompact && cardFooter}
      {isCompact && (
        <div className="tour-card__compact-footer">
          {cardFacts}
          {priceText && (
            <div className="tour-card__price">
              <span className="tour-card__price-amount">{priceText}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const cardContent =
    variant === "grid" ? (
      <>
        {cardMedia}
        <div className="tour-card__content">
          {cardLabels}
          {cardHeader}
          {cardMeta}
          {cardSummary}
          {cardDetails}
          {!isCompact && cardTags}
          {!isCompact && cardFacts}
        </div>
      </>
    ) : (
      <>
        {cardMedia}
        {cardBody}
      </>
    );

  const baseClasses = `tour-card tour-card--${variant}${
    size !== "default" ? ` tour-card--${size}` : ""
  }${featured ? " is-featured" : ""}${showHeart ? " has-favorite-control" : ""}${className ? ` ${className}` : ""}`;

  if (path) {
    return (
      <Link
        to={path}
        className={baseClasses}
        aria-labelledby={_id ? `tour-card-${_id}-title` : undefined}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <article
      className={baseClasses}
      aria-labelledby={_id ? `tour-card-${_id}-title` : undefined}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {cardContent}
    </article>
  );
});

export default TourCard;
