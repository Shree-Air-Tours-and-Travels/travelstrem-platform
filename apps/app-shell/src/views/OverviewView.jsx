import React from "react";
import {
  MetricSummary,
  OverviewRail,
  PlanCards,
  Preloader,
} from "@packages/trem-ui";
import "./OverviewView.scss";

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default function OverviewView({
  user,
  stats,
  metricsDefinition,
  planCards,
  overviewRail,
  overviewDefinitionLoading = false,
  overviewStatsLoading = false,
  onTabChange,
}) {
  const metricItems = (metricsDefinition?.items || []).map((item) => ({
    ...item,
    label: metricsDefinition.labels?.[item.labelRef] || item.label || "",
    value: stats?.[item.valueKey] ?? 0,
    onClick: item.target ? () => onTabChange?.(item.target) : undefined,
  }));

  return (
    <div className="dov">
      <div className="dov__greeting">
        <h1>Good {getTimeOfDay()}, {user?.name?.split(" ")[0] || "there"} 👋 </h1>
        <p>Here's what's happening with your travel plans</p>
      </div>

      {overviewStatsLoading || overviewDefinitionLoading ? (
        <Preloader
          variant="stats"
          count={1}
          label="Loading statistics"
          className="dov__stats-preloader"
        />
      ) : metricItems.length ? (
        <MetricSummary
          items={metricItems}
          ariaLabel={metricsDefinition.labels?.[metricsDefinition.ariaLabelRef]}
          className="dov__stats"
        />
      ) : null}

      <div className={`dov__content${overviewRail || overviewDefinitionLoading ? "" : " dov__content--single"}`}>
        <main className="dov__main">
          {overviewDefinitionLoading ? (
            <Preloader
              variant="cards"
              count={3}
              label="Loading journey planning options"
              className="dov__plan-cards"
            />
          ) : planCards ? (
            <PlanCards {...planCards} className="dov__plan-cards" />
          ) : null}

        </main>

        {overviewDefinitionLoading ? (
          <Preloader
            variant="stack"
            count={3}
            label="Loading travel tools"
            className="dov__rail"
          />
        ) : overviewRail ? (
          <OverviewRail {...overviewRail} className="dov__rail" />
        ) : null}
      </div>
    </div>
  );
}
