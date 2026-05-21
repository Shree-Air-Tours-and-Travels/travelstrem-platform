import React from "react";
import "./ServiceCard.styles.scss";
import Icon from "../../icons/Icon/Icon.jsx";
import Title from "../Title/Title.jsx";
import SubTitle from "../SubTitle/SubTitle.jsx";
import Button from "../Button/Button.jsx";

const ServiceIcon = ({ id }) => {
    const iconProps = { size: 34, strokeWidth: 1.8 };
    switch (id) {
        case "flights-hotels":
            return (
                <div className="ui-service-card__icon-stack">
                    <Icon name="plane" {...iconProps} />
                    <Icon name="hotel" {...iconProps} />
                </div>
            );
        case "travel-packages":
            return <Icon name="map" {...iconProps} />;
        case "visa-passport":
            return <Icon name="shieldCheck" {...iconProps} />;
        case "corporate-packages":
            return <Icon name="briefcaseBusiness" {...iconProps} />;
        case "cab-services":
            return <Icon name="carTaxiFront" {...iconProps} />;
        default:
            return <Icon name="plane" {...iconProps} />;
    }
};

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
                <Title primaryClassname="ui-service-card__title" text={service.label} size="small" />
                <SubTitle primaryClassname="ui-service-card__description" text={service.shortDescription || service.description} variant="tertiary" size="small" />
                {service.highlights?.length > 0 && (
                    <div className="ui-service-card__highlights">
                        {service.highlights.map((item, index) => (
                            <span key={`${service.id}-${index}`} className="ui-service-card__highlight">{item}</span>
                        ))}
                    </div>
                )}
            </div>
        </Button>
    );
};

export default ServiceCard;
