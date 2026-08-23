import React, { useState, useEffect } from "react";
import { FormField } from "./FormElements.jsx";
import useGeoLocation from "../hooks/useGeoLocation.js";

const DOMESTIC_NATIONALITIES = new Set(["India"]);

function buildPrefOptions(options = []) {
  if (!options.length) return [];
  return options.map((opt) => ({
    value: opt.value,
    label: opt.extraPrice > 0
      ? `${opt.label} (+₹${Number(opt.extraPrice).toLocaleString("en-IN")})`
      : opt.extraPrice < 0
        ? `${opt.label} (-₹${Math.abs(Number(opt.extraPrice)).toLocaleString("en-IN")})`
        : opt.label,
  }));
}

export default function TravellerStep({
  travellers,
  contact,
  updateTraveller,
  updateContact,
  errors,
  TRAVELLER_FIELDS,
  TRAVELLER_PREFERENCE_FIELDS,
  trip,
  productData,
}) {
  const [expandedTraveller, setExpandedTraveller] = useState(0);
  const { country: detectedCountry, loading: geoLoading } = useGeoLocation();

  useEffect(() => {
    if (detectedCountry && !geoLoading) {
      travellers.forEach((t, i) => {
        if (!t.nationality) {
          updateTraveller(i, "nationality", detectedCountry);
        }
      });
    }
  }, [detectedCountry, geoLoading]);

  useEffect(() => {
    const firstTravellerError = Object.keys(errors).find((key) => key.startsWith("travellers."));
    if (!firstTravellerError) return;
    const errorIndex = Number(firstTravellerError.split(".")[1]);
    if (Number.isInteger(errorIndex)) setExpandedTraveller(errorIndex);
  }, [errors]);

  const isInternational = travellers.some((t) => {
    const nat = (t.nationality || "").toLowerCase();
    return nat && !DOMESTIC_NATIONALITIES.has(nat);
  });

  const prefs = productData?.preferences || {};
  const prefFieldOptions = {};
  if (TRAVELLER_PREFERENCE_FIELDS) {
    TRAVELLER_PREFERENCE_FIELDS.forEach((pf) => {
      prefFieldOptions[pf.name] = buildPrefOptions(prefs[pf.optionsKey] || []);
    });
  }

  const getDynamicFields = () => {
    return TRAVELLER_FIELDS.map((field) => {
      if (field.name === "passportNumber") {
        return {
          ...field,
          required: isInternational,
          placeholder: isInternational ? "Required for international travel" : "Optional for domestic travel",
        };
      }
      if (field.name === "emergencyContact") {
        return { ...field, required: false };
      }
      return field;
    });
  };

  const dynamicFields = getDynamicFields();

  const renderPreferences = (traveller, index) => {
    if (!TRAVELLER_PREFERENCE_FIELDS || TRAVELLER_PREFERENCE_FIELDS.length === 0) return null;

    const fieldsToShow = TRAVELLER_PREFERENCE_FIELDS.filter((pf) => {
      const options = prefFieldOptions[pf.name];
      return options && options.length > 0;
    });

    if (fieldsToShow.length === 0) return null;

    return (
      <div className="be-traveller__preferences">
        <h4 className="be-traveller__pref-heading">Preferences</h4>
        <div className="be-step__form-row be-step__form-row--compact">
          {fieldsToShow.map((pf) => (
            <FormField
              key={pf.name}
              field={{
                name: pf.name,
                label: pf.label,
                type: pf.type || "select",
                options: prefFieldOptions[pf.name] || [],
                required: true,
              }}
              value={traveller[pf.name] || ""}
              error={errors[`travellers.${index}.${pf.name}`]}
              errorKey={`travellers.${index}.${pf.name}`}
              onChange={(name, val) => updateTraveller(index, name, val)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="be-step be-step--travellers">
      <h3 className="be-step__heading">Contact Information</h3>
      <div className="be-step__form-row">
        <FormField
          field={{ name: "name", label: "Full Name", type: "text", required: true }}
          value={contact.name}
          error={errors["contact.name"]}
          errorKey="contact.name"
          onChange={(name, val) => updateContact(name, val)}
        />
        <FormField
          field={{ name: "email", label: "Email", type: "email", required: true }}
          value={contact.email}
          error={errors["contact.email"]}
          errorKey="contact.email"
          onChange={(name, val) => updateContact(name, val)}
        />
        <FormField
          field={{ name: "phone", label: "Phone", type: "tel", required: true }}
          value={contact.phone}
          error={errors["contact.phone"]}
          errorKey="contact.phone"
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
                    {dynamicFields.map((field) => (
                      <FormField
                        key={field.name}
                        field={field}
                        value={traveller[field.name]}
                        error={errors[`travellers.${index}.${field.name}`]}
                        errorKey={`travellers.${index}.${field.name}`}
                        onChange={(name, val) => updateTraveller(index, name, val)}
                      />
                    ))}
                  </div>
                  {renderPreferences(traveller, index)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
