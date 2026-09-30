import React, { useState } from "react";
import PropTypes from "prop-types";
import Button from "../Button/Button.jsx";
import Gallery from "../Gallery/Gallery.jsx";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import InfoTooltip from "../InfoTooltip/InfoTooltip.jsx";
import "./HotelRoomCard.styles.scss";

const FACILITY_PREVIEW_COUNT = 6;

function RoomDetailSection({ section, labels }) {
  const [open, setOpen] = useState(["room", "rate", "price"].includes(section.id));
  return (
    <details
      className="trem-hotel-room-card__expanded-section"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <h5>{section.title || labels[section.titleRef]}</h5>
        <Icon name="chevronDown" size={18} aria-hidden="true" />
      </summary>
      <dl>
        {section.items?.map((item, itemIndex) => (
          <div key={`${item.id}-${itemIndex}`}>
            {item.icon ? <Icon name={item.icon} size={18} aria-hidden="true" /> : null}
            <span>
              {item.label || item.labelRef ? <dt>{item.label || labels[item.labelRef]}</dt> : null}
              <dd>
                {item.value}
                {item.detail ? <small>{item.detail}</small> : null}
                {item.help ? <InfoTooltip label={`About ${item.label || labels[item.labelRef]}`} text={item.help} inModal hide={item.id === "fee"} /> : null}
              </dd>
            </span>
          </div>
        ))}
      </dl>
    </details>
  );
}

export function HotelRoomDetails({ room, labels = {}, inline = false, className = "" }) {
  const expandedSections = room.expandedDetails?.sections || [];
  const shownIds = new Set(expandedSections.flatMap((section) => (section.items || []).map((item) => item.id)));
  const roomExtras = (room.detailFields || []).filter((item) => !shownIds.has(item.id) && item.id === "occupancy");
  const extraIds = new Set(shownIds);
  const rateExtras = [...(room.detailFields || []), ...(room.priceFacts || [])].filter((item) => {
    if (item.id === "occupancy" || extraIds.has(item.id)) return false;
    extraIds.add(item.id);
    return true;
  });
  const sections = expandedSections.map((section) => ({
    ...section,
    items: [...(section.items || []), ...(section.id === "room" ? roomExtras : []), ...(section.id === "rate" ? rateExtras : [])],
  }));
  if (roomExtras.length && !sections.some((section) => section.id === "room")) sections.push({ id: "room", titleRef: "roomInformation", items: roomExtras });
  if (rateExtras.length && !sections.some((section) => section.id === "rate")) sections.push({ id: "rate", titleRef: "rateConditions", items: rateExtras });
  if (room.priceFields?.length) sections.push({ id: "price", titleRef: "priceDetails", items: room.priceFields });
  const order = { room: 0, price: 1, rate: 2 };
  sections.sort((a, b) => (order[a.id] ?? 3) - (order[b.id] ?? 3));

  return (
    <div
      className={`trem-hotel-room-card__gallery${inline ? "" : " trem-hotel-room-card__gallery--standalone"} ${className}`.trim()}
    >
      {room.images?.length ? (
        <Gallery
          images={room.images}
          title={room.galleryTitle}
          subtitle={room.title}
          labels={labels}
          aspectRatio="16 / 7"
        />
      ) : null}
      {sections.length ? (
        <section className="trem-hotel-room-card__expanded-details">
          <header>
            {room.expandedDetails?.titleRef ? <h4>{labels[room.expandedDetails.titleRef]}</h4> : null}
            {room.expandedDetails?.description ? <p>{room.expandedDetails.description}</p> : null}
          </header>
          <div className="trem-hotel-room-card__expanded-grid">
            {sections.map((section, sectionIndex) => (
              <RoomDetailSection
                key={`${section.id}-${sectionIndex}`}
                section={section}
                labels={labels}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function HotelRoomCard({
  room,
  variants = [],
  variant = "full",
  assignedSlots = [],
  labels = {},
  selected = false,
  expanded = false,
  disabled = false,
  onSelect,
  onOpenRates,
  onToggle,
  renderExpandedDetails = true,
  className = "",
}) {
  const expandedSections = room.expandedDetails?.sections || [];
  const hasExpandedContent = Boolean(room.images?.length || expandedSections.length);
  const hasVariants = variants.length > 1;
  const nightlyPrice = room.priceFields?.find((field) => field.id === "nightly");
  const openDetailsFromCard = (event) => {
    const clickedControl = event.target.closest?.(
      "button, a, input, select, textarea, summary, [role='button']",
    );
    if (!clickedControl && hasExpandedContent && !disabled) onToggle?.();
  };

  if (variant === "preview") {
    return (
      <article
        className={`trem-hotel-room-card trem-hotel-room-card--preview${selected || assignedSlots.length ? " trem-hotel-room-card--selected" : ""}${disabled ? " trem-hotel-room-card--disabled" : ""} ${className}`}
        aria-disabled={disabled || undefined}
      >
        <div className="trem-hotel-room-card__media">
          <img src={room.image} alt={room.imageAlt || room.title} loading="lazy" />
          {room.imageCountLabel ? (
            <span className="trem-hotel-room-card__photo-count">
              <Icon name="camera" size={16} aria-hidden="true" />
              {room.imageCountLabel}
            </span>
          ) : null}
        </div>
        <div className="trem-hotel-room-card__preview-content">
          <div className="trem-hotel-room-card__preview-main">
            <div className="trem-hotel-room-card__heading">
              <h3>{room.title}</h3>
              {room.meta ? <p>{room.meta}</p> : null}
            </div>
            {assignedSlots.length ? (
              <div className="trem-hotel-room-card__assignments" aria-label={labels.selectedRooms}>
                {assignedSlots.map(({ slot, rateLabel }) => (
                  <span key={slot}>
                    <Icon name="check" size={15} aria-hidden="true" />
                    <strong>{slot}</strong>
                    {rateLabel ? <span>{rateLabel}</span> : null}
                  </span>
                ))}
              </div>
            ) : null}
            {variants.length === 1 && room.rateSummary ? (
              <p className="trem-hotel-room-card__preview-rate">
                <Icon name="check" size={16} aria-hidden="true" />
                {room.rateSummary}
              </p>
            ) : null}
            <div className="trem-hotel-room-card__preview-facts">
              {(room.detailFields || []).filter((field) => ["occupancy", "meal"].includes(field.id) && field.value).map((field) => (
                <span key={field.id}><Icon name={field.icon || "check"} size={16} aria-hidden="true" />{field.value}</span>
              ))}
            </div>
            {room.facilities?.length ? (
              <div className="trem-hotel-room-card__facilities">
                {room.facilities.slice(0, FACILITY_PREVIEW_COUNT).map((facility, index) => (
                  <span key={`${facility.value}-${index}`}>{facility.value}</span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="trem-hotel-room-card__preview-footer">
            {nightlyPrice ? (
              <div className="trem-hotel-room-card__preview-price">
                <strong>{nightlyPrice.value}</strong>
                <span>{labels[nightlyPrice.labelRef]}</span>
              </div>
            ) : null}
            <div className="trem-hotel-room-card__preview-actions">
              {hasExpandedContent ? (
                <Button
                  text={labels.viewRoomDetails}
                  variant="text"
                  disabled={disabled}
                  aria-haspopup="dialog"
                  onClick={onToggle}
                />
              ) : null}
              <Button
                text={selected ? labels.changeRate : labels[room.actionLabelRef]}
                variant="solid"
                disabled={disabled}
                aria-haspopup={onOpenRates ? "dialog" : undefined}
                onClick={() => (onOpenRates ? onOpenRates() : onSelect?.(room))}
              />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`trem-hotel-room-card${selected || assignedSlots.length ? " trem-hotel-room-card--selected" : ""}${disabled ? " trem-hotel-room-card--disabled" : ""}${hasExpandedContent ? " trem-hotel-room-card--clickable" : ""} ${className}`}
      aria-disabled={disabled || undefined}
      onClick={openDetailsFromCard}
    >
      <div className="trem-hotel-room-card__media">
        <img src={room.image} alt={room.imageAlt || room.title} loading="lazy" />
        {room.imageCountLabel ? (
          <span className="trem-hotel-room-card__photo-count">
            <Icon name="camera" size={18} aria-hidden="true" />
            {room.imageCountLabel}
          </span>
        ) : null}
      </div>

      <div className="trem-hotel-room-card__content">
        {assignedSlots.length ? (
          <div className="trem-hotel-room-card__assignments" aria-label={labels.selectedRooms}>
            {assignedSlots.map(({ slot, rateLabel }) => (
              <span key={slot}>
                <Icon name="check" size={16} aria-hidden="true" />
                <strong>{slot}</strong>
                {rateLabel ? <span>{rateLabel}</span> : null}
              </span>
            ))}
          </div>
        ) : null}
        {room.badge?.value ? <StatusBadge {...room.badge} showDot={false} /> : null}
        <div className="trem-hotel-room-card__heading">
          <h3>{room.title}</h3>
          {room.meta ? <p>{room.meta}</p> : null}
        </div>

        {room.facilities?.length ? (
          <div className="trem-hotel-room-card__facilities">
            {room.facilities.slice(0, FACILITY_PREVIEW_COUNT).map((facility, index) => (
              <span key={`${facility.value}-${index}`}>
                <Icon name={facility.icon} size={18} aria-hidden="true" />
                {facility.value}
              </span>
            ))}
            {room.facilities.length > FACILITY_PREVIEW_COUNT ? (
              <span className="trem-hotel-room-card__facility-overflow">
                {labels.moreItems?.replace(
                  "{count}",
                  room.facilities.length - FACILITY_PREVIEW_COUNT,
                ) || `+${room.facilities.length - FACILITY_PREVIEW_COUNT}`}
              </span>
            ) : null}
          </div>
        ) : null}

        <dl className="trem-hotel-room-card__details">
          {room.detailFields?.map((field) => (
            <div key={field.id}>
              {field.icon ? (
                <span className="trem-hotel-room-card__detail-icon">
                  <Icon name={field.icon} size={21} aria-hidden="true" />
                </span>
              ) : null}
              <span>
                <dt>{labels[field.labelRef]}</dt>
                <dd>{field.value}</dd>
              </span>
            </div>
          ))}
        </dl>

        {room.priceFacts?.length ? (
          <ul className="trem-hotel-room-card__room-facts">
            {room.priceFacts.map((fact) => (
              <li key={fact.id}>
                {fact.icon ? <Icon name={fact.icon} size={17} aria-hidden="true" /> : null}
                <span>{labels[fact.labelRef]}</span>
                <strong>{fact.value}</strong>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <aside className="trem-hotel-room-card__price">
        <div className="trem-hotel-room-card__price-heading">
          <small>{labels.priceDetails}</small>
          {room.priceFields?.[0] ? <span>{labels[room.priceFields[0].labelRef]}</span> : null}
        </div>
        <dl>
          {room.priceFields?.map((field) => (
            <div
              key={field.id}
              className={field.id === "total" ? "trem-hotel-room-card__total" : ""}
            >
              <dt>
                {labels[field.labelRef]}
                {field.help ? (
                  <InfoTooltip label={`About ${labels[field.labelRef]}`} text={field.help} hide={field.id === "fee"} />
                ) : null}
              </dt>
              <dd>
                {field.value}
                {field.detail ? <small>{field.detail}</small> : null}
              </dd>
            </div>
          ))}
        </dl>
        <div className="trem-hotel-room-card__price-actions">
          <Button
            text={
              hasVariants && selected
                ? labels.changeRate
                : labels[selected ? room.selectedLabelRef : room.actionLabelRef]
            }
            variant={selected && !hasVariants ? "outline" : "solid"}
            iconLeft={selected && !hasVariants ? "check" : undefined}
            iconRight={hasVariants ? "chevronRight" : selected ? undefined : room.actionIcon}
            fullWidth
            disabled={disabled}
            aria-haspopup={hasVariants ? "dialog" : undefined}
            onClick={() => (hasVariants ? onOpenRates?.() : onSelect?.(room))}
          />
          {hasExpandedContent ? (
            <Button
              text={
                labels[renderExpandedDetails && expanded ? "hideRoomDetails" : "viewRoomDetails"]
              }
              variant="outline"
              iconLeft="camera"
              iconRight={renderExpandedDetails && expanded ? "x" : "chevronRight"}
              fullWidth
              disabled={disabled}
              aria-expanded={renderExpandedDetails ? expanded : undefined}
              aria-haspopup={renderExpandedDetails ? undefined : "dialog"}
              onClick={onToggle}
            />
          ) : null}
          {labels.secureBookingNote ? (
            <p className="trem-hotel-room-card__secure">
              <Icon name="lock" size={17} aria-hidden="true" />
              {labels.secureBookingNote}
            </p>
          ) : null}
        </div>
      </aside>

      {expanded && hasExpandedContent && renderExpandedDetails ? (
        <HotelRoomDetails room={room} labels={labels} inline />
      ) : null}
    </article>
  );
}

HotelRoomCard.propTypes = {
  variant: PropTypes.oneOf(["full", "preview"]),
  room: PropTypes.shape({
    id: PropTypes.string.isRequired,
    roomTypeId: PropTypes.string,
    rateLabel: PropTypes.string,
    rateSummary: PropTypes.string,
    title: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    imageAlt: PropTypes.string,
    imageCountLabel: PropTypes.string,
    meta: PropTypes.string,
    badge: PropTypes.object,
    facilities: PropTypes.arrayOf(PropTypes.object),
    detailFields: PropTypes.arrayOf(PropTypes.object),
    priceFields: PropTypes.arrayOf(PropTypes.object),
    priceFacts: PropTypes.arrayOf(PropTypes.object),
    expandedDetails: PropTypes.shape({
      titleRef: PropTypes.string,
      description: PropTypes.string,
      sections: PropTypes.arrayOf(PropTypes.object),
    }),
    images: PropTypes.arrayOf(PropTypes.string),
    galleryTitle: PropTypes.string,
    actionLabelRef: PropTypes.string,
    selectedLabelRef: PropTypes.string,
    actionIcon: PropTypes.string,
  }).isRequired,
  variants: PropTypes.arrayOf(PropTypes.object),
  assignedSlots: PropTypes.arrayOf(
    PropTypes.shape({
      slot: PropTypes.string.isRequired,
      roomId: PropTypes.string.isRequired,
      rateLabel: PropTypes.string,
    }),
  ),
  labels: PropTypes.object,
  selected: PropTypes.bool,
  expanded: PropTypes.bool,
  disabled: PropTypes.bool,
  onSelect: PropTypes.func,
  onOpenRates: PropTypes.func,
  onToggle: PropTypes.func,
  renderExpandedDetails: PropTypes.bool,
  className: PropTypes.string,
};

HotelRoomDetails.propTypes = {
  room: HotelRoomCard.propTypes.room,
  labels: PropTypes.object,
  inline: PropTypes.bool,
  className: PropTypes.string,
};
