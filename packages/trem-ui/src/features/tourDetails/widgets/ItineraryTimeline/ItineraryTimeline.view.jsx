import React, { useState, useCallback, useEffect } from "react";
import Title from "../../../../components/Title/Title.jsx";
import SubTitle from "../../../../components/SubTitle/SubTitle.jsx";
import Paragraph from "../../../../components/Paragraph/Paragraph.jsx";
import Button from "../../../../components/Button/Button.jsx";
import { getDisplayText } from "../../helper";

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
  const title = getDisplayText(day.title);
  const summary = getDisplayText(day.summary);
  const location = getDisplayText(day.location);
  const accommodation = getDisplayText(day.accommodation);
  const meals = Array.isArray(day.meals) ? day.meals.map((meal) => getDisplayText(meal)).filter(Boolean) : [];
  const activities = Array.isArray(day.activities) ? day.activities.map((activity) => getDisplayText(activity)).filter(Boolean) : [];
  const notes = getDisplayText(day.notes);

  return (
    <article className={`itinerary-day${isExpanded ? " is-expanded" : ""}`}>
      <button className="itinerary-day__header" onClick={onToggle} type="button">
        <div className="itinerary-day__marker">
          <span className="itinerary-day__marker-num">{dayNumber}</span>
        </div>
        <div className="itinerary-day__header-content">
          <SubTitle text={title || labels.plannedExperience} />
          {summary && !isExpanded ? (
            <p className="itinerary-day__preview">{summary}</p>
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
          {summary ? <Paragraph text={summary} /> : null}

          <div className="itinerary-day__meta">
            {location ? (
              <span className="itinerary-day__meta-item">
                {META_ICONS.location}
                {location}
              </span>
            ) : null}
            {accommodation ? (
              <span className="itinerary-day__meta-item">
                {META_ICONS.accommodation}
                {accommodation}
              </span>
            ) : null}
            {meals.length ? (
              <span className="itinerary-day__meta-item">
                {META_ICONS.meals}
                {meals.join(", ")}
              </span>
            ) : null}
          </div>

          {activities.length ? (
            <ul className="itinerary-day__activities">
              {activities.map((act, i) => (
                <li key={i} className="itinerary-day__activity">
                  <span className="itinerary-day__activity-dot" />
                  {act}
                </li>
              ))}
            </ul>
          ) : null}

          {notes ? (
            <div className="itinerary-day__note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <Paragraph text={notes} />
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function ItineraryTimelineView({ labels, itinerary, initialExpandedDays = 0 }) {
  const buildInitialState = useCallback(
    () => new Set(itinerary.slice(0, initialExpandedDays).map((_, index) => index)),
    [initialExpandedDays, itinerary]
  );
  const [expandedDays, setExpandedDays] = useState(buildInitialState);

  useEffect(() => {
    setExpandedDays(buildInitialState());
  }, [buildInitialState]);

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
        <Title text={labels.fullItinerary} />
        <Button
          primaryClassName="itinerary-header__toggle"
          variant="text"
          color="primary"
          size="small"
          text={allExpanded ? labels.collapseAll : labels.expandAll}
          onClick={allExpanded ? collapseAll : expandAll}
          aria-expanded={allExpanded}
        />
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
