import React from "react";
import ConfigurableForm from "../ConfigurableForm/ConfigurableForm.jsx";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import "./TravellerDetailsForm.styles.scss";

export default function TravellerDetailsForm({ form = {}, values = {}, errors = {}, onChange }) {
  return (
    <section className="trem-traveller-form" aria-labelledby="traveller-details-title">
      <header className="trem-traveller-form__header">
        <div>
          <h2 id="traveller-details-title">{form.title || "Traveller details"}</h2>
          {form.description ? <p>{form.description}</p> : null}
        </div>
        {form.completedAt ? <StatusBadge value="Details saved" tone="success" size="sm" /> : null}
      </header>
      <ConfigurableForm config={form.config || {}} values={values} errors={errors} onChange={onChange} />
    </section>
  );
}
