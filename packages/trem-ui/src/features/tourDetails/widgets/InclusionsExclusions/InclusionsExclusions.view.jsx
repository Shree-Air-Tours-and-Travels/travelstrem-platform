import React, { useState } from "react";
import Title from "../../../../components/Title/Title.jsx";
import Icon from "../../../../icons/Icon/Icon.jsx";
import Button from "../../../../components/Button/Button.jsx";
import "./InclusionsExclusions.styles.scss";

function formatCountLabel(template, count) {
  return String(template || "").replace("{count}", String(count));
}

function InclusionsColumn({
  title,
  emptyText,
  items,
  theme,
  labels,
  config,
}) {
  const hasItems = Array.isArray(items) && items.length > 0;
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > config.initialVisibleCount;
  const visibleItems = expanded ? items : items.slice(0, config.initialVisibleCount);
  const hiddenItemCount = Math.max(0, items.length - visibleItems.length);

  return (
    <section className={`td-ie__card td-ie__card--${theme}${hasItems ? "" : " is-empty"}`}>
      <div className="td-ie__glow" aria-hidden="true" />
      <header className="td-ie__header">
        <span className="td-ie__badge">
          <Icon name={theme === "included" ? "check" : "x"} size={16} />
        </span>
        <Title text={title} primaryClassname="td-ie__title" />
        {hasItems && <span className="td-ie__count">{items.length}</span>}
      </header>

      <div className="td-ie__body">
        {hasItems ? (
          <ul className="td-ie__list">
            {visibleItems.map((item, i) => (
              <li key={i} className="td-ie__item">
                <span className="td-ie__mark">
                  <Icon name={theme === "included" ? "check" : "x"} size={11} />
                </span>
                <span className="td-ie__item-text">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="td-ie__empty">{emptyText}</p>
        )}
      </div>
      {hasMore ? (
        <Button
          primaryClassName="td-ie__toggle"
          variant="text"
          color="primary"
          size="small"
          text={
            expanded
              ? labels.showLess
              : formatCountLabel(labels.moreItems, hiddenItemCount)
          }
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
        />
      ) : null}
    </section>
  );
}

export default function InclusionsExclusionsView({ labels, inclusions, exclusions, config }) {
  return (
    <section className="td-ie-widget" aria-label={labels.ariaLabel}>
      <header className="td-ie-widget__header">
        <div>
          <span className="td-ie-widget__eyebrow">{labels.eyebrow || "Package details"}</span>
          <h2 className="td-ie-widget__title">{labels.title || "What’s included"}</h2>
        </div>
        <p className="td-ie-widget__summary">
          {inclusions.length} {labels.includedCount || "included"} · {exclusions.length}{" "}
          {labels.excludedCount || "not included"}
        </p>
      </header>
      <div className="td-ie">
        <InclusionsColumn
          title={labels.inclusions}
          emptyText={labels.inclusionsEmpty}
          items={inclusions}
          theme="included"
          labels={labels}
          config={config}
        />
        <InclusionsColumn
          title={labels.exclusions}
          emptyText={labels.exclusionsEmpty}
          items={exclusions}
          theme="excluded"
          labels={labels}
          config={config}
        />
      </div>
    </section>
  );
}
