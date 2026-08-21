import React from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import "./AgencyDetailsCard.scss";

export default function AgencyDetailsCard({ agency, operator, providerName, labels = {} }) {
  const effectiveAgency = agency?.name
    ? agency
    : providerName
      ? { name: providerName, logo: "", location: "" }
      : null;

  if (!effectiveAgency && !operator?.name) return null;

  const agencyName = effectiveAgency?.name || labels.unknownAgency || "Independent tour operator";
  const initials = agencyName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <section className="trem-agency-card" aria-label={labels.ariaLabel}>
      <div className="trem-agency-card__identity">
        {effectiveAgency?.logo ? <img src={effectiveAgency.logo} alt="" /> : <span aria-hidden="true">{initials}</span>}
        <div>
          <small>{labels.eyebrow || "Operated by"}</small>
          <h2>{agencyName}</h2>
          {effectiveAgency?.location ? <p><Icon name="mapPin" size={15} />{effectiveAgency.location}</p> : null}
        </div>
      </div>
      <div className="trem-agency-card__meta">
        {operator?.name ? (
          <div className="trem-agency-card__operator">
            <span aria-hidden="true"><Icon name="user" size={18} /></span>
            <p>
              <small>{labels.travelPartner || "Uploaded by agent"}</small>
              <strong>{operator.name}</strong>
              {operator.email ? <a className="trem-agency-card__email" href={`mailto:${operator.email}`}>{operator.email}</a> : null}
            </p>
          </div>
        ) : (
          <p className="trem-agency-card__managed">
            <small>{labels.inventoryOwner || "Inventory owner"}</small>
            <strong>{agencyName}</strong>
          </p>
        )}
      </div>
    </section>
  );
}

AgencyDetailsCard.propTypes = {
  agency: PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string, location: PropTypes.string }),
  operator: PropTypes.shape({ name: PropTypes.string, email: PropTypes.string }),
  providerName: PropTypes.string,
  labels: PropTypes.object,
};
