import React from "react";
import PropTypes from "prop-types";
import "./DataTrendChart.styles.scss";

const WIDTH = 640;
const HEIGHT = 240;
const LEFT = 38;
const RIGHT = 12;
const TOP = 12;
const BOTTOM = 30;

export default function DataTrendChart({ series = [], labels = [], variant = "default", ariaLabel = "Trend chart", emptyLabel = "No trend data yet" }) {
  const visible = series.filter((item) => Array.isArray(item.values) && item.values.length);
  const count = Math.max(labels.length, ...visible.map((item) => item.values.length), 0);
  if (!visible.length || !count) return <div className="trem-data-trend-chart__empty">{emptyLabel}</div>;

  const maximum = Math.max(1, ...visible.flatMap((item) => item.values.map((value) => Math.max(0, Number(value) || 0))));
  const plotWidth = WIDTH - LEFT - RIGHT;
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const x = (index) => LEFT + (count === 1 ? plotWidth / 2 : (index / (count - 1)) * plotWidth);
  const y = (value) => TOP + plotHeight - ((Math.max(0, Number(value) || 0) / maximum) * plotHeight);
  const labelStep = Math.max(1, Math.ceil(count / 5));

  if (variant === "sparkline") return (
    <div className="trem-data-trend-chart" role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
        {visible.map((item) => {
          const points = item.values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
          return <g key={item.id}>
            <polygon className={`trem-data-trend-chart__line is-${item.tone || "primary"}`} style={{ fill: "var(--trend-color, var(--color-primary))", fillOpacity: 0.1, stroke: "none" }} points={`${x(0)},${HEIGHT - BOTTOM} ${points} ${x(item.values.length - 1)},${HEIGHT - BOTTOM}`} />
            <polyline className={`trem-data-trend-chart__line is-${item.tone || "primary"}`} points={points} />
          </g>;
        })}
      </svg>
    </div>
  );

  return (
    <div className="trem-data-trend-chart" role="img" aria-label={ariaLabel}>
      <div className="trem-data-trend-chart__legend" aria-hidden="true">
        {visible.map((item) => <span key={item.id} className={`trem-data-trend-chart__legend-item is-${item.tone || "primary"}`}><i />{item.label}</span>)}
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((step) => {
          const gridY = TOP + ((plotHeight / 4) * step);
          return <g key={step}><line className="trem-data-trend-chart__grid" x1={LEFT} x2={WIDTH - RIGHT} y1={gridY} y2={gridY} /><text x={LEFT - 8} y={gridY + 4} textAnchor="end">{Math.round(maximum * (1 - step / 4))}</text></g>;
        })}
        {visible.map((item) => (
          <polyline
            key={item.id}
            className={`trem-data-trend-chart__line is-${item.tone || "primary"}`}
            points={item.values.map((value, index) => `${x(index)},${y(value)}`).join(" ")}
          />
        ))}
        {labels.map((label, index) => index % labelStep === 0 || index === labels.length - 1 ? <text key={`${label}-${index}`} x={x(index)} y={HEIGHT - 6} textAnchor="middle">{label}</text> : null)}
      </svg>
    </div>
  );
}

DataTrendChart.propTypes = {
  series: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired, tone: PropTypes.string, values: PropTypes.arrayOf(PropTypes.number).isRequired })),
  variant: PropTypes.oneOf(["default", "sparkline"]),
  labels: PropTypes.arrayOf(PropTypes.string),
  ariaLabel: PropTypes.string,
  emptyLabel: PropTypes.string,
};
