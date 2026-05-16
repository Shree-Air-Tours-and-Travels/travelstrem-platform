import React from "react";
import "./Experience.styles.scss";
import { FaSuitcaseRolling } from "react-icons/fa";
import { IoPeopleSharp } from "react-icons/io5";
import { MdOutlineWorkspacePremium } from "react-icons/md";
import { Title } from "@packages/trem-ui";
import experienceImage from "../../shared/assets/images/experience.png";

const experienceData = {
  tag: "Experience",
  title: "With all our experience we will serve you",
  description:
    "For over 15 years, we've been creating unforgettable journeys, ensuring comfort, safety, and unique experiences for every traveler.",
  stats: [
    { id: 1, icon: <FaSuitcaseRolling />, value: "12k+", label: "Successful trip" },
    { id: 2, icon: <IoPeopleSharp />, value: "2k+", label: "Regular clients" },
    { id: 3, icon: <MdOutlineWorkspacePremium />, value: "15", label: "Years experience" },
  ],
  image: experienceImage,
};

const ExperienceView = () => {
  return (
    <section className="ui-experience">
      <div className="ui-experience__content">
        <Title className="ui-experience__tag" text={experienceData.tag} />
        <Title className="ui-experience__title" text={experienceData.title} size="small" variant="secondary"/>
        <p className="ui-experience__description">{experienceData.description}</p>
        <div className="ui-experience__stats">
          {experienceData.stats.map((stat) => (
            <div key={stat.id} className="ui-experience__stat">
              <span className="ui-experience__icon">{stat.icon}</span>
              <h3 className="ui-experience__value">{stat.value}</h3>
              <p className="ui-experience__label">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="ui-experience__image">
        <img src={experienceData.image} alt="Experience" />
      </div>
    </section>
  );
};

export default ExperienceView;
