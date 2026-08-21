import React from "react";
import PropTypes from "prop-types";
import "./CardWithSubEntity.styles.scss";

const renderAction = (action, index) => {
  if (!action) return null;
  if (React.isValidElement(action)) return action;
  const Tag = action.href ? "a" : "button";
  return (
    <Tag
      key={action.id || action.label || index}
      className={`card-subentity__action ${action.variant ? `card-subentity__action--${action.variant}` : ""}`}
      href={action.href}
      type={Tag === "button" ? "button" : undefined}
      disabled={action.disabled}
      onClick={action.onClick}
    >
      {action.label}
    </Tag>
  );
};

const ValueRow = ({ item }) => (
  <div className={`card-subentity__row ${item.tone ? `card-subentity__row--${item.tone}` : ""}`}>
    <span className="card-subentity__row-label">{item.label}</span>
    <span className="card-subentity__row-value">{item.value}</span>
  </div>
);

export default function CardWithSubEntity({
  title,
  subtitle = "",
  eyebrow = "",
  badge = "",
  headerMeta = "",
  headerActions = [],
  items = [],
  sections = [],
  totals = [],
  text = "",
  footerActions = [],
  status = null,
  className = "",
}) {
  const visibleItems = items.filter(Boolean);
  const visibleSections = sections.filter((section) => section?.items?.length || section?.text);
  const visibleTotals = totals.filter(Boolean);

  return (
    <article className={`card-subentity ${className}`}>
      <header className="card-subentity__header">
        <div className="card-subentity__title-group">
          {eyebrow ? <span className="card-subentity__eyebrow">{eyebrow}</span> : null}
          <div className="card-subentity__title-line">
            <h3>{title}</h3>
            {badge ? <span className="card-subentity__badge">{badge}</span> : null}
          </div>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="card-subentity__header-side">
          {headerMeta ? <span>{headerMeta}</span> : null}
          {headerActions.length ? <div className="card-subentity__actions">{headerActions.map(renderAction)}</div> : null}
        </div>
      </header>

      {visibleItems.length ? (
        <div className="card-subentity__rows">
          {visibleItems.map((item) => <ValueRow key={item.id || item.label} item={item} />)}
        </div>
      ) : null}

      {visibleSections.map((section) => (
        <section className="card-subentity__section" key={section.id || section.title}>
          {section.title ? <h4>{section.title}</h4> : null}
          {section.text ? <p>{section.text}</p> : null}
          {section.items?.length ? (
            <div className="card-subentity__rows">
              {section.items.map((item) => <ValueRow key={item.id || item.label} item={item} />)}
            </div>
          ) : null}
        </section>
      ))}

      {visibleTotals.length ? (
        <div className="card-subentity__totals">
          {visibleTotals.map((item) => <ValueRow key={item.id || item.label} item={item} />)}
        </div>
      ) : null}

      {text ? <p className="card-subentity__text">{text}</p> : null}

      {footerActions.length || status ? (
        <footer className="card-subentity__footer">
          {status ? <div className={`card-subentity__status ${status.tone ? `card-subentity__status--${status.tone}` : ""}`}>{status.label}</div> : null}
          {footerActions.length ? <div className="card-subentity__footer-actions">{footerActions.map(renderAction)}</div> : null}
        </footer>
      ) : null}
    </article>
  );
}

const valueItemShape = PropTypes.shape({
  id: PropTypes.string,
  label: PropTypes.node.isRequired,
  value: PropTypes.node.isRequired,
  tone: PropTypes.string,
});

CardWithSubEntity.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  eyebrow: PropTypes.node,
  badge: PropTypes.node,
  headerMeta: PropTypes.node,
  headerActions: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.node, PropTypes.object])),
  items: PropTypes.arrayOf(valueItemShape),
  sections: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.node,
    text: PropTypes.node,
    items: PropTypes.arrayOf(valueItemShape),
  })),
  totals: PropTypes.arrayOf(valueItemShape),
  text: PropTypes.node,
  footerActions: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.node, PropTypes.object])),
  status: PropTypes.shape({
    label: PropTypes.node.isRequired,
    tone: PropTypes.string,
  }),
  className: PropTypes.string,
};
