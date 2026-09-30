import React from "react";
import { Link } from "react-router-dom";

import Button from "../Button/Button.jsx";
import Icon from "../../icons/Icon/Icon.jsx";

import "./TourCard.styles.scss";

/* ========================================================================== */
/* Helpers                                                                    */
/* ========================================================================== */

const formatMoney = (value, currency = "INR") => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency || "INR"} ${amount.toLocaleString("en-IN")}`;
  }
};

const displayText = (value, fallback = "") => {
  if (value == null) {
    return fallback;
  }

  if (["string", "number", "boolean"].includes(typeof value)) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return (
      value
        .map((item) => displayText(item))
        .filter(Boolean)
        .join(", ") || fallback
    );
  }

  if (typeof value === "object") {
    return (
      displayText(value.label ?? value.name ?? value.title ?? value.url) ||
      [value.city, value.country]
        .map((item) => displayText(item))
        .filter(Boolean)
        .join(", ") ||
      fallback
    );
  }

  return fallback;
};

const getBufferedEntityId = (value) => {
  const buffer = value?.buffer;

  if (!buffer || typeof buffer !== "object") {
    return "";
  }

  const bytes = Array.isArray(buffer)
    ? buffer
    : Object.keys(buffer)
        .filter((key) => /^\d+$/.test(key))
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => buffer[key]);

  if (
    bytes.length !== 12 ||
    bytes.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)
  ) {
    return "";
  }

  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const getEntityId = (value) => {
  if (value == null) {
    return "";
  }

  if (["string", "number"].includes(typeof value)) {
    return String(value);
  }

  if (typeof value === "object") {
    if (typeof value.toHexString === "function") {
      return value.toHexString();
    }

    return (
      getEntityId(value._id) ||
      getEntityId(value.id) ||
      getEntityId(value.$oid) ||
      getEntityId(value.value) ||
      getBufferedEntityId(value)
    );
  }

  return "";
};

const getPriceText = (tour) => {
  const currentTour = tour || {};

  const price = currentTour.priceInfo || currentTour.price || currentTour.pricing;

  if (!price) {
    return "Price on request";
  }

  /*
   * Primitive price support.
   */
  if (typeof price === "number" || typeof price === "string") {
    const amount = Number(price);

    return formatMoney(amount, currentTour.currency || "INR") || "Price on request";
  }

  const currency = price.currency || "INR";

  const min = price.minMinor != null ? Number(price.minMinor) / 100 : Number(price.min);

  const max = price.maxMinor != null ? Number(price.maxMinor) / 100 : Number(price.max);

  const hasMin = Number.isFinite(min) && min > 0;

  const hasMax = Number.isFinite(max) && max > 0;

  if (!hasMin && !hasMax) {
    return "Price on request";
  }

  if (price.isFinal || !hasMax || min === max) {
    return formatMoney(hasMin ? min : max, currency) || "Price on request";
  }

  if (!hasMin) {
    return formatMoney(max, currency) || "Price on request";
  }

  return `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`;
};

const getRouteText = (tour) => {
  const currentTour = tour || {};

  const origin = displayText(
    currentTour.city?.from ?? currentTour.route?.origin?.name,
    "Flexible start",
  );

  const destination = displayText(
    currentTour.city?.to ??
      currentTour.route?.destination?.name ??
      currentTour.address?.city ??
      currentTour.location?.city,
    "Curated destination",
  );

  return `${origin} to ${destination}`;
};

const getLocationText = (tour) => {
  const currentTour = tour || {};

  const city = displayText(
    currentTour.address?.city ??
      currentTour.location?.city ??
      currentTour.city?.to ??
      currentTour.city?.from,
  );

  const country = displayText(currentTour.address?.country ?? currentTour.location?.country);

  return [city, country].filter(Boolean).join(", ") || "Curated destination";
};

const getCategory = (tour) => {
  const currentTour = tour || {};

  const tag =
    Array.isArray(currentTour.tags) && currentTour.tags.length
      ? displayText(currentTour.tags[0])
      : "";

  return tag ? `${tag.charAt(0).toUpperCase()}${tag.slice(1)}` : "Tour";
};

const normalizePackagePrices = (value) =>
  (Array.isArray(value) ? value : []).filter(
    (item) => item?.packageKey && Number(item.sellingTotalMinor) > 0,
  );

const findDefaultPackage = (packagePrices) =>
  packagePrices.find((item) => String(item?.name || "").toLowerCase() === "premium") ||
  packagePrices[0] ||
  null;

/* ========================================================================== */
/* Component                                                                  */
/* ========================================================================== */

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
  onVerify,
  className = "",
  variant = "list",
  size = "default",
  showActions = true,
  managementActions = false,
  hideDescription = false,
  simplified = false,
  packagePricesInteractive = true,
  labels = {},
}) {
  const currentTour = tour || {};

  /* ====================================================================== */
  /* Core tour values                                                       */
  /* ====================================================================== */

  const id = getEntityId(currentTour._id) || getEntityId(currentTour.id);

  const title = displayText(currentTour.title, "Untitled Tour");

  const photos = Array.isArray(currentTour.photos) ? currentTour.photos : [];

  const imageSrc =
    displayText(currentTour.photo ?? photos[0] ?? currentTour.coverImage?.url) || null;

  const period = currentTour.period || currentTour.duration || {};

  const description = displayText(currentTour.desc ?? currentTour.shortDescription);

  const avgRating = currentTour.avgRating ?? currentTour.rating?.average;

  const maxGroupSize = currentTour.maxGroupSize ?? currentTour.group?.max;

  const featured = Boolean(currentTour.featured);

  const trending = Boolean(currentTour.trending);

  const reviews = Array.isArray(currentTour.reviews) ? currentTour.reviews : [];

  const tags = (Array.isArray(currentTour.tags) ? currentTour.tags : [])
    .map((tag) => displayText(tag))
    .filter(Boolean);

  const highlights = Array.isArray(currentTour.highlights) ? currentTour.highlights : [];

  const inclusions = Array.isArray(currentTour.inclusions) ? currentTour.inclusions : [];

  const languages = (Array.isArray(currentTour.languages) ? currentTour.languages : [])
    .map((language) => displayText(language))
    .filter(Boolean);

  const availability = currentTour.availability || {};

  const seatsAvailable = availability.seatsAvailable ?? availability.availableSeats;

  /* ====================================================================== */
  /* Rating                                                                 */
  /* ====================================================================== */

  const numericRating = Number(avgRating);

  const displayRating = Number.isFinite(numericRating) ? numericRating.toFixed(1) : "0.0";

  const reviewCount =
    currentTour.reviewCount != null
      ? Number(currentTour.reviewCount)
      : currentTour.rating?.count != null
        ? Number(currentTour.rating.count)
        : reviews.length;

  /* ====================================================================== */
  /* Price                                                                  */
  /* ====================================================================== */

  const priceText = getPriceText(currentTour);

  const packagePrices = React.useMemo(
    () => normalizePackagePrices(currentTour.packagePrices),
    [currentTour.packagePrices],
  );

  const defaultPackage = React.useMemo(() => findDefaultPackage(packagePrices), [packagePrices]);

  const [selectedPackageKey, setSelectedPackageKey] = React.useState(
    currentTour.selectedPackageKey || defaultPackage?.packageKey || "",
  );

  /*
   * Keep package state valid when the card
   * receives updated backend data.
   */
  React.useEffect(() => {
    const requestedKey = currentTour.selectedPackageKey;

    const requestedPackage = requestedKey
      ? packagePrices.find((item) => item.packageKey === requestedKey)
      : null;

    const existingPackage = packagePrices.find((item) => item.packageKey === selectedPackageKey);

    if (requestedPackage) {
      if (requestedPackage.packageKey !== selectedPackageKey) {
        setSelectedPackageKey(requestedPackage.packageKey);
      }

      return;
    }

    if (!existingPackage) {
      setSelectedPackageKey(defaultPackage?.packageKey || "");
    }
  }, [currentTour.selectedPackageKey, defaultPackage, packagePrices, selectedPackageKey]);

  const selectedPackage =
    packagePrices.find((item) => item.packageKey === selectedPackageKey) || defaultPackage;

  /* ====================================================================== */
  /* Derived tour information                                               */
  /* ====================================================================== */

  const routeText = getRouteText(currentTour);

  const locationText = getLocationText(currentTour);

  const category = getCategory(currentTour);

  const resolvedOwnerName =
    ownerAgentName ||
    currentTour.ownerAgentName ||
    (typeof currentTour.ownerAgent === "object" ? currentTour.ownerAgent?.name : "");

  const truncatedDesc = description
    ? `${description.slice(0, 150)}${description.length > 150 ? "..." : ""}`
    : "";

  /* ====================================================================== */
  /* Modes                                                                  */
  /* ====================================================================== */

  const showHeart = typeof favorited === "boolean" && typeof onFavorite === "function";

  const hasTags = tags.length > 0;

  const isCompact = variant === "compact";

  const isFeaturedCard = variant === "featured";

  const isManagement = variant === "management";

  const isCustomerCard = isManagement && !isAdmin;

  const hasManagementActions = Boolean(
    managementActions || isAdmin || (isManagement && (onEdit || onVerify || onDelete)),
  );

  const canNavigate = Boolean(!hasManagementActions && (path || typeof onView === "function"));

  const hasExplicitViewAction = Boolean(
    showActions && !isAdmin && !hasManagementActions && (path || typeof onView === "function"),
  );

  const footerHasViewAction = hasExplicitViewAction && (variant === "list" || isCustomerCard);

  const needsStandaloneMobileAction = hasExplicitViewAction && !footerHasViewAction;

  /* ====================================================================== */
  /* Status                                                                 */
  /* ====================================================================== */

  const status = String(
    currentTour.status || (currentTour.isPublished === false ? "draft" : "published"),
  ).toLowerCase();

  const isDraft = status === "draft";

  const isVerified = Boolean(currentTour.tremVerified);

  /* ====================================================================== */
  /* Copy                                                                   */
  /* ====================================================================== */

  const copy = {
    draft: "Draft",
    published: "Published",
    active: "Active",
    archived: "Archived",

    featured: "Featured",
    trending: "Trending",
    verified: "TREM verified",

    view: "View",
    viewTour: "Explore this Tour",

    edit: "Edit",
    continue: "Continue",
    remove: "Delete",
    verify: "Verify",

    ...labels,
  };

  /* ====================================================================== */
  /* Detail items                                                           */
  /* ====================================================================== */

  const detailItems = [
    Array.isArray(highlights) && highlights[0]?.short
      ? {
          icon: highlights[0].icon || "sparkles",

          text: highlights[0].short,
        }
      : null,

    Array.isArray(inclusions) && inclusions[0]
      ? {
          icon: "check",
          text: inclusions[0],
        }
      : null,

    Array.isArray(languages) && languages[0]
      ? {
          icon: "guide",

          text: `${languages.slice(0, 2).join(", ")} guide`,
        }
      : null,

    seatsAvailable
      ? {
          icon: "ticket",
          text: `${seatsAvailable} seats left`,
        }
      : null,
  ]
    .filter(Boolean)
    .slice(0, 3);

  /* ====================================================================== */
  /* Navigation payload                                                     */
  /* ====================================================================== */

  const getSelectedTourPayload = React.useCallback(
    () =>
      packagePricesInteractive && selectedPackage
        ? {
            ...currentTour,

            selectedPackageKey: selectedPackage.packageKey,

            selectedPackageDetails: selectedPackage,
          }
        : currentTour,
    [currentTour, packagePricesInteractive, selectedPackage],
  );

  /* ====================================================================== */
  /* Handlers                                                               */
  /* ====================================================================== */

  const handleView = React.useCallback(
    (event) => {
      event?.stopPropagation?.();
      event?.preventDefault?.();

      onView?.(getSelectedTourPayload());
    },
    [getSelectedTourPayload, onView],
  );

  const handleFavClick = React.useCallback(
    (event) => {
      event.stopPropagation();
      event.preventDefault();

      onFavorite?.(currentTour);
    },
    [currentTour, onFavorite],
  );

  const handleEdit = React.useCallback(
    (event) => {
      event.stopPropagation();
      event.preventDefault();

      onEdit?.(currentTour);
    },
    [currentTour, onEdit],
  );

  const handleDelete = React.useCallback(
    (event) => {
      event.stopPropagation();
      event.preventDefault();

      onDelete?.(currentTour);
    },
    [currentTour, onDelete],
  );

  const handleVerify = React.useCallback(
    (event) => {
      event.stopPropagation();
      event.preventDefault();

      onVerify?.(currentTour);
    },
    [currentTour, onVerify],
  );

  /* ====================================================================== */
  /* Full-card navigation target                                            */
  /* ====================================================================== */

  const cardClickTarget = canNavigate ? (
    path ? (
      <Link
        to={path}
        className="tour-card__click-target"
        aria-labelledby={id ? `tour-card-${id}-title` : undefined}
        aria-label={id ? undefined : `Explore ${title}`}
      />
    ) : (
      <button
        type="button"
        className="tour-card__click-target"
        aria-labelledby={id ? `tour-card-${id}-title` : undefined}
        aria-label={id ? undefined : `Explore ${title}`}
        onClick={handleView}
      />
    )
  ) : null;

  /* ====================================================================== */
  /* View CTA                                                               */
  /* ====================================================================== */

  const viewAction = hasExplicitViewAction ? (
    path ? (
      <Link
        to={path}
        className="tour-card__view-link"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {copy.viewTour}
      </Link>
    ) : (
      <Button
        type="button"
        text={copy.viewTour}
        variant="solid"
        color="primary"
        size="small"
        onClick={handleView}
        primaryClassName="tour-card__view-btn"
      />
    )
  ) : null;

  /* ====================================================================== */
  /* Media                                                                  */
  /* ====================================================================== */

  const cardMedia = (
    <div className="tour-card__media" aria-hidden={!imageSrc}>
      {showHeart ? (
        <button
          className={["tour-card__heart", favorited ? "is-favorited" : ""]
            .filter(Boolean)
            .join(" ")}
          onClick={handleFavClick}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          type="button"
        >
          <Icon name="heart" size={18} />
        </button>
      ) : null}

      {isAdmin || featured || trending ? (
        <div className="tour-card__status-badges" aria-label="Tour status">
          {isAdmin ? (
            <span
              className={[
                "tour-card__badge",
                "tour-card__badge--status",
                `tour-card__badge--${status}`,
              ].join(" ")}
            >
              {copy[status] || status}
            </span>
          ) : null}

          {featured ? (
            <span className="tour-card__badge tour-card__badge--featured">
              <Icon name="star" size={13} />

              {copy.featured}
            </span>
          ) : null}

          {trending ? (
            <span className="tour-card__badge tour-card__badge--trending">
              <Icon name="sparkles" size={13} />

              {copy.trending}
            </span>
          ) : null}

          {isVerified && isAdmin ? (
            <span className="tour-card__badge tour-card__badge--verified">
              <Icon name="badgeCheck" size={13} />

              {copy.verified}
            </span>
          ) : null}
        </div>
      ) : null}

      {seatsAvailable != null && !isCompact && !simplified ? (
        <span
          className={["tour-card__availability", Number(seatsAvailable) === 0 ? "is-sold-out" : ""]
            .filter(Boolean)
            .join(" ")}
        >
          {Number(seatsAvailable) === 0 ? "Sold out" : `${seatsAvailable} seats`}
        </span>
      ) : null}

      {imageSrc ? (
        <img
          src={imageSrc}
          alt={title || "Tour image"}
          loading="lazy"
          decoding="async"
          className="tour-card__img"
        />
      ) : (
        <div className="tour-card__placeholder">
          <Icon name="mountain" size={48} />
        </div>
      )}

      {!isCompact && priceText && (isFeaturedCard || variant === "grid") ? (
        <div className="tour-card__price-overlay">
          <span className="tour-card__price-label">From</span>

          <span className="tour-card__price-value">{priceText}</span>
        </div>
      ) : null}

      {(!simplified || withAgency) &&
      (withAgency || currentTour.agency?.logo) &&
      (agencyLogo || currentTour.agency?.logo) ? (
        <div className="tour-card__agency-logo">
          <img
            src={agencyLogo || currentTour.agency.logo}
            alt={currentTour.agency?.name ? `${currentTour.agency.name} logo` : "Tour agency logo"}
            loading="lazy"
          />
        </div>
      ) : null}
    </div>
  );

  /* ====================================================================== */
  /* Header                                                                 */
  /* ====================================================================== */

  const cardHeader = (
    <div className="tour-card__header">
      {!isFeaturedCard && !isCompact ? (
        <div className="tour-card__kicker">
          <Icon name="route" size={12} />

          <span>{routeText}</span>
        </div>
      ) : null}

      <h3 className="tour-card__title" id={id ? `tour-card-${id}-title` : undefined} title={title}>
        {title || "Untitled Tour"}
      </h3>
    </div>
  );

  /* ====================================================================== */
  /* Labels                                                                 */
  /* ====================================================================== */

  const cardLabels = !isCompact ? (
    <div className="tour-card__content-badges" aria-label="Tour labels">
      <span className="tour-card__content-badge">{category}</span>

      {isVerified && (!isManagement || isCustomerCard) ? (
        <span className="tour-card__content-badge tour-card__content-badge--verified">
          <Icon name="badgeCheck" size={13} />
          TREM verified
        </span>
      ) : null}
    </div>
  ) : null;

  /* ====================================================================== */
  /* Meta                                                                   */
  /* ====================================================================== */

  const cardMeta = (
    <div className="tour-card__meta">
      <div className="tour-card__rating-wrapper">
        <Icon name="star" size={13} />

        <span className="tour-card__rating-value">{displayRating}</span>

        <span className="tour-card__review-count">({reviewCount})</span>
      </div>

      <div className="tour-card__location">
        <Icon name="mapPin" size={14} />

        <span title={locationText}>{locationText}</span>
      </div>

      {!simplified &&
      (ownershipMode === "agency" || ownershipMode === "auto") &&
      (currentTour.agency?.name || ownershipLabels.platformAgency) ? (
        <div className="tour-card__owner">
          <Icon name="building2" size={13} />

          <span>
            <small>{ownershipLabels.agency || "Agency"}</small>

            {currentTour.agency?.name || ownershipLabels.platformAgency}
          </span>
        </div>
      ) : null}

      {!simplified &&
      (ownershipMode === "agent" || (ownershipMode === "auto" && showOwner)) &&
      resolvedOwnerName ? (
        <div className="tour-card__owner">
          <Icon name="user" size={13} />

          <span>
            <small>{ownershipLabels.agent || "Added by agent"}</small>

            {resolvedOwnerName}
          </span>
        </div>
      ) : null}
    </div>
  );

  /* ====================================================================== */
  /* Description                                                            */
  /* ====================================================================== */

  const cardDescription =
    !isCompact && !hideDescription && truncatedDesc ? (
      <p className="tour-card__desc">{truncatedDesc}</p>
    ) : null;

  /* ====================================================================== */
  /* Grid summary                                                           */
  /* ====================================================================== */

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

  /* ====================================================================== */
  /* Details                                                                */
  /* ====================================================================== */

  const cardDetails =
    !isCompact && detailItems.length ? (
      <div className="tour-card__details">
        {detailItems.map((item, index) => (
          <span className="tour-card__detail" key={`${item.text}-${index}`}>
            <Icon name={item.icon} size={13} />

            <span>{item.text}</span>
          </span>
        ))}
      </div>
    ) : null;

  /* ====================================================================== */
  /* Tags                                                                   */
  /* ====================================================================== */

  const cardTags =
    !isCompact && hasTags ? (
      <div className="tour-card__tags">
        {tags.slice(0, isFeaturedCard ? 4 : 3).map((tag, index) => (
          <span key={`${tag}-${index}`} className="tour-card__tag" title={tag}>
            {tag}
          </span>
        ))}
      </div>
    ) : null;

  /* ====================================================================== */
  /* Facts                                                                  */
  /* ====================================================================== */

  const cardFacts = (
    <div className="tour-card__facts">
      <span className="tour-card__fact">
        <Icon name="calendar" size={14} />

        <span>
          {period?.days ?? "-"}d {period?.nights ?? "-"}n
        </span>
      </span>

      <span className="tour-card__fact">
        <Icon name="usersRound" size={14} />

        <span>Max {maxGroupSize ?? "-"}</span>
      </span>
    </div>
  );

  const listingFacts = (
    <div className="tour-card__facts">
      {period?.days != null ? (
        <span className="tour-card__fact">
          <Icon name="calendar" size={14} />

          <span>{period.days} days</span>
        </span>
      ) : null}

      {seatsAvailable != null ? (
        <span className="tour-card__fact">
          <Icon name="ticket" size={14} />

          <span>{Number(seatsAvailable) === 0 ? "Sold out" : `${seatsAvailable} seats`}</span>
        </span>
      ) : null}

      {Number(availability.departureCount) > 1 ? (
        <span className="tour-card__fact">
          <Icon name="route" size={14} />

          <span>{availability.departureCount} departures</span>
        </span>
      ) : null}
    </div>
  );

  /* ====================================================================== */
  /* Package prices                                                         */
  /* ====================================================================== */

  const packagePriceSelector = packagePrices.length ? (
    <div
      className={[
        "tour-card__package-prices",
        packagePricesInteractive ? "is-interactive" : "is-read-only",
      ].join(" ")}
      role={packagePricesInteractive ? "radiogroup" : "list"}
      aria-label={packagePricesInteractive ? "Choose package" : "Package prices"}
      style={{
        "--tour-card-package-count": Math.min(packagePrices.length, 3),
      }}
      onClick={packagePricesInteractive ? (event) => event.stopPropagation() : undefined}
    >
      {packagePrices.map((item) => {
        const selected = item.packageKey === selectedPackage?.packageKey;
        const recommended = String(item?.name || "").toLowerCase() === "premium";

        const formattedPrice = formatMoney(
          Number(item.sellingTotalMinor) / 100,
          item.currency || "INR",
        );

        const content = (
          <>
            <span className="tour-card__package-name">{displayText(item.name, "Package")}</span>

            <strong className="tour-card__package-price">{formattedPrice}</strong>
          </>
        );

        return packagePricesInteractive ? (
          <button
            key={item.packageKey}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${displayText(item.name, "Package")}, ${formattedPrice}`}
            className={["tour-card__package-option", selected ? "is-selected" : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={(event) => {
              event.stopPropagation();

              setSelectedPackageKey(item.packageKey);
            }}
          >
            {content}

            {selected ? (
              <span className="tour-card__package-selected-mark" aria-hidden="true" />
            ) : null}
          </button>
        ) : (
          <div
            key={item.packageKey}
            role="listitem"
            className={[
              "tour-card__package-option",
              "is-read-only",
              recommended ? "is-recommended" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={`${displayText(item.name, "Package")}, ${formattedPrice}${recommended ? ", recommended" : ""}`}
          >
            {content}
          </div>
        );
      })}
    </div>
  ) : null;

  /* ====================================================================== */
  /* Footer                                                                 */
  /* ====================================================================== */

  const cardFooter = (
    <div className="tour-card__footer">
      {simplified ? listingFacts : cardFacts}

      <div
        className={["tour-card__actions", packagePrices.length ? "has-package-prices" : ""]
          .filter(Boolean)
          .join(" ")}
      >
        {packagePriceSelector ||
          ((variant === "list" || isFeaturedCard || isManagement) && priceText && (
            <div className="tour-card__price">
              <span className="tour-card__price-prefix">From</span>

              <span className="tour-card__price-amount">{priceText}</span>
            </div>
          ))}

        {footerHasViewAction ? viewAction : null}

        {showActions && hasManagementActions ? (
          <div
            className="tour-card__admin"
            role="group"
            aria-label={isAdmin ? "admin actions" : "tour management actions"}
            onClick={(event) => event.stopPropagation()}
          >
            {onView ? (
              <Button
                text={copy.view}
                variant="solid"
                color="primary"
                size="small"
                onClick={handleView}
              />
            ) : null}

            {onEdit ? (
              <Button
                text={isDraft ? copy.continue : copy.edit}
                variant="outline"
                color="secondary"
                size="small"
                onClick={handleEdit}
              />
            ) : null}

            {onVerify && !isVerified ? (
              <Button
                text={copy.verify}
                variant="outline"
                color="primary"
                size="small"
                onClick={handleVerify}
              />
            ) : null}

            {onDelete ? (
              <Button
                text={copy.remove}
                variant="solid"
                color="danger"
                size="small"
                onClick={handleDelete}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );

  /* ====================================================================== */
  /* Normal body                                                            */
  /* ====================================================================== */

  const cardBody = (
    <div className="tour-card__body">
      {cardLabels}

      {cardHeader}

      {!isCompact ? cardMeta : null}

      {!simplified ? cardDescription : null}

      {!simplified ? cardDetails : null}

      {!simplified ? cardTags : null}

      <div className="tour-card__spacer" />

      {!isCompact ? (
        cardFooter
      ) : (
        <div className="tour-card__compact-footer">
          {cardFacts}

          {priceText ? (
            <div className="tour-card__price">
              <span className="tour-card__price-amount">{priceText}</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );

  /* ====================================================================== */
  /* Card content                                                           */
  /* ====================================================================== */

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

          {!isCompact ? cardTags : null}

          {!isCompact ? cardFacts : null}
        </div>
      </>
    ) : (
      <>
        {cardMedia}

        {cardBody}
      </>
    );

  /* ====================================================================== */
  /* Classes                                                                */
  /* ====================================================================== */

  const baseClasses = [
    "tour-card",

    `tour-card--${variant}`,

    size !== "default" ? `tour-card--${size}` : "",

    isCustomerCard ? "tour-card--customer" : "",

    simplified ? "tour-card--simplified" : "",

    featured ? "is-featured" : "",

    showHeart ? "has-favorite-control" : "",

    canNavigate ? "is-clickable-card" : "",

    hasExplicitViewAction ? "has-explicit-view-action" : "",

    packagePrices.length ? "has-package-prices" : "",

    className,
  ]
    .filter(Boolean)
    .join(" ");

  /* ====================================================================== */
  /* Render                                                                 */
  /* ====================================================================== */

  return (
    <article className={baseClasses} aria-labelledby={id ? `tour-card-${id}-title` : undefined}>
      {cardClickTarget}

      {cardContent}

      {needsStandaloneMobileAction ? (
        <div className="tour-card__mobile-action">{viewAction}</div>
      ) : null}
    </article>
  );
});

export default TourCard;
