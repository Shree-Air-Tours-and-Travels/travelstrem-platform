import React from "react";
import { getPath } from "../../utils/paths.js";

const clampScore = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const formatDate = (value) => {
  if (!value) return "Not evaluated yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not evaluated yet";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const titleCase = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const Status = ({ label, value, tone = "neutral" }) => (
  <div className="tb-intelligence__status">
    <span className="tb-intelligence__status-label">{label}</span>
    <span className={`tb-intelligence__badge tb-intelligence__badge--${tone}`}>{value}</span>
  </div>
);

export default function TourIntelligenceSummaryWidget({ widget, root }) {
  const intelligence = getPath(root, widget.path) || {};
  const featured = getPath(root, widget.featuredPath) === true;
  const trending = getPath(root, widget.trendingPath) === true;
  const verified = getPath(root, widget.verifiedPath) === true;
  const featuredRequest = getPath(root, widget.featuredRequestPath) || {};
  const score = clampScore(intelligence.qualityScore);
  const requested = featuredRequest.requested === true;
  const requestStatus = String(featuredRequest.status || (requested ? "pending" : "not_requested"));

  let featuredLabel = "Not requested";
  let featuredTone = "neutral";
  if (featured) {
    featuredLabel = "Featured";
    featuredTone = "positive";
  } else if (requested && requestStatus === "pending") {
    featuredLabel = "Under review";
    featuredTone = "pending";
  } else if (requested) {
    featuredLabel = titleCase(requestStatus);
    featuredTone = requestStatus === "eligible" ? "positive" : "neutral";
  }

  return (
    <section className="tb-intelligence" aria-label={widget.label || "Tour intelligence"}>
      <header className="tb-intelligence__head">
        <div>
          <strong>{widget.label || "TravelsTREM intelligence"}</strong>
          <p>System-derived signals update as travellers interact with this tour.</p>
        </div>
        <div className="tb-intelligence__score" aria-label={`Quality score ${score} out of 100`}>
          <strong>{score}</strong>
          <span>/100</span>
        </div>
      </header>

      <div className="tb-intelligence__progress" aria-hidden="true">
        <span style={{ width: `${score}%` }} />
      </div>

      <div className="tb-intelligence__statuses">
        <Status
          label="TREM verification"
          value={verified ? "Verified" : "Not verified"}
          tone={verified ? "positive" : "neutral"}
        />
        <Status
          label="Trending"
          value={trending ? "Active" : "Not trending"}
          tone={trending ? "positive" : "neutral"}
        />
        <Status label="Featured placement" value={featuredLabel} tone={featuredTone} />
      </div>

      <footer className="tb-intelligence__footer">
        <span>Last evaluated</span>
        <strong>{formatDate(intelligence.lastEvaluatedAt)}</strong>
      </footer>
    </section>
  );
}
