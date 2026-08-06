import React, { useState, useEffect, useMemo } from "react";
import { ConfigurableForm } from "@packages/trem-ui";
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

function toFormField(field) {
  const base = {
    name: field.name,
    label: field.label,
    required: field.required,
    disabled: field.disabled || field.readOnly,
    placeholder: field.placeholder,
    maxLength: field.maxLength,
    width: field.width,
    wide: field.wide,
    colSpan: field.colSpan,
  };
  if (field.type === "date") {
    return {
      ...base,
      type: "date",
      mode: field.datePickerMode || "calendar",
      minDate: field.min,
      maxDate: field.max,
    };
  }
  return {
    ...base,
    type: field.type || "text",
    options: field.options,
  };
}

function buildStaticConfig(sections, columns = 2, columnsMobile = 3) {
  return {
    layout: { columns, columnsMobile, expandable: false },
    sections,
  };
}

function prefixedErrors(errors, prefix) {
  const scoped = {};
  Object.keys(errors).forEach((key) => {
    if (key.startsWith(prefix)) scoped[key.slice(prefix.length)] = errors[key];
  });
  return scoped;
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
  const prefFieldOptions = useMemo(() => {
    const options = {};
    if (TRAVELLER_PREFERENCE_FIELDS) {
      TRAVELLER_PREFERENCE_FIELDS.forEach((pf) => {
        options[pf.name] = buildPrefOptions(prefs[pf.optionsKey] || []);
      });
    }
    return options;
  }, [TRAVELLER_PREFERENCE_FIELDS, prefs]);

  const contactConfig = useMemo(() => buildStaticConfig([
    {
      id: "contact",
      fields: [
        { name: "name", label: "Full Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel", required: true },
      ],
    },
  ], 3, 1), []);

  const contactErrors = useMemo(() => prefixedErrors(errors, "contact."), [errors]);

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

  const preferenceFields = (TRAVELLER_PREFERENCE_FIELDS || [])
    .filter((pf) => (prefFieldOptions[pf.name] || []).length > 0)
    .map((pf) => ({
      name: pf.name,
      label: pf.label,
      type: "select",
      options: prefFieldOptions[pf.name] || [],
      required: true,
    }));

  const travellerConfigs = useMemo(() => {
    const detailsFields = getDynamicFields().map(toFormField);
    const sections = [{ id: "details", fields: detailsFields }];
    if (preferenceFields.length) {
      sections.push({ id: "preferences", title: "Preferences", fields: preferenceFields });
    }
    return buildStaticConfig(sections, 2, 1);
  }, [TRAVELLER_FIELDS, isInternational, prefFieldOptions]);

  return (
    <div className="be-step be-step--travellers">
      <h3 className="be-step__heading">Contact Information</h3>
      <div className="be-step__form-row">
        <ConfigurableForm
          config={contactConfig}
          values={contact}
          errors={contactErrors}
          onChange={updateContact}
        />
      </div>

      <h3 className="be-step__heading">Traveller Details</h3>
      <div className="be-travellers">
        {travellers.map((traveller, index) => {
          const isExpanded = expandedTraveller === index;
          const hasErrors = Object.keys(errors).some((k) => k.startsWith(`travellers.${index}.`));
          const travellerErrors = prefixedErrors(errors, `travellers.${index}.`);
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
                  <ConfigurableForm
                    config={travellerConfigs}
                    values={traveller}
                    errors={travellerErrors}
                    onChange={(name, val) => updateTraveller(index, name, val)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
