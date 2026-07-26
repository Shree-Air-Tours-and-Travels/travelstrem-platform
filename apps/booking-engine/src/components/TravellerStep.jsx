import React, { useState } from "react";
import { FormField } from "./FormElements.jsx";

export default function TravellerStep({
  travellers,
  contact,
  updateTraveller,
  updateContact,
  errors,
  TRAVELLER_FIELDS,
}) {
  const [expandedTraveller, setExpandedTraveller] = useState(0);

  return (
    <div className="be-step be-step--travellers">
      <h3 className="be-step__heading">Contact Information</h3>
      <div className="be-step__form-row">
        <FormField
          field={{ name: "name", label: "Full Name", type: "text", required: true }}
          value={contact.name}
          error={errors["contact.name"]}
          onChange={(name, val) => updateContact(name, val)}
        />
        <FormField
          field={{ name: "email", label: "Email", type: "email", required: true }}
          value={contact.email}
          error={errors["contact.email"]}
          onChange={(name, val) => updateContact(name, val)}
        />
        <FormField
          field={{ name: "phone", label: "Phone", type: "tel", required: true }}
          value={contact.phone}
          error={errors["contact.phone"]}
          onChange={(name, val) => updateContact(name, val)}
        />
      </div>

      <h3 className="be-step__heading">Traveller Details</h3>
      <div className="be-travellers">
        {travellers.map((traveller, index) => {
          const isExpanded = expandedTraveller === index;
          const hasErrors = Object.keys(errors).some((k) => k.startsWith(`travellers.${index}.`));
          return (
            <div key={index} className={`be-traveller ${isExpanded ? "be-traveller--expanded" : ""}`}>
              <button
                type="button"
                className="be-traveller__header"
                onClick={() => setExpandedTraveller(isExpanded ? -1 : index)}
              >
                <span className="be-traveller__number">{index + 1}</span>
                <span className="be-traveller__name">
                  {traveller.firstName || traveller.lastName
                    ? `${traveller.title ? traveller.title + ". " : ""}${traveller.firstName} ${traveller.lastName}`.trim()
                    : `Traveller ${index + 1}`}
                </span>
                {hasErrors && <span className="be-traveller__error-dot" />}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="be-traveller__chevron">
                  <path d={isExpanded ? "M3 9l4-4 4 4" : "M3 5l4 4 4-4"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              {isExpanded && (
                <div className="be-traveller__form">
                  <div className="be-step__form-row be-step__form-row--compact">
                    {TRAVELLER_FIELDS.map((field) => (
                      <FormField
                        key={field.name}
                        field={field}
                        value={traveller[field.name]}
                        error={errors[`travellers.${index}.${field.name}`]}
                        onChange={(name, val) => updateTraveller(index, name, val)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
