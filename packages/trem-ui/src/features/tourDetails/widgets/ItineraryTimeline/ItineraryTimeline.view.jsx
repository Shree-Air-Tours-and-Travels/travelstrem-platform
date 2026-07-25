import React, { useState, useCallback } from "react";
import { Title, SubTitle, Paragraph } from "../../../../index.js";

const META_ICONS = {
  location: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  accommodation: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
    </svg>
  ),
  meals: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
};

function DayCard({ day, index, isExpanded, onToggle, labels }) {
  const dayNumber = day.day || index + 1;

  return (
    <article className={`itinerary-day${isExpanded ? " is-expanded" : ""}`}>
      <button className="itinerary-day__header" onClick={onToggle} type="button">
        <div className="itinerary-day__marker">
          <span className="itinerary-day__marker-num">{dayNumber}</span>
        </div>
        <div className="itinerary-day__header-content">
          <SubTitle text={day.title || "Planned experience"} />
          {day.summary && !isExpanded ? (
            <p className="itinerary-day__preview">{day.summary}</p>
          ) : null}
        </div>
        <svg
          className={`itinerary-day__chevron${isExpanded ? " is-open" : ""}`}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded ? (
        <div className="itinerary-day__body">
          {day.summary ? <Paragraph text={day.summary} /> : null}

          <div className="itinerary-day__meta">
            {day.location ? (
              <span className="itinerary-day__meta-item">
                {META_ICONS.location}
                {day.location}
              </span>
            ) : null}
            {day.accommodation ? (
              <span className="itinerary-day__meta-item">
                {META_ICONS.accommodation}
                {day.accommodation}
              </span>
            ) : null}
            {Array.isArray(day.meals) && day.meals.length ? (
              <span className="itinerary-day__meta-item">
                {META_ICONS.meals}
                {day.meals.join(", ")}
              </span>
            ) : null}
          </div>

          {Array.isArray(day.activities) && day.activities.length ? (
            <ul className="itinerary-day__activities">
              {day.activities.map((act, i) => (
                <li key={i} className="itinerary-day__activity">
                  <span className="itinerary-day__activity-dot" />
                  {act}
                </li>
              ))}
            </ul>
          ) : null}

          {day.notes ? (
            <div className="itinerary-day__note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <Paragraph text={day.notes} />
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function ItineraryTimelineView({ labels, itinerary }) {
  const [expandedDays, setExpandedDays] = useState(() => {
    if (itinerary.length <= 3) {
      return new Set(itinerary.map((_, i) => i));
    }
    return new Set([0]);
  });

  const toggleDay = useCallback((index) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedDays(new Set(itinerary.map((_, i) => i)));
  }, [itinerary.length]);

  const collapseAll = useCallback(() => {
    setExpandedDays(new Set());
  }, []);

  if (!itinerary.length) return null;

  const allExpanded = expandedDays.size === itinerary.length;

  return (
    <section className="tour-detail__section">
      <div className="itinerary-header">
        <Title text={labels.fullItinerary || "Itinerary"} />
        <button
          className="itinerary-header__toggle"
          onClick={allExpanded ? collapseAll : expandAll}
          type="button"
        >
          {allExpanded ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <div className="tour-detail__section-body">
        <div className="itinerary-timeline">
          <div className="itinerary-timeline__line" />
          {itinerary.map((day, index) => (
            <DayCard
              key={day._id || `${day.day}-${index}`}
              day={day}
              index={index}
              isExpanded={expandedDays.has(index)}
              onToggle={() => toggleDay(index)}
              labels={labels}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
