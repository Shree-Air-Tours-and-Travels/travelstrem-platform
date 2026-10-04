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
  actionIcon = "chevronRight",
  onClick,
  onSubtitleClick,
  onActionClick,
  className = "",
}) {
  const hasNestedAction = Boolean(onSubtitleClick || onActionClick);
  const cardClickable = Boolean(onClick && !hasNestedAction);
  const Tag = cardClickable ? "button" : "article";
  const badgeTone = badge?.tone
    ? INFO_CARD_TONES[badge.tone.toLowerCase()] || badge.tone
    : undefined;

  return (
    <Tag
      className={`trem-info-card${cardClickable ? " trem-info-card--clickable" : ""}${className ? ` ${className}` : ""}`}
      type={cardClickable ? "button" : undefined}
      onClick={cardClickable ? onClick : undefined}
    >
      <span
        className={`trem-info-card__header${image ? " trem-info-card__header--with-image" : ""}`}
      >
        {image ? <img src={image} alt={imageAlt} loading="lazy" /> : null}
        <span className="trem-info-card__identity">
          <strong>{title}</strong>
          {subtitle ? (
            onSubtitleClick ? (
              <button
                type="button"
                className="trem-info-card__subtitle-action"
                onClick={onSubtitleClick}
              >
                {subtitle}
              </button>
            ) : (
              <small>{subtitle}</small>
            )
          ) : null}
        </span>
        {badge?.value ? <StatusBadge value={badge.value} tone={badgeTone} size="sm" /> : null}
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
        cardClickable ? (
          <span className="trem-info-card__action">
            {actionLabel}
            <Icon name={actionIcon} size={18} aria-hidden="true" />
          </span>
        ) : (
          <button
            type="button"
            className="trem-info-card__action"
            onClick={onActionClick}
            disabled={!onActionClick}
          >
            {actionLabel}
            <Icon name={actionIcon} size={18} aria-hidden="true" />
          </button>
        )
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
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.node,
      value: PropTypes.node,
    }),
  ),
  actionLabel: PropTypes.string,
  actionIcon: PropTypes.string,
  onClick: PropTypes.func,
  onSubtitleClick: PropTypes.func,
  onActionClick: PropTypes.func,
  className: PropTypes.string,
};
