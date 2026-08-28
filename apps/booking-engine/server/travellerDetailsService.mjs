import { validateFormFields } from "@packages/trem-form-engine";

const countries = ["India", "United States", "United Kingdom", "Canada", "Australia", "Singapore", "United Arab Emirates", "Other"]
  .map((value) => ({ value, label: value }));
const genders = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_say", label: "Prefer not to say" },
];

const field = (name, type, label, extra = {}) => ({ name, path: name, type, label, ...extra });

export const buildTravellerDetailsForm = ({ count = 1, requiresPassport = false, saved = null } = {}) => {
  const travellerCount = Math.max(1, Math.min(50, Number(count) || 1));
  const sections = Array.from({ length: travellerCount }, (_, index) => {
    const prefix = `traveller_${index}`;
    return {
      id: prefix,
      title: `Traveller ${index + 1}${index === 0 ? " · Primary traveller" : ""}`,
      description: requiresPassport
        ? "Enter names exactly as they appear on the passport used for flights."
        : "Enter the traveller's identity details for reservations and vouchers.",
      collapsible: true,
      defaultExpanded: index === 0,
      fields: [
        field(`${prefix}_type`, "select", "Traveller type", { required: true, options: [
          { value: "adult", label: "Adult" }, { value: "child", label: "Child" }, { value: "infant", label: "Infant" },
        ] }),
        field(`${prefix}_firstName`, "text", "First name", { required: true, minLength: 2, maxLength: 80 }),
        field(`${prefix}_lastName`, "text", "Last name", { required: true, minLength: 1, maxLength: 80 }),
        field(`${prefix}_dob`, "date", "Date of birth", { required: true, mode: "birthdate" }),
        field(`${prefix}_gender`, "select", "Gender", { required: true, options: genders }),
        field(`${prefix}_nationality`, "select", "Nationality", { required: true, options: countries }),
        ...(requiresPassport ? [
          field(`${prefix}_passportNumber`, "text", "Passport number", { required: true, minLength: 5, maxLength: 20, pattern: "^[A-Za-z0-9]{5,20}$" }),
          field(`${prefix}_passportExpiry`, "date", "Passport expiry", { required: true, minDate: "today" }),
          field(`${prefix}_passportCountry`, "select", "Passport issuing country", { required: true, options: countries }),
        ] : []),
      ],
    };
  });
  return {
    title: "Traveller details",
    description: requiresPassport
      ? "Flight details are included in this quotation, so passport information is required for every traveller."
      : "Add the names and identity details needed for confirmed reservations.",
    config: {
      layout: { columns: 2, columnsMobile: 1, expandable: true, defaultExpanded: false, showExpandAll: true },
      sections,
    },
    values: saved?.values || {},
    completedAt: saved?.completedAt || null,
    requiresPassport,
  };
};

export const validateTravellerDetails = ({ count, requiresPassport, values }) => {
  const form = buildTravellerDetailsForm({ count, requiresPassport });
  const fields = form.config.sections.flatMap((section) => section.fields);
  const result = validateFormFields(fields, values || {});
  Array.from({ length: Math.max(1, Number(count) || 1) }, (_, index) => index).forEach((index) => {
    const path = `traveller_${index}_dob`;
    const dob = result.data[path] ? new Date(`${result.data[path]}T00:00:00.000Z`) : null;
    if (dob && (!Number.isFinite(dob.getTime()) || dob >= new Date())) result.errors[path] = "Date of birth must be in the past";
  });
  return { ...result, valid: Object.keys(result.errors).length === 0 };
};
