import React from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import "./AgencyDetailsCard.scss";

export default function AgencyDetailsCard({ agency, operator, labels = {} }) {
  if (!agency?.name) return null;
  const initials = agency.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <section className="trem-agency-card" aria-label={labels.ariaLabel}>
      <div className="trem-agency-card__identity">
        {agency.logo ? <img src={agency.logo} alt="" /> : <span aria-hidden="true">{initials}</span>}
        <div>
          <small>{labels.eyebrow}</small>
          <h2>{agency.name}</h2>
          {agency.location ? <p><Icon name="mapPin" size={15} />{agency.location}</p> : null}
        </div>
      </div>
      <div className="trem-agency-card__meta">
        {operator?.name ? <p><small>{labels.travelPartner}</small><strong>{operator.name}</strong></p> : null}
      </div>
    </section>
  );
}

AgencyDetailsCard.propTypes = {
  agency: PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string, location: PropTypes.string }),
  operator: PropTypes.shape({ name: PropTypes.string, reference: PropTypes.string }),
  labels: PropTypes.object,
};
