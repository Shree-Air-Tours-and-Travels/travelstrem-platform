import React from "react";
import PropTypes from "prop-types";

import "./ServiceCard.styles.scss";
import { Icon, SubTitle, Title, Button } from "@packages/trem-ui";


/* ==========================
   Service Icons
   ========================== */

const ServiceIcon = ({ id }) => {
    const iconProps = {
        size: 34,
        strokeWidth: 1.8,
    };

    switch (id) {
        case "trevio":
            return <Icon name="map" {...iconProps} />;

        case "trevista":
            return <Icon name="briefcaseBusiness" {...iconProps} />;

        default:
            return <Icon name="compass" {...iconProps} />;
    }
};

/* ==========================
   Component
   ========================== */

const ServiceCard = ({ service, onClick }) => {
    return (
        <Button
            type="button"
            primaryClassName="ui-service-card"
            onClick={() => onClick(service)}
            aria-label={`Open ${service.label}`}
        >
            <div className="ui-service-card__top">
                <div className="ui-service-card__image-container">
                    <ServiceIcon id={service.id} />
                </div>

                <span className="ui-service-card__action" aria-hidden="true">
                    <Icon name="arrowUpRight" size={18} strokeWidth={2.2} />
                </span>
            </div>

            <div className="ui-service-card__content">
                <Title
                    primaryClassname="ui-service-card__title"
                    text={service.label}
                    size="small"
                />

                <SubTitle
                    primaryClassname="ui-service-card__description"
                    text={
                        service.shortDescription ||
                        service.description
                    }
                    variant="tertiary"
                    size="small"
                />

                {service.highlights?.length >
                    0 && (
                    <div className="ui-service-card__highlights">
                        {service.highlights.map(
                            (item, index) => (
                                <span
                                    key={`${service.id}-${index}`}
                                    className="ui-service-card__highlight"
                                >
                                    {item}
                                </span>
                            )
                        )}
                    </div>
                )}
            </div>
        </Button>
    );
};

ServiceCard.propTypes = {
    service: PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        shortDescription: PropTypes.string,
        highlights: PropTypes.arrayOf(
            PropTypes.string
        ),
    }).isRequired,
    onClick: PropTypes.func,
};

ServiceCard.defaultProps = {
    onClick: () => {},
};

export default ServiceCard;
