import React from "react";

export default function ItineraryTimelineView({ labels, itinerary }) {
  if (!itinerary.length) return null;

  return (
    <section className="tour-detail__section">
      <h2>{labels.fullItinerary || "Itinerary"}</h2>
      <div className="tour-detail__section-body">
        <div className="tour-detail__timeline">
          {itinerary.map((day, index) => (
            <article className="tour-detail__timeline-item" key={day._id || `${day.day}-${index}`}>
              <div className="tour-detail__timeline-marker">
                {labels.day || "Day"} {day.day || index + 1}
              </div>
              <div>
                <h3>{day.title || "Planned experience"}</h3>
                {day.summary ? <p>{day.summary}</p> : null}
                <div className="tour-detail__mini-meta">
                  {day.location ? <span>{day.location}</span> : null}
                  {day.accommodation ? <span>{day.accommodation}</span> : null}
                  {Array.isArray(day.meals) && day.meals.length ? <span>{day.meals.join(", ")}</span> : null}
                </div>
                {Array.isArray(day.activities) && day.activities.length ? (
                  <ul className="tour-detail__check-list">
                    {day.activities.map((act, i) => <li key={i}>{act}</li>)}
                  </ul>
                ) : null}
                {day.notes ? <p className="tour-detail__note">{day.notes}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
