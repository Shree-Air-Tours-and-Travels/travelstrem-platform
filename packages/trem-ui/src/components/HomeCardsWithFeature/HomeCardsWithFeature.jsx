import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import NoDataFound from "../NoDataFound/NoDataFound.jsx";
import QuickChips from "../QuickChips/QuickChips.jsx";
import "./HomeCardsWithFeature.styles.scss";

export default function HomeCardsWithFeature({ data, className = "" }) {
  const categories = useMemo(
    () => (Array.isArray(data?.categories) ? data.categories.filter((item) => item?.id) : []),
    [data?.categories],
  );
  const initialCategory = data?.defaultCategory || categories[0]?.id || "";
  const [activeId, setActiveId] = useState(initialCategory);

  useEffect(() => {
    if (!categories.some((category) => category.id === activeId)) {
      setActiveId(initialCategory);
    }
  }, [activeId, categories, initialCategory]);

  const activeCategory =
    categories.find((category) => category.id === activeId) || categories[0];
  const items = Array.isArray(activeCategory?.items) ? activeCategory.items.slice(0, 4) : [];

  if (!activeCategory) return null;

  return (
    <section
      className={["trem-home-features", className].filter(Boolean).join(" ")}
      aria-label={data?.ariaLabel || data?.title}
    >
      <div className="trem-home-features__ambient" aria-hidden="true" />
      <header className="trem-home-features__header">
        <div className="trem-home-features__heading">
          {data?.eyebrow ? <span>{data.eyebrow}</span> : null}
          {data?.title ? <h2>{data.title}</h2> : null}
          {data?.description ? <p>{data.description}</p> : null}
        </div>
        <a className="trem-home-features__view-all" href={activeCategory.viewAllHref}>
          <span>{activeCategory.viewAllLabel}</span>
          <Icon name="arrowUpRight" size={17} />
        </a>
      </header>

      <QuickChips
        className="trem-home-features__chips"
        filters={categories.map(({ id, label }) => ({ id, label }))}
        activeId={activeCategory.id}
        onClick={setActiveId}
      />

      {items.length ? (
        <div className="trem-home-features__grid" key={activeCategory.id}>
          {items.map((item, index) => (
            <article
              className="trem-home-feature-card"
              key={item.id || item.title}
              style={{ "--feature-index": index }}
            >
              <div className="trem-home-feature-card__media">
                {item.image ? (
                  <img src={item.image} alt={item.imageAlt || ""} loading="lazy" />
                ) : (
                  <span className="trem-home-feature-card__visual" aria-hidden="true">
                    <Icon name={item.visualIcon || "mapPin"} size={54} />
                    {item.code ? <strong>{item.code}</strong> : null}
                  </span>
                )}
                {item.badge ? (
                  <span className="trem-home-feature-card__badge">{item.badge}</span>
                ) : null}
              </div>
              <div className="trem-home-feature-card__content">
                <h3>{item.title}</h3>
                {item.description ? <p>{item.description}</p> : null}
                {item.meta?.length ? (
                  <div className="trem-home-feature-card__meta">
                    {item.meta.map((meta, metaIndex) => (
                      <span key={`${meta.label}-${metaIndex}`}>
                        {meta.icon ? <Icon name={meta.icon} size={14} /> : null}
                        {meta.label}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="trem-home-feature-card__footer">
                  <span className="trem-home-feature-card__price">
                    {item.priceLabel && item.price ? <small>{item.priceLabel}</small> : null}
                    {item.price ? <strong>{item.price}</strong> : null}
                  </span>
                  <a href={item.href} aria-label={`${item.actionLabel}: ${item.title}`}>
                    {item.actionLabel}
                    <Icon name="arrowUpRight" size={16} />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <NoDataFound
          {...activeCategory.emptyState}
          className="trem-home-features__empty"
        />
      )}
    </section>
  );
}

HomeCardsWithFeature.propTypes = {
  data: PropTypes.shape({
    ariaLabel: PropTypes.string,
    eyebrow: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    defaultCategory: PropTypes.string,
    categories: PropTypes.arrayOf(PropTypes.object),
  }),
  className: PropTypes.string,
};

HomeCardsWithFeature.defaultProps = {
  data: null,
  className: "",
};
