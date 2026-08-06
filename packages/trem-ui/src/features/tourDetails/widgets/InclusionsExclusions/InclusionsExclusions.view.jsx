import React from "react";
import { Title, Icon } from "../../../../index.js";
import "./InclusionsExclusions.styles.scss";

function InclusionsColumn({ title, emptyText, items, theme }) {
  const hasItems = Array.isArray(items) && items.length > 0;

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
            {items.map((item, i) => (
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
    </section>
  );
}

export default function InclusionsExclusionsView({ labels, inclusions, exclusions }) {
  return (
    <div className="td-ie" aria-label={labels.ariaLabel || "What's included and what's not"}>
      <InclusionsColumn
        title={labels.inclusions || "Inclusions"}
        emptyText={labels.inclusionsEmpty || "Inclusions will be confirmed before booking."}
        items={inclusions}
        theme="included"
      />
      <InclusionsColumn
        title={labels.exclusions || "Exclusions"}
        emptyText={labels.exclusionsEmpty || "Exclusions will be confirmed before booking."}
        items={exclusions}
        theme="excluded"
      />
    </div>
  );
}
