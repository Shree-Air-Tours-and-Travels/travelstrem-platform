import React, { useMemo } from "react";
import { ConfigurableForm, Paragraph } from "@packages/trem-ui";

export default function BookingTravelerStepView({
  labels,
  options,
  config,
  configLoading,
  travelers,
  guests,
  maxGuests,
  contactEmail,
  contactPhone,
  fieldErrors,
  onContactEmailChange,
  onContactPhoneChange,
  onTravelerChange,
  onGuestsChange,
  onClearError,
}) {
  const leadSectionTitle = config?.leadSectionTitle || labels.sectionContact || "Contact Details";
  const leadLayout = config?.leadLayout || { columns: 2, expandable: false };
  const travellerLayout = config?.layout || { columns: 2, expandable: true, defaultExpanded: true };
  const sections = config?.sections || [];
  const leadFields = config?.leadFields || [];

  const leadConfig = useMemo(
    () => ({
      layout: leadLayout,
      sections: [{ id: "lead", title: leadSectionTitle, collapsible: false, fields: leadFields }],
    }),
    [leadLayout, leadSectionTitle, leadFields]
  );

  const travellerConfig = useMemo(
    () => ({ layout: travellerLayout, sections }),
    [travellerLayout, sections]
  );

  const handleLeadChange = (name, value) => {
    if (name === "guests") onGuestsChange("adults", value);
    else if (name === "contactEmail") {
      onContactEmailChange(value);
      onClearError("contactEmail");
    } else if (name === "contactPhone") {
      onContactPhoneChange(value);
      onClearError("contactPhone");
    }
  };

  const travelerErrorsFor = (index) => {
    const prefix = `travelers.${index}.`;
    const out = {};
    Object.keys(fieldErrors).forEach((key) => {
      if (key.startsWith(prefix)) out[key.slice(prefix.length)] = fieldErrors[key];
    });
    return out;
  };

  const handleTravelerChange = (index, name, value) => {
    onTravelerChange(index, name, value);
    onClearError(`travelers.${index}.${name}`);
  };

  if (configLoading) {
    return (
      <div className="booking-page__card-body">
        <Paragraph primaryClassname="booking-page__hint" text={labels.loadingText || "Loading traveler form..."} />
      </div>
    );
  }

  return (
    <div className="booking-page__card-body">
      <Paragraph primaryClassname="booking-page__hint" text={labels.travelerHint || "Please provide details for each traveler. Fields marked with an asterisk (*) are required."} />

      <ConfigurableForm
        config={leadConfig}
        values={{ contactEmail, contactPhone, guests }}
        errors={fieldErrors}
        onChange={handleLeadChange}
      />

      <div className="booking-page__traveler-list">
        {travelers.map((traveler, index) => (
          <div key={index} className="booking-page__traveler-card">
            <div className="booking-page__traveler-head">
              <strong>{(labels.travelerTitle || "Traveler {number}").replace("{number}", String(index + 1))}</strong>
              <span>{traveler.firstName || traveler.lastName ? `${traveler.firstName || ""} ${traveler.lastName || ""}`.trim() : "New traveler"}</span>
            </div>
            <div className="booking-page__traveler-body">
              <ConfigurableForm
                config={travellerConfig}
                values={traveler}
                errors={travelerErrorsFor(index)}
                onChange={(name, value) => handleTravelerChange(index, name, value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
