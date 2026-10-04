import React from "react";
import "./DonutChart.styles.scss";

export default function DonutChart({
  items = [],
  total,
  totalLabel,
  emptyLabel,
  title,
  onNavigate,
}) {
  let offset = 0;
  return (
    <div className="trem-donut-chart">
      <div
        className="trem-donut-chart__visual"
        role="img"
        aria-label={`${title}: ${items.map((item) => `${item.label} ${item.value}`).join(", ")}`}
      >
        <svg viewBox="0 0 220 220" aria-hidden="true">
          <circle className="trem-donut-chart__track" cx="110" cy="110" r="84" />
          {items.map((item) => {
            const start = offset;
            offset += item.share || 0;
            return item.share > 0 ? (
              <circle
                key={item.id}
                className={`trem-donut-chart__segment is-${item.tone || "primary"}`}
                cx="110"
                cy="110"
                r="84"
                pathLength="100"
                strokeDasharray={`${Math.max(0, item.share - (items.filter((entry) => entry.share > 0).length > 1 ? 1 : 0))} 100`}
                strokeDashoffset={-start}
                transform="rotate(-90 110 110)"
              >
                <title>
                  {item.label}: {item.value}
                </title>
              </circle>
            ) : null;
          })}
        </svg>
        <div className="trem-donut-chart__total">
          <strong>{total}</strong>
          <span>{totalLabel}</span>
        </div>
      </div>
      {!total && <p className="trem-donut-chart__empty">{emptyLabel}</p>}
      <ul className="trem-donut-chart__legend">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`is-${item.tone || "primary"}`}
              onClick={() => onNavigate?.(item.href)}
              disabled={!item.href || !onNavigate}
            >
              <i aria-hidden="true" />
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
