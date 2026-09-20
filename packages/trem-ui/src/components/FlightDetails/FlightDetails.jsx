import React from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import "./FlightDetails.styles.scss";

const labelFor = (labels, ref, fallback = "") => labels?.[ref] || fallback || ref;

export default function FlightDetails({ details = {}, selectedFareId, labels = {}, config = {} }) {
  const itinerary = details.itinerary || {};
  const selectedFare = (details.fares || []).find((fare) => fare.fareId === selectedFareId)
    || details.fares?.[0];

  return (
    <section className="trem-flight-details">
      <header className="trem-flight-details__header">
        <div>
          <span>{labelFor(labels, config.eyebrowRef, "Flight details")}</span>
          <h2>{labelFor(labels, config.titleRef, "Your itinerary")}</h2>
          <p>{labelFor(labels, config.descriptionRef, "Review the complete itinerary before selecting a fare.")}</p>
        </div>
        <span className="trem-flight-details__assurance">
          <Icon name="shieldCheck" size={18} />
          {labelFor(labels, config.assuranceRef, "Secure fare selection")}
        </span>
      </header>

      <div className="trem-flight-details__overview">
        {(details.overview || []).map((item) => (
          <div className="trem-flight-details__fact" key={item.id}>
            <Icon name={item.icon} size={19} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="trem-flight-details__itinerary">
        <header>
          <div>
            <h3>{labelFor(labels, config.itineraryTitleRef, "Flight itinerary")}</h3>
            <p>{itinerary.segmentCount} flight segment{itinerary.segmentCount === 1 ? "" : "s"}</p>
          </div>
          <Icon name="route" size={22} />
        </header>

        {(itinerary.segments || []).map((segment) => (
          <article className="trem-flight-details__segment" key={segment.id}>
            <div className="trem-flight-details__carrier">
              <span className="trem-flight-details__carrier-icon">
                <Icon name={segment.airline?.icon || "airlineGeneric"} size={28} />
              </span>
              <div>
                <strong>{segment.airline?.name}</strong>
                <span>{segment.flightNumber}</span>
                <small>{segment.direction}</small>
              </div>
            </div>

            <div className="trem-flight-details__route">
              <div>
                <time dateTime={segment.departure?.iso}>{segment.departure?.time}</time>
                {segment.departure?.date ? <small>{segment.departure.date}</small> : null}
                <strong>{segment.departure?.code}</strong>
                <span>{segment.departure?.city}</span>
                <small>{segment.departure?.name}</small>
                {segment.departure?.terminal ? <small>Terminal {segment.departure.terminal}</small> : null}
              </div>
              <div className="trem-flight-details__route-line">
                <span>{segment.duration}</span>
                <div><i /><Icon name="plane" size={20} /><i /></div>
                <small>{segment.stopsLabel || labelFor(labels, config.nonStopRef, "Non-stop")}</small>
              </div>
              <div>
                <time dateTime={segment.arrival?.iso}>{segment.arrival?.time}</time>
                {segment.arrival?.date ? <small>{segment.arrival.date}</small> : null}
                <strong>{segment.arrival?.code}</strong>
                <span>{segment.arrival?.city}</span>
                <small>{segment.arrival?.name}</small>
                {segment.arrival?.terminal ? <small>Terminal {segment.arrival.terminal}</small> : null}
              </div>
            </div>

            <dl className="trem-flight-details__equipment">
              {segment.aircraft ? <div><dt>{labelFor(labels, config.aircraftRef, "Aircraft")}</dt><dd>{segment.aircraft}</dd></div> : null}
              {segment.cabin || selectedFare?.cabin ? <div><dt>{labelFor(labels, config.cabinRef, "Cabin")}</dt><dd>{segment.cabin || selectedFare.cabin}{segment.bookingClass || selectedFare?.bookingClass ? ` · Class ${segment.bookingClass || selectedFare.bookingClass}` : ""}</dd></div> : null}
              {segment.operatingAirline?.name ? <div><dt>{labelFor(labels, config.operatedByRef, "Operated by")}</dt><dd>{segment.operatingAirline.name}</dd></div> : null}
            </dl>

            {segment.layoverAfter ? (
              <div className="trem-flight-details__layover"><Icon name="clock" size={16} />{segment.layoverAfter}</div>
            ) : null}
          </article>
        ))}
      </div>

      {selectedFare ? (
        <div className="trem-flight-details__fare-detail">
          <header>
            <div>
              <h3>{selectedFare.brand} {labelFor(labels, config.fareDetailsRef, "fare details")}</h3>
              <p>{selectedFare.cabin} · Booking class {selectedFare.bookingClass}</p>
            </div>
            <StatusBadge value={selectedFare.availability?.status || "Check availability"} appearance="accent" />
          </header>

          <div className="trem-flight-details__fare-grid">
            <section>
              <h4>{labelFor(labels, config.inclusionsRef, "Included in this fare")}</h4>
              <div className="trem-flight-details__benefits">
                {(selectedFare.benefits || []).map((item) => (
                  <div className="trem-flight-details__benefit" key={item.id}>
                    <Icon name={item.icon} size={18} />
                    <div><span>{item.label}</span><strong>{item.value}</strong></div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h4>{labelFor(labels, config.conditionsRef, "Fare conditions")}</h4>
              <dl className="trem-flight-details__conditions">
                {(selectedFare.conditions || []).map((item) => (
                  <div key={item.id}>
                    <dt>{item.label}</dt>
                    <dd><StatusBadge value={item.value} tone={item.tone} size="sm" showDot={false} /></dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>
      ) : null}

      <aside className="trem-flight-details__notices">
        <Icon name="info" size={18} />
        <div>
          <strong>{labelFor(labels, config.importantInfoRef, "Important information")}</strong>
          <ul>{(details.notices || []).map((notice) => <li key={notice}>{notice}</li>)}</ul>
        </div>
      </aside>
    </section>
  );
}

FlightDetails.propTypes = {
  details: PropTypes.object,
  selectedFareId: PropTypes.string,
  labels: PropTypes.object,
  config: PropTypes.object,
};
