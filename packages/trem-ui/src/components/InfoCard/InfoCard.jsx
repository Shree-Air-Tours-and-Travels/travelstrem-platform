import React from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import "./InfoCard.styles.scss";

const INFO_CARD_TONES = {
  upcoming: "success",
  confirmed: "success",
  pending: "warning",
  cancelled: "danger",
  canceled: "danger",
  completed: "info",
  draft: "neutral",
  new: "info",
  sent: "info",
  ready: "info",
};

export default function InfoCard({
  title,
  subtitle = "",
  image = "",
  imageAlt = "",
  badge = null,
  fields = [],
  actionLabel = "",
  onClick,
  className = "",
}) {
  const Tag = onClick ? "button" : "article";
  const badgeTone = badge?.tone ? (INFO_CARD_TONES[badge.tone.toLowerCase()] || badge.tone) : undefined;

  return (
    <Tag
      className={`trem-info-card${onClick ? " trem-info-card--clickable" : ""}${className ? ` ${className}` : ""}`}
      type={onClick ? "button" : undefined}
      onClick={onClick}
    >
      <span className={`trem-info-card__header${image ? " trem-info-card__header--with-image" : ""}`}>
        {image ? <img src={image} alt={imageAlt} loading="lazy" /> : null}
        <span className="trem-info-card__identity">
          <strong>{title}</strong>
          {subtitle ? <small>{subtitle}</small> : null}
        </span>
        {badge?.value ? (
          <StatusBadge value={badge.value} tone={badgeTone} size="sm" />
        ) : null}
      </span>
      <span className="trem-info-card__fields">
        {fields.map((field) => (
          <span className="trem-info-card__field" key={field.id}>
            <small>{field.label}</small>
            <strong>{field.value || "—"}</strong>
          </span>
        ))}
      </span>
      {actionLabel ? (
        <span className="trem-info-card__action">
          {actionLabel}
          <Icon name="chevronRight" size={18} aria-hidden="true" />
        </span>
      ) : null}
    </Tag>
  );
}

InfoCard.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  image: PropTypes.string,
  imageAlt: PropTypes.string,
  badge: PropTypes.shape({
    value: PropTypes.node,
    tone: PropTypes.string,
  }),
  fields: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.node,
    value: PropTypes.node,
  })),
  actionLabel: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string,
};
