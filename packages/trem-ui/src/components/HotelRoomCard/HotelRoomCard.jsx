import React from "react";
import PropTypes from "prop-types";
import Button from "../Button/Button.jsx";
import Gallery from "../Gallery/Gallery.jsx";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./HotelRoomCard.styles.scss";

export default function HotelRoomCard({
  room,
  labels = {},
  selected = false,
  expanded = false,
  disabled = false,
  onSelect,
  onToggle,
  className = "",
}) {
  return (
    <article
      className={`trem-hotel-room-card${selected ? " trem-hotel-room-card--selected" : ""}${disabled ? " trem-hotel-room-card--disabled" : ""} ${className}`}
      aria-disabled={disabled || undefined}
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
        {room.badge?.value ? <StatusBadge {...room.badge} showDot={false} /> : null}
        <div className="trem-hotel-room-card__heading">
          <h3>{room.title}</h3>
          {room.meta ? <p>{room.meta}</p> : null}
        </div>

        {room.facilities?.length ? (
          <div className="trem-hotel-room-card__facilities">
            {room.facilities.map((facility) => (
              <span key={facility.value}>
                <Icon name={facility.icon} size={18} aria-hidden="true" />
                {facility.value}
              </span>
            ))}
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

        {room.images?.length ? (
          <Button
            text={labels[expanded ? "hideRoomDetails" : "viewRoomDetails"]}
            variant="outline"
            iconLeft="camera"
            iconRight={expanded ? "x" : "chevronDown"}
            disabled={disabled}
            aria-expanded={expanded}
            onClick={onToggle}
          />
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
              <dt>{labels[field.labelRef]}</dt>
              <dd>
                {field.value}
                {field.detail ? <small>{field.detail}</small> : null}
              </dd>
            </div>
          ))}
        </dl>
        <Button
          text={labels[selected ? room.selectedLabelRef : room.actionLabelRef]}
          variant={selected ? "outline" : "solid"}
          iconLeft={selected ? "check" : undefined}
          iconRight={selected ? undefined : room.actionIcon}
          fullWidth
          disabled={disabled}
          onClick={() => onSelect?.(room)}
        />
        {labels.secureBookingNote ? (
          <p className="trem-hotel-room-card__secure">
            <Icon name="lock" size={17} aria-hidden="true" />
            {labels.secureBookingNote}
          </p>
        ) : null}
      </aside>

      {expanded && room.images?.length ? (
        <div className="trem-hotel-room-card__gallery">
          <Gallery
            images={room.images}
            title={room.galleryTitle}
            subtitle={room.meta}
            labels={labels}
            aspectRatio="16 / 7"
          />
        </div>
      ) : null}
    </article>
  );
}

HotelRoomCard.propTypes = {
  room: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    imageAlt: PropTypes.string,
    imageCountLabel: PropTypes.string,
    meta: PropTypes.string,
    badge: PropTypes.object,
    facilities: PropTypes.arrayOf(PropTypes.object),
    detailFields: PropTypes.arrayOf(PropTypes.object),
    priceFields: PropTypes.arrayOf(PropTypes.object),
    images: PropTypes.arrayOf(PropTypes.string),
    galleryTitle: PropTypes.string,
    actionLabelRef: PropTypes.string,
    selectedLabelRef: PropTypes.string,
    actionIcon: PropTypes.string,
  }).isRequired,
  labels: PropTypes.object,
  selected: PropTypes.bool,
  expanded: PropTypes.bool,
  disabled: PropTypes.bool,
  onSelect: PropTypes.func,
  onToggle: PropTypes.func,
  className: PropTypes.string,
};
