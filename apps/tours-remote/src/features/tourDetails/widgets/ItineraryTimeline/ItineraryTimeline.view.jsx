import React from "react";
import { Title, SubTitle, Paragraph } from "@packages/trem-ui";

export default function ItineraryTimelineView({ labels, itinerary }) {
  if (!itinerary.length) return null;

  return (
    <section className="tour-detail__section">
      <Title text={labels.fullItinerary || "Itinerary"} />
      <div className="tour-detail__section-body">
        <div className="tour-detail__timeline">
          {itinerary.map((day, index) => (
            <article className="tour-detail__timeline-item" key={day._id || `${day.day}-${index}`}>
              <div className="tour-detail__timeline-marker">
                {labels.day || "Day"} {day.day || index + 1}
              </div>
              <div>
                <SubTitle text={day.title || "Planned experience"} />
                {day.summary ? <Paragraph text={day.summary} /> : null}
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
                {day.notes ? <Paragraph primaryClassname="tour-detail__note" text={day.notes} /> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
