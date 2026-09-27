import React, { useState } from "react";
import { Icon } from "@packages/trem-ui";
import "./TravelKnowledge.scss";

export default function TravelKnowledge({ title, facts = [] }) {
  const [seed] = useState(() => Math.random());
  const fact = facts[Math.floor(seed * facts.length)];
  if (!fact) return null;

  return (
    <section className="travel-knowledge" aria-label={title}>
      <header className="travel-knowledge__heading">
        <span className="travel-knowledge__icon" aria-hidden="true"><Icon name={fact.icon} size={24} /></span>
        <h2>{title}</h2>
      </header>
      <div className="travel-knowledge__content">
        <h3>{fact.label}</h3>
        <p>{fact.description}</p>
      </div>
      <span className="travel-knowledge__decoration" aria-hidden="true"><Icon name="compass" size={120} /></span>
    </section>
  );
}
