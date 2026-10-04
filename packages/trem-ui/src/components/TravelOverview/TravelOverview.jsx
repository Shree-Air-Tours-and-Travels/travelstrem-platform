import React from "react";
import Button from "../Button/Button.jsx";
import SingleSelect from "../SingleSelect/SingleSelect.jsx";
import MetricSummary from "../MetricSummary/MetricSummary.jsx";
import DashboardPanel from "../DashboardPanel/DashboardPanel.jsx";
import DataTrendChart from "../DataTrendChart/DataTrendChart.jsx";
import DonutChart from "../DonutChart/DonutChart.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./TravelOverview.styles.scss";

export function TravelOverview({ data, period, onPeriodChange, onRefresh, renderWidget }) {
  return (
    <div className="trem-travel-overview">
      <section className="trem-travel-overview__welcome" aria-label={data.greeting}>
        <div className="trem-travel-overview__welcome-copy">
          <span className="trem-travel-overview__eyebrow">{data.eyebrow}</span>
          <h2>{data.greeting}</h2>
          <p>{data.description}</p>
          <span className="trem-travel-overview__tenant">
            <Icon name="compass" size={15} />
            {data.tenantLabel}
          </span>
        </div>
        <div className="trem-travel-overview__controls">
          {data.widgets.some((widget) => widget.id === "analytics") && (
            <SingleSelect
              label={data.period.label}
              value={period}
              options={data.period.options}
              onChange={onPeriodChange}
            />
          )}
          <Button
            text={data.refreshLabel}
            variant="outline"
            size="small"
            iconLeft="refreshCw"
            onClick={onRefresh}
          />
        </div>
      </section>
      <div className="trem-travel-overview__grid">
        {data.widgets.map((widget) => (
          <div
            key={widget.id}
            className={`trem-travel-overview__slot${widget.layout === "full" ? " is-full" : ""}`}
          >
            {renderWidget(widget)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TravelOverviewWidget({ data, onNavigate }) {
  if (data.kind === "analytics")
    return (
      <div className="trem-travel-overview__analytics">
        <MetricSummary variant="cards" ariaLabel={data.title} items={data.metrics} />
        <div className="trem-travel-overview__charts">
          <div className="trem-travel-overview__financials">
            {data.finances.length ? (
              data.finances.map((chart) => (
                <section key={chart.id} className="trem-travel-overview__card">
                  <header>
                    <div>
                      <span className="trem-travel-overview__eyebrow">{chart.title}</span>
                      <h2 className="trem-travel-overview__amount">{chart.value}</h2>
                    </div>
                    <span className="trem-travel-overview__period">{data.periodLabel}</span>
                  </header>
                  <DataTrendChart
                    variant="bar"
                    labels={chart.labels}
                    series={chart.series}
                    ariaLabel={`${chart.title}: ${chart.labels.map((label, index) => `${label} ${chart.series[0].values[index]}`).join(", ")}`}
                  />
                  <p className="trem-travel-overview__footnote">{chart.description}</p>
                </section>
              ))
            ) : (
              <section className="trem-travel-overview__card trem-travel-overview__empty-chart">
                <Icon name="wallet" size={32} />
                <h2>{data.emptyFinance.title}</h2>
                <p>{data.emptyFinance.description}</p>
              </section>
            )}
          </div>
          <section className="trem-travel-overview__card">
            <header>
              <div>
                <h2>{data.distribution.title}</h2>
                <p>{data.distribution.description}</p>
              </div>
            </header>
            <DonutChart {...data.distribution} onNavigate={onNavigate} />
          </section>
        </div>
        {data.note && <p className="trem-travel-overview__footnote">{data.note}</p>}
      </div>
    );
  if (data.kind === "services")
    return (
      <section className="trem-travel-overview__services" aria-label={data.title}>
        <header>
          <h2>{data.title}</h2>
          <p>{data.description}</p>
        </header>
        <div className="trem-travel-overview__service-grid">
          {data.items.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`trem-travel-overview__service is-${item.tone}`}
              onClick={() => onNavigate(item.href)}
            >
              <span className="trem-travel-overview__service-icon">
                <Icon name={item.icon} size={24} />
              </span>
              <strong>{item.label}</strong>
              <span>
                {item.value} {item.helper}
              </span>
              <small>
                {item.actionLabel}
                <Icon name="arrowUpRight" size={16} />
              </small>
            </button>
          ))}
        </div>
      </section>
    );
  return (
    <DashboardPanel
      {...data}
      action={
        data.action
          ? { label: data.action.label, onClick: () => onNavigate(data.action.href) }
          : undefined
      }
      onItemClick={onNavigate}
    />
  );
}
