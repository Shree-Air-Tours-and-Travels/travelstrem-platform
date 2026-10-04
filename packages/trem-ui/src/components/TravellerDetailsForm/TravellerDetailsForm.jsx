import React from "react";
import ConfigurableForm from "../ConfigurableForm/ConfigurableForm.jsx";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import DetailsCard from "../DetailsCard/DetailsCard.jsx";
import "./TravellerDetailsForm.styles.scss";

export default function TravellerDetailsForm({ form = {}, values = {}, errors = {}, onChange }) {
  return (
    <DetailsCard className="trem-traveller-form" headerClassName="trem-traveller-form__header" title={form.title || "Traveller details"} description={form.description} actions={form.completedAt ? <StatusBadge value="Details saved" tone="success" size="sm" /> : null}>
      <ConfigurableForm config={form.config || {}} values={values} errors={errors} onChange={onChange} />
    </DetailsCard>
  );
}
