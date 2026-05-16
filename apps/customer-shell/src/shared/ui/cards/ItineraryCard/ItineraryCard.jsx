import React from "react";
import PropTypes from "prop-types";
import get from "lodash/get";
import isArray from "lodash/isArray";
import "./ItineraryCard.styles.scss";
import { Title } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";

/**
 * Updated ItineraryCard
 * - supports form fields: day, title, summary, activities, meals, accommodation,
 *   location, notes (flexible: accepts strings or arrays for activities/meals)
 * - keeps previous API: accepts top-level `itinerary` or nested `_page.itinerary`
 */
const normalizeToArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  // split comma lists into array
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [value];
};

const ItineraryCard = ({ tour }) => {
  const pageItinerary = get(tour, "itinerary") || get(tour, "_page.itinerary") || [];
  const arr = Array.isArray(pageItinerary) ? pageItinerary : get(pageItinerary, "sample", []);

  return (
    <aside
      className="itinerary-card itinerary-card--modern"
      aria-labelledby="itinerary-title"
      role="region"
    >
      <header className="itinerary-card__header">
        <Title id="itinerary-title" text="Itinerary" size="medium" />
        <span className="itinerary-card__meta" aria-hidden="true">
          {isArray(arr) ? `${arr.length} day${arr.length === 1 ? "" : "s"}` : "—"}
        </span>
      </header>

      <div className="itinerary-card__body">
        {isArray(arr) && arr.length > 0 ? (
          <ol className="ic-list" aria-live="polite">
            {arr.map((day, idx) => {
              const dayNumber = day.day ?? idx + 1;

              // Map form fields to UI-friendly props
              const title = day.title || `Day ${dayNumber}`;
              const summary = get(day, "summary") || get(day, "overview") || "";

              // activities and meals may come as a string (comma separated) or array
              const activities = normalizeToArray(get(day, "activities") || get(day, "activity") || "");
              const meals = normalizeToArray(get(day, "meals") || get(day, "mealsIncluded") || "");

              // accommodation maps to overnight in previous UI
              const accommodation = get(day, "accommodation") || get(day, "overnight") || "";

              const location = get(day, "location") || "";
              const notes = get(day, "notes") || "";

              return (
                <li className="ic-list__item" key={day.day ?? idx}>
                  <div className="ic-day" aria-hidden="true">
                    <span className="ic-day__num">Day {dayNumber}</span>
                  </div>

                  <div className="ic-main">
                    <div className="ic-main__head">
                      <SubTitle primaryClassname="ic-title" text={title} />

                      <div className="ic-time-loc" aria-hidden="true">
                        {day.time && <span className="ic-time">{day.time}</span>}
                        {location && <span className="ic-location">• {location}</span>}
                      </div>
                    </div>

                    {summary && <div className="ic-overview">{summary}</div>}

                    {activities.length > 0 && (
                      <div className="ic-activities">
                        <strong>Activities:</strong> {activities.join(", ")}
                      </div>
                    )}

                    <div className="ic-meta-row" aria-hidden="true">
                      {meals.length > 0 && (
                        <div className="ic-meals">
                          <strong>Meals:</strong> {meals.join(", ")}
                        </div>
                      )}

                      {accommodation && (
                        <div className="ic-overnight">
                          <strong>Accommodation:</strong> {accommodation}
                        </div>
                      )}
                    </div>

                    {notes && <div className="ic-notes">{notes}</div>}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="ic-empty">No itinerary available</div>
        )}
      </div>
    </aside>
  );
};

ItineraryCard.propTypes = {
  tour: PropTypes.object.isRequired,
};

export default ItineraryCard;
