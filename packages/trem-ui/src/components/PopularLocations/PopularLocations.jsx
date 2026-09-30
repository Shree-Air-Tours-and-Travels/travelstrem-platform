import React from "react";
import PropTypes from "prop-types";
import DestinationCardList from "../DestinationCardList/DestinationCardList.jsx";
import Paragraph from "../Paragraph/Paragraph.jsx";
import SubTitle from "../SubTitle/SubTitle.jsx";
import "./PopularLocations.styles.scss";

export default function PopularLocations({
  eyebrow,
  title,
  description,
  locations = [],
  columns = 4,
  cardVariant = "overlay",
  emptyTitle = "",
  emptyDescription = "",
  className = "",
}) {
  return (
    <section className={`trem-popular-locations${className ? ` ${className}` : ""}`}>
      <header className="trem-popular-locations__header">
        {eyebrow ? <span className="trem-popular-locations__eyebrow">{eyebrow}</span> : null}
        {title ? (
          <SubTitle
            text={title}
            variant="primary"
            size="large"
            primaryClassname="trem-popular-locations__title"
          />
        ) : null}
        {description ? (
          <Paragraph
            text={description}
            variant="body"
            size="medium"
            primaryClassname="trem-popular-locations__description"
          />
        ) : null}
      </header>
      <DestinationCardList
        destinations={locations}
        columns={columns}
        gap={16}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        cardProps={{ variant: cardVariant, aspectRatio: "landscape", overlay: "medium" }}
        className="trem-popular-locations__grid"
      />
    </section>
  );
}

PopularLocations.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  locations: PropTypes.arrayOf(PropTypes.object),
  columns: PropTypes.number,
  cardVariant: PropTypes.string,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
  className: PropTypes.string,
};
