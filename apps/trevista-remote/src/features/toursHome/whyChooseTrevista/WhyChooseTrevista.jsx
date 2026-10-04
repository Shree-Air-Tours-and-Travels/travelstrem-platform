import React from "react";
import { BenefitCard, Paragraph } from "@packages/trem-ui";
import "./whyChooseTrevista.scss";

const WhyChooseTrevista = ({ benefits = [], title = "Why Choose Trevista", description = "" }) => {
  if (!Array.isArray(benefits) || benefits.length === 0) return null;

  return (
    <section className="why-choose-trevista" aria-label={title}>
      <div className="why-choose-trevista__inner">
        <header className="why-choose-trevista__head">
          <span className="why-choose-trevista__eyebrow">{title}</span>
          {description && (
            <Paragraph
              primaryClassname="why-choose-trevista__desc"
              text={description}
              variant="body"
              size="medium"
            />
          )}
        </header>
        <div className="why-choose-trevista__grid">
          {benefits.map((benefit) => (
            <BenefitCard
              key={benefit.id}
              className="why-choose-trevista__card"
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseTrevista;
