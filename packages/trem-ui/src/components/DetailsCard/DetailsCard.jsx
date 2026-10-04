import React, { useId } from "react";
import "./DetailsCard.scss";

export default function DetailsCard({ title, description, actions, rows = [], children, className = "", headerClassName = "" }) {
  const headingId = useId();
  return <section className={`trem-details-card ${className}`} aria-labelledby={headingId}>
    <header className={`trem-details-card__header ${headerClassName}`}>
      <div><h2 id={headingId}>{title}</h2>{description && <p>{description}</p>}</div>
      {actions && <div className="trem-details-card__actions">{actions}</div>}
    </header>
    {!!rows.length && <dl className="trem-details-card__rows">{rows.map((row, index) => <div key={row.id || index}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>}
    {children && <div className="trem-details-card__body">{children}</div>}
  </section>;
}
