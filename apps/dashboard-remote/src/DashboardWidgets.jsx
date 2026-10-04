import React from "react";
import { Button, DataTrendChart, Icon, MetricSummary, NoDataFound, ProgressMeter, StatusBadge } from "@packages/trem-ui";
import "./DashboardWidgets.scss";

function WidgetHeading({ icon, title, description, action }) {
  return (
    <header className="dashboard-widget__heading">
      {icon ? <span className="dashboard-widget__heading-icon" aria-hidden="true"><Icon name={icon} size={20} /></span> : null}
      <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
      {action?.label && action.onClick ? <Button text={action.label} variant="outline" size="small" onClick={action.onClick} /> : null}
      {action?.label && !action.onClick ? <span className="dashboard-widget__period">{action.label}</span> : null}
    </header>
  );
}

export function ProgressWidget({ title, description, icon = "management", metrics = [], chart, progress, action }) {
  if (!metrics.length && !chart && !progress?.items?.length) return null;
  return (
    <section className="dashboard-widget dashboard-widget--progress" aria-label={title}>
      <WidgetHeading icon={icon} title={title} description={description} action={action} />
      {metrics.length ? <MetricSummary variant="cards" ariaLabel={`${title} summary`} items={metrics} /> : null}
      {chart || progress?.items?.length ? <div className={`dashboard-widget__progress-body${chart && progress?.items?.length ? "" : " is-single"}`}>
        {chart ? (
          <div className="dashboard-widget__subpanel dashboard-widget__chart">
            <h3>{chart.title}</h3>
            <DataTrendChart labels={chart.labels} series={chart.series} ariaLabel={chart.ariaLabel || chart.title} emptyLabel={chart.emptyLabel} />
          </div>
        ) : null}
        {progress?.items?.length ? (
          <div className="dashboard-widget__subpanel dashboard-widget__funnel">
            <h3>{progress.title}</h3>
            <div className="dashboard-widget__meters">
              {progress.items.map((item) => <ProgressMeter key={item.id} {...item} />)}
            </div>
          </div>
        ) : null}
      </div> : null}
    </section>
  );
}

function Cell({ value, primary = false }) {
  if (value == null) return null;
  if (typeof value !== "object" || React.isValidElement(value)) return <>{value}</>;
  if (value.status) return <StatusBadge value={value.status} size="sm" />;
  return <span className={primary ? "dashboard-widget__primary-cell" : "dashboard-widget__cell"}>
    <span>{value.text}</span>
    {value.detail ? <small>{value.detail}</small> : null}
  </span>;
}

export function ListingWidget({ title, description, icon = "management", columns = [], rows = [], action, onRowClick, emptyLabel = "No items to show" }) {
  if (!columns.length) return null;
  return (
    <section className="dashboard-widget dashboard-widget--listing" aria-label={title}>
      <WidgetHeading icon={icon} title={title} description={description} action={action} />
      {rows.length ? (
        <div className="dashboard-widget__table-scroll">
          <table>
            <thead><tr>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id}>{columns.map((column, index) => (
              <td key={column.key}>
                {index === 0 && onRowClick && row.target ? (
                  <button type="button" onClick={() => onRowClick(row.target, row)}><Cell value={row.cells?.[column.key]} primary /></button>
                ) : <Cell value={row.cells?.[column.key]} primary={index === 0} />}
              </td>
            ))}</tr>)}</tbody>
          </table>
        </div>
      ) : <NoDataFound title={emptyLabel} compact className="dashboard-widget__empty" />}
    </section>
  );
}

export function InfoWidget({ title, description, icon = "info", items = [], action }) {
  if (!description && !items.length) return null;
  return (
    <section className="dashboard-widget dashboard-widget--info" aria-label={title}>
      <WidgetHeading icon={icon} title={title} action={action} />
      {description ? <p className="dashboard-widget__info-description">{description}</p> : null}
      <div className="dashboard-widget__info-items">
        {items.map((item) => item.progress ? (
          <ProgressMeter key={item.id} label={item.label} icon={item.icon} tone={item.tone} value={item.progress.value} max={item.progress.max} displayValue={item.value} />
        ) : <div className="dashboard-widget__info-line" key={item.id}><span>{item.label}</span><strong>{item.value}</strong></div>)}
      </div>
    </section>
  );
}
