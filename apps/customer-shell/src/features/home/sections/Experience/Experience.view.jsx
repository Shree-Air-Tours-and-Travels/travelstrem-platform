import React from "react";
import "./Experience.styles.scss";
import { Icon, Title, SmoothScroll, SubTitle, Paragraph } from "@packages/trem-ui";
import experienceImage from "../../shared/assets/images/experience.png";

const experienceData = {
  tag: "Experience",
  title: "With all our experience we will serve you",
  description:
    "For over 15 years, we've been creating unforgettable journeys, ensuring comfort, safety, and unique experiences for every traveler.",
  stats: [
    { id: 1, icon: <Icon name="suitcase" />, value: "12k+", label: "Successful trip" },
    { id: 2, icon: <Icon name="people" />, value: "2k+", label: "Regular clients" },
    { id: 3, icon: <Icon name="premium" />, value: "15", label: "Years experience" },
  ],
  image: experienceImage,
};

const ExperienceView = () => {
  return (
    <section className="ui-experience">
      <SmoothScroll variant="slideLeft" delay={0.1}>
        <div className="ui-experience__content">
          <Title className="ui-experience__tag" text={experienceData.tag} />
          <Title className="ui-experience__title" text={experienceData.title} size="small" variant="secondary"/>
          <Paragraph primaryClassname="ui-experience__description" text={experienceData.description} />
          <div className="ui-experience__stats">
            {experienceData.stats.map((stat) => (
              <div key={stat.id} className="ui-experience__stat">
                <span className="ui-experience__icon">{stat.icon}</span>
                <SubTitle primaryClassname="ui-experience__value" text={stat.value} />
                <Paragraph primaryClassname="ui-experience__label" text={stat.label} />
              </div>
            ))}
          </div>
        </div>
      </SmoothScroll>
      <SmoothScroll variant="slideRight" delay={0.3}>
        <div className="ui-experience__image">
          <img src={experienceData.image} alt="Experience" />
        </div>
      </SmoothScroll>
    </section>
  );
};

export default ExperienceView;
