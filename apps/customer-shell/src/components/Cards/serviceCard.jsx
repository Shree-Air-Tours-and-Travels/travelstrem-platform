import React from "react";
import PropTypes from "prop-types";
import "../../styles/components/serviceCard.scss";
import { SubTitle } from "@packages/trem-ui";
import { Title } from "@packages/trem-ui";

const ServiceCard = ({ service }) => {
  return (
    <div className="ui-service-card">
      <div className="ui-service-card__image-container">
        <img src={service.image} alt={service.label} className="ui-service-card__image" />
      </div>
      <Title className="ui-service-card__title" text={service.label} size="small"></Title>
      <SubTitle className="ui-service-card__description" text={service.description}></SubTitle>
    </div>
  );
};

ServiceCard.propTypes = {
  service: PropTypes.shape({
    image: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
};

export default ServiceCard;
