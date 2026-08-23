import React from "react";
import { Button, Dropdown, InputField, Icon, Paragraph } from "@packages/trem-ui";
import MobileDateInput from "../../../../components/MobileDateInput.jsx";

function toItems(options, currentValue, onChange) {
  return options.map((opt) => {
    const val = typeof opt === "string" ? opt : opt.value;
    const label = typeof opt === "string" ? opt : opt.label;
    return {
      id: String(val),
      label,
      active: String(val) === String(currentValue),
      onClick: () => onChange(val),
    };
  });
}

function currentLabel(options, value, fallback) {
  if (!value) return fallback;
  const found = options.find((opt) => {
    const v = typeof opt === "string" ? opt : opt.value;
    return String(v) === String(value);
  });
  if (!found) return value;
  return typeof found === "string" ? found : found.label;
}

function SelectField({ options, value, onChange, placeholder, searchable }) {
  return (
    <Dropdown
      items={toItems(options, value, onChange)}
      variant={searchable ? "searchable" : "scrollable"}
      closeOnSelect
      hoverable={false}
      searchPlaceholder="Search..."
      trigger={({ open }) => (
        <Button primaryClassName="booking-page__select-trigger" variant="text">
          <span>{currentLabel(options, value, placeholder || "\u2014 Select \u2014")}</span>
          <Icon name="chevronDown" className={open ? "is-open" : ""} />
        </Button>
      )}
    />
  );
}

export default function BookingTravelerStepView({
  labels,
  options,
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
  const titles = options?.titles || [];
  const genders = options?.genders || [];
  const travellerTypes = options?.travellerTypes || [];
  const visaStatuses = options?.visaStatuses || [];
  const nationalities = options?.nationalities || [];
  const countries = options?.countries || [];
  const emergencyRelations = options?.emergencyRelations || [];
  const dietaryPrefs = options?.dietaryPreferences || [];
  const medicalOpts = options?.medicalConditions || [];

  const travelerFormSections = (traveler, index) => [
    {
      section: labels.sectionPersonal || "Personal Information",
      fields: [
        [
          {
            label: labels.travellerType || "Type",
            required: true,
            render: () => (
              <SelectField options={travellerTypes} value={traveler.travellerType} onChange={(v) => onTravelerChange(index, "travellerType", v)} placeholder={labels.selectOption} />
            ),
          },
          {
            label: labels.title || "Title",
            render: () => (
              <SelectField options={titles} value={traveler.title} onChange={(v) => onTravelerChange(index, "title", v)} placeholder={labels.selectOption} />
            ),
          },
        ],
        [
          {
            label: labels.firstName || "First name",
            required: true,
            error: fieldErrors[`travelers.${index}.firstName`],
            render: () => (
              <InputField variant="text" value={traveler.firstName} onChange={(v) => { onTravelerChange(index, "firstName", v); onClearError(`travelers.${index}.firstName`); }} placeholder={labels.firstName || "First name"} error={!!fieldErrors[`travelers.${index}.firstName`]} />
            ),
          },
          {
            label: labels.lastName || "Last name",
            required: true,
            error: fieldErrors[`travelers.${index}.lastName`],
            render: () => (
              <InputField variant="text" value={traveler.lastName} onChange={(v) => { onTravelerChange(index, "lastName", v); onClearError(`travelers.${index}.lastName`); }} placeholder={labels.lastName || "Last name"} error={!!fieldErrors[`travelers.${index}.lastName`]} />
            ),
          },
        ],
        [
          {
            label: labels.middleName || "Middle name",
            render: () => (
              <InputField variant="text" value={traveler.middleName} onChange={(v) => onTravelerChange(index, "middleName", v)} placeholder={labels.middleName || "Middle name"} />
            ),
          },
          {
            label: labels.gender || "Gender",
            required: true,
            error: fieldErrors[`travelers.${index}.gender`],
            render: () => (
              <SelectField options={genders} value={traveler.gender} onChange={(v) => { onTravelerChange(index, "gender", v); onClearError(`travelers.${index}.gender`); }} placeholder={labels.selectOption} />
            ),
          },
        ],
        [
          {
            label: labels.dob || "Date of birth",
            render: () => (
              <MobileDateInput value={traveler.dob} onChange={(v) => onTravelerChange(index, "dob", v)} />
            ),
          },
          {
            label: labels.age || "Age",
            required: true,
            error: fieldErrors[`travelers.${index}.age`],
            render: () => (
              <InputField variant="number" value={traveler.age} onChange={(v) => { onTravelerChange(index, "age", v); onClearError(`travelers.${index}.age`); }} placeholder={labels.age || "Age"} error={!!fieldErrors[`travelers.${index}.age`]} maxLength={3} />
            ),
          },
        ],
        [
          {
            label: labels.nationality || "Nationality",
            required: true,
            error: fieldErrors[`travelers.${index}.nationality`],
            colSpan: 2,
            render: () => (
              <SelectField searchable options={nationalities} value={traveler.nationality} onChange={(v) => { onTravelerChange(index, "nationality", v); onClearError(`travelers.${index}.nationality`); }} placeholder={labels.selectOption} />
            ),
          },
        ],
      ],
    },
    {
      section: labels.sectionContact || "Contact Details",
      fields: [
        [
          {
            label: labels.email || "Email address",
            required: true,
            error: fieldErrors[`travelers.${index}.email`],
            render: () => (
              <InputField variant="email" value={traveler.email} onChange={(v) => { onTravelerChange(index, "email", v); onClearError(`travelers.${index}.email`); }} placeholder={labels.email || "Email address"} error={!!fieldErrors[`travelers.${index}.email`]} />
            ),
          },
          {
            label: labels.phone || "Phone number",
            required: true,
            error: fieldErrors[`travelers.${index}.phone`],
            render: () => (
              <InputField variant="tel" value={traveler.phone} onChange={(v) => { onTravelerChange(index, "phone", v); onClearError(`travelers.${index}.phone`); }} error={!!fieldErrors[`travelers.${index}.phone`]} maxLength={10} />
            ),
          },
        ],
        [
          {
            label: labels.countryOfResidence || "Country of residence",
            colSpan: 2,
            render: () => (
              <SelectField searchable options={countries} value={traveler.countryOfResidence} onChange={(v) => onTravelerChange(index, "countryOfResidence", v)} placeholder={labels.selectOption} />
            ),
          },
        ],
      ],
    },
    {
      section: labels.sectionPassport || "Passport & Identity",
      fields: [
        [
          {
            label: labels.passport || "Passport / National ID number",
            required: true,
            error: fieldErrors[`travelers.${index}.passport`],
            render: () => (
              <InputField variant="text" value={traveler.passport} onChange={(v) => { onTravelerChange(index, "passport", v); onClearError(`travelers.${index}.passport`); }} placeholder={labels.passport || "Passport / National ID number"} error={!!fieldErrors[`travelers.${index}.passport`]} />
            ),
          },
          {
            label: labels.passportIssueCountry || "Issuing country",
            render: () => (
              <SelectField searchable options={countries} value={traveler.passportIssueCountry} onChange={(v) => onTravelerChange(index, "passportIssueCountry", v)} placeholder={labels.selectOption} />
            ),
          },
        ],
        [
          {
            label: labels.passportExpiryDate || "Expiry date",
            required: true,
            error: fieldErrors[`travelers.${index}.passportExpiryDate`],
            render: () => (
              <InputField variant="monthYear" value={traveler.passportExpiryDate} onChange={(v) => { onTravelerChange(index, "passportExpiryDate", v); onClearError(`travelers.${index}.passportExpiryDate`); }} error={!!fieldErrors[`travelers.${index}.passportExpiryDate`]} placeholder="MM/YY" />
            ),
          },
          {
            label: labels.visaStatus || "Visa status",
            render: () => (
              <SelectField options={visaStatuses} value={traveler.visaStatus} onChange={(v) => onTravelerChange(index, "visaStatus", v)} placeholder={labels.selectOption} />
            ),
          },
        ],
      ],
    },
    {
      section: labels.sectionEmergency || "Emergency Contact",
      fields: [
        [
          {
            label: labels.emergencyContactName || "Full name",
            required: true,
            error: fieldErrors[`travelers.${index}.emergencyContactName`],
            render: () => (
              <InputField variant="text" value={traveler.emergencyContactName} onChange={(v) => { onTravelerChange(index, "emergencyContactName", v); onClearError(`travelers.${index}.emergencyContactName`); }} placeholder={labels.emergencyContactName || "Full name"} error={!!fieldErrors[`travelers.${index}.emergencyContactName`]} />
            ),
          },
          {
            label: labels.emergencyContactRelation || "Relation",
            render: () => (
              <SelectField searchable options={emergencyRelations} value={traveler.emergencyContactRelation} onChange={(v) => onTravelerChange(index, "emergencyContactRelation", v)} placeholder={labels.selectOption} />
            ),
          },
        ],
        [
          {
            label: labels.emergencyContactNumber || "Phone number",
            required: true,
            error: fieldErrors[`travelers.${index}.emergencyContactNumber`],
            colSpan: 2,
            render: () => (
              <InputField variant="tel" value={traveler.emergencyContactNumber} onChange={(v) => { onTravelerChange(index, "emergencyContactNumber", v); onClearError(`travelers.${index}.emergencyContactNumber`); }} error={!!fieldErrors[`travelers.${index}.emergencyContactNumber`]} maxLength={10} />
            ),
          },
        ],
      ],
    },
    {
      section: labels.sectionAdditional || "Additional Information",
      fields: [
        [
          {
            label: labels.dietaryPreferences || "Dietary requirements",
            render: () => (
              <SelectField searchable options={dietaryPrefs} value={traveler.dietaryPreferences} onChange={(v) => onTravelerChange(index, "dietaryPreferences", v)} placeholder={labels.selectOption} />
            ),
          },
          {
            label: labels.medicalConditions || "Medical conditions",
            render: () => (
              <SelectField searchable options={medicalOpts} value={traveler.medicalConditions} onChange={(v) => onTravelerChange(index, "medicalConditions", v)} placeholder={labels.selectOption} />
            ),
          },
        ],
        [
          {
            label: labels.wheelchairRequired || "Wheelchair assistance needed",
            render: () => (
              <div className="booking-page__checkbox-row">
                <input type="checkbox" id={`wheelchair-${index}`} checked={traveler.wheelchairRequired} onChange={(e) => onTravelerChange(index, "wheelchairRequired", e.target.checked)} />
                <label htmlFor={`wheelchair-${index}`}>{labels.yes || "Yes"}</label>
              </div>
            ),
          },
        ],
      ],
    },
  ];

  return (
    <div className="booking-page__card-body">
      <Paragraph primaryClassname="booking-page__hint" text={labels.travelerHint || "Please provide details for each traveler."} />

      <div className="booking-page__section-title" style={{ marginTop: 0 }}>
        {labels.sectionContact || "Contact Details"}
      </div>
      <div className="booking-page__form-row">
        <div className="booking-page__form-group">
          <label>{labels.contactEmail || "Contact Email"} <span className="booking-page__required">*</span></label>
          <InputField variant="email" value={contactEmail} onChange={(v) => { onContactEmailChange(v); onClearError("contactEmail"); }} error={!!fieldErrors.contactEmail} />
          {fieldErrors.contactEmail && <div className="booking-page__field-error">{fieldErrors.contactEmail}</div>}
        </div>
        <div className="booking-page__form-group">
          <label>{labels.contactPhone || "Contact Phone"} <span className="booking-page__required">*</span></label>
          <InputField variant="tel" value={contactPhone} onChange={(v) => { onContactPhoneChange(v); onClearError("contactPhone"); }} error={!!fieldErrors.contactPhone} maxLength={10} />
          {fieldErrors.contactPhone && <div className="booking-page__field-error">{fieldErrors.contactPhone}</div>}
        </div>
      </div>

      <div className="booking-page__section-title">{labels.guests || "Number of Travelers"}</div>
      <div className="booking-page__guest-row" style={{ marginBottom: "1rem" }}>
        <div className="booking-page__qty-group">
          <Button primaryClassName="booking-page__qty-btn" variant="text" onClick={() => onGuestsChange(Math.max(1, Number(guests) - 1))} disabled={Number(guests) <= 1} aria-label="Decrease travelers"><Icon name="minus" size={16} /></Button>
          <span className="booking-page__qty-num">{guests}</span>
          <Button primaryClassName="booking-page__qty-btn" variant="text" onClick={() => onGuestsChange(Number(guests) + 1)} disabled={maxGuests && Number(guests) >= maxGuests} aria-label="Increase travelers"><Icon name="plus" size={16} /></Button>
        </div>
      </div>

      <div className="booking-page__traveler-list">
        {travelers.map((traveler, index) => (
          <div key={index} className="booking-page__traveler-card">
            <div className="booking-page__traveler-head">
              <strong>{(labels.travelerTitle || "Traveler {number}").replace("{number}", String(index + 1))}</strong>
              <span>{traveler.firstName || traveler.lastName ? `${traveler.firstName || ""} ${traveler.lastName || ""}`.trim() : "New traveler"}</span>
            </div>
            <div className="booking-page__traveler-body">
              {travelerFormSections(traveler, index).map((section, si) => (
                <React.Fragment key={si}>
                  <div className="booking-page__section-title">{section.section}</div>
                  {section.fields.map((row, ri) => {
                    if (!row || row.every((f) => !f)) return null;
                    const cols = row.filter(Boolean).length;
                    return (
                      <div className="booking-page__form-row" key={ri}>
                        {row.map((field, fi) => {
                          if (!field) return <div key={fi} />;
                          return (
                            <div className="booking-page__form-group" key={fi} style={field.colSpan === 2 ? { gridColumn: "1 / -1" } : undefined}>
                              <label>{field.label}{field.required && <span className="booking-page__required"> *</span>}</label>
                              {field.render()}
                              {field.error && <div className="booking-page__field-error">{field.error}</div>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
