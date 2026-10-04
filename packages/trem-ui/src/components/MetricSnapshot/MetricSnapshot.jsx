import React from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import DataTrendChart from "../DataTrendChart/DataTrendChart.jsx";
import "./MetricSnapshot.styles.scss";

export default function MetricSnapshot({ title, icon, periodLabel, items = [] }) {
  const visible = items.filter((item) => item.value != null && item.value !== "");
  if (!visible.length) return null;
  return <section className="trem-metric-snapshot" aria-label={title}>
    <header>{icon ? <Icon name={icon} size={20} /> : null}<h2>{title}</h2>
      {periodLabel ? <span>{periodLabel}</span> : null}
    </header>
    <div className="trem-metric-snapshot__grid">
      {visible.map((item) => <article key={item.id}>
        <h3>{item.label}</h3>
        <div className="trem-metric-snapshot__value"><strong>{item.value}</strong>
          {item.change?.label ? <span className={`trem-metric-snapshot__change is-${item.change.tone || "neutral"}`}>{item.change.label}</span> : null}
        </div>
        {item.series?.some((series) => series.values?.length) ? <DataTrendChart variant="sparkline" series={item.series} ariaLabel={item.chartLabel || `${item.label} trend`} /> : null}
      </article>)}
    </div>
  </section>;
}
