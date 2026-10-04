import React from "react";
import PropTypes from "prop-types";
import Dropdown from "../Dropdown/Dropdown.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./InfoTooltip.styles.scss";

export default function InfoTooltip({ label, text, inModal = false, hide = false }) {
  if (!text || hide) return null;

  return (
    <Dropdown
      className="trem-info-tooltip"
      portalClassName={
        inModal
          ? "trem-info-tooltip__portal trem-info-tooltip__portal--modal"
          : "trem-info-tooltip__portal"
      }
      menuClassName="trem-info-tooltip__menu"
      menuAriaLabel={label}
      align="right"
      portalWidth={300}
      hoverable={false}
      trigger={
        <button type="button" className="trem-info-tooltip__trigger" aria-label={label}>
          <Icon name="info" size={16} aria-hidden="true" />
        </button>
      }
      items={[{ id: "information", label }]}
      renderItem={() => (
        <div className="trem-info-tooltip__content">
          <strong>{label}</strong>
          <p>{text}</p>
        </div>
      )}
    />
  );
}

InfoTooltip.propTypes = {
  label: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  inModal: PropTypes.bool,
  hide: PropTypes.bool,
};
