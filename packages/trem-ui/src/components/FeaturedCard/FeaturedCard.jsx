import React from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import "./FeaturedCard.styles.scss";

const formatMoney = (value, currency = "INR", locale = "en-IN") => {
  if (value === undefined || value === null || value === "") return "";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  } catch {
    return `${currency} ${Number(value || 0).toLocaleString(locale)}`;
  }
};

const normalizeMeta = (metaItems = []) =>
  Array.isArray(metaItems) ? metaItems.filter((item) => item?.label || item?.value) : [];

const CardAction = ({ href, label, onClick }) => {
  if (!label) return null;
  if (href) {
    return (
      <a className="trem-featured-card__cta" href={href} onClick={onClick}>
        {label}
      </a>
    );
  }

  return (
    <button className="trem-featured-card__cta" type="button" onClick={onClick}>
      {label}
    </button>
  );
};

CardAction.propTypes = {
  href: PropTypes.string,
  label: PropTypes.string,
  onClick: PropTypes.func,
};

CardAction.defaultProps = {
  href: "",
  label: "",
  onClick: undefined,
};

export default function FeaturedCard({
  image,
  title,
  metaItems,
  price,
  currency,
  priceLabel,
  ctaLabel,
  ctaHref,
  onCtaClick,
  overlay,
  className,
}) {
  const meta = normalizeMeta(metaItems);
  const priceText = formatMoney(price, currency);

  return (
    <article className={`trem-featured-card ${className}`.trim()}>
      <div
        className="trem-featured-card__media"
        style={image ? { backgroundImage: `${overlay}, url("${image}")` } : undefined}
      >
        <div className="trem-featured-card__panel">
          <div className="trem-featured-card__copy">
            <h3>{title}</h3>
            {meta.length ? (
              <div className="trem-featured-card__meta" aria-label="Featured trip details">
                {meta.map((item, index) => (
                  <React.Fragment key={`${item.label || item.value}-${index}`}>
                    {index > 0 ? (
                      <span className="trem-featured-card__separator" aria-hidden="true">
                        ·
                      </span>
                    ) : null}
                    <span className="trem-featured-card__meta-item">
                      {item.icon ? <Icon name={item.icon} size={14} /> : null}
                      <span>{item.label || item.value}</span>
                    </span>
                  </React.Fragment>
                ))}
              </div>
            ) : null}
          </div>

          <div className="trem-featured-card__footer">
            <div className="trem-featured-card__price">
              {priceLabel ? <small>{priceLabel}</small> : null}
              {priceText ? <strong>{priceText}</strong> : null}
            </div>
            <CardAction href={ctaHref} label={ctaLabel} onClick={onCtaClick} />
          </div>
        </div>
      </div>
    </article>
  );
}

FeaturedCard.propTypes = {
  image: PropTypes.string,
  title: PropTypes.string,
  metaItems: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.string,
      label: PropTypes.string,
      value: PropTypes.string,
    }),
  ),
  price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  currency: PropTypes.string,
  priceLabel: PropTypes.string,
  ctaLabel: PropTypes.string,
  ctaHref: PropTypes.string,
  onCtaClick: PropTypes.func,
  overlay: PropTypes.string,
  className: PropTypes.string,
};

FeaturedCard.defaultProps = {
  image: "",
  title: "Featured experience",
  metaItems: [],
  price: "",
  currency: "INR",
  priceLabel: "",
  ctaLabel: "",
  ctaHref: "",
  onCtaClick: undefined,
  overlay: "linear-gradient(180deg, var(--color-transparent), var(--overlay-strong))",
  className: "",
};
