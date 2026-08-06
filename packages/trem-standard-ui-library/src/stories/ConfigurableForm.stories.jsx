import React, { useState } from "react";
import { ConfigurableForm } from "@packages/trem-ui";

const DEFAULT_VALUES = {
  contactEmail: "",
  contactPhone: "",
  guests: 2,
};

const DEFAULT_ERRORS = {};

const FieldOptions = {
  titles: ["Mr", "Ms", "Mrs", "Mx", "Dr"],
  genders: [
    { value: "", label: "Select gender" },
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "prefer_not_say", label: "Prefer not to say" },
  ],
  travellerTypes: [
    { value: "adult", label: "Adult (12+ years)" },
    { value: "child", label: "Child (2\u201311 years)" },
    { value: "infant", label: "Infant (0\u201323 months)" },
  ],
  visaStatuses: [
    { value: "", label: "Select visa status" },
    { value: "not_required", label: "Not required" },
    { value: "required", label: "Required" },
    { value: "applied", label: "Applied / In process" },
    { value: "approved", label: "Approved / Granted" },
  ],
  nationalities: ["Indian", "American", "British", "Canadian", "Australian", "Singaporean", "German", "French", "Japanese", "Brazilian", "South African", "Emirati", "Dutch", "Swiss", "Swedish", "Italian"],
  countries: ["India", "United States", "United Kingdom", "Canada", "Australia", "Singapore", "Germany", "France", "Japan", "Brazil", "South Africa", "United Arab Emirates", "Netherlands", "Switzerland", "Sweden", "Italy"],
  emergencyRelations: [
    { value: "", label: "Select relation" },
    { value: "spouse", label: "Spouse / Partner" },
    { value: "parent", label: "Parent" },
    { value: "sibling", label: "Sibling" },
    { value: "friend", label: "Friend" },
    { value: "guardian", label: "Guardian" },
    { value: "other", label: "Other" },
  ],
  dietaryPreferences: [
    { value: "", label: "None / Standard" },
    { value: "vegetarian", label: "Vegetarian" },
    { value: "vegan", label: "Vegan" },
    { value: "halal", label: "Halal" },
    { value: "kosher", label: "Kosher" },
    { value: "gluten_free", label: "Gluten-free" },
    { value: "lactose_free", label: "Lactose-free" },
  ],
  medicalConditions: [
    { value: "", label: "None" },
    { value: "asthma", label: "Asthma / Respiratory" },
    { value: "diabetes", label: "Diabetes" },
    { value: "heart", label: "Heart condition" },
    { value: "mobility", label: "Mobility issues" },
    { value: "allergies", label: "Severe allergies" },
  ],
};

export const travellerSections = [
  {
    id: "personal",
    title: "Personal Information",
    icon: "user",
    collapsible: true,
    defaultExpanded: true,
    fields: [
      { name: "travellerType", type: "select", label: "Type", options: FieldOptions.travellerTypes, required: true },
      { name: "title", type: "select", label: "Title", options: FieldOptions.titles },
      { name: "firstName", type: "text", label: "First name", placeholder: "First name", required: true, minLength: 2 },
      { name: "lastName", type: "text", label: "Last name", placeholder: "Last name", required: true },
      { name: "middleName", type: "text", label: "Middle name", placeholder: "Middle name" },
      { name: "gender", type: "select", label: "Gender", options: FieldOptions.genders, required: true },
      { name: "dob", type: "date", label: "Date of birth", mode: "birthdate", placeholder: "Select DOB" },
      { name: "age", type: "number", label: "Age", placeholder: "Age", required: true, min: 1, max: 120, maxLength: 3 },
      { name: "nationality", type: "select", label: "Nationality", options: FieldOptions.nationalities, required: true, colSpan: 2, searchable: true },
    ],
  },
  {
    id: "contact",
    title: "Contact Details",
    icon: "mail",
    collapsible: true,
    defaultExpanded: true,
    fields: [
      { name: "email", type: "email", label: "Email address", placeholder: "you@example.com", required: true },
      { name: "phone", type: "tel", label: "Phone number", placeholder: "Phone number", required: true, maxLength: 10 },
      { name: "countryOfResidence", type: "select", label: "Country of residence", options: FieldOptions.countries, colSpan: 2, searchable: true },
    ],
  },
  {
    id: "passport",
    title: "Passport & Identity",
    icon: "fileText",
    collapsible: true,
    defaultExpanded: true,
    fields: [
      { name: "passport", type: "text", label: "Passport / National ID number", placeholder: "Passport / ID", required: true, minLength: 5, maxLength: 20, pattern: "^[A-Za-z0-9]{5,20}$" },
      { name: "passportIssueCountry", type: "select", label: "Issuing country", options: FieldOptions.countries, searchable: true },
      { name: "passportExpiryDate", type: "monthYear", label: "Expiry date", placeholder: "MM/YY", required: true },
      { name: "visaStatus", type: "select", label: "Visa status", options: FieldOptions.visaStatuses },
    ],
  },
  {
    id: "emergency",
    title: "Emergency Contact",
    icon: "phone",
    collapsible: true,
    defaultExpanded: true,
    fields: [
      { name: "emergencyContactName", type: "text", label: "Full name", placeholder: "Full name", required: true },
      { name: "emergencyContactRelation", type: "select", label: "Relation", options: FieldOptions.emergencyRelations, searchable: true },
      { name: "emergencyContactNumber", type: "tel", label: "Phone number", placeholder: "Phone number", required: true, colSpan: 2, maxLength: 10 },
    ],
  },
  {
    id: "additional",
    title: "Additional Information",
    icon: "settings",
    collapsible: true,
    defaultExpanded: true,
    fields: [
      { name: "dietaryPreferences", type: "select", label: "Dietary requirements", options: FieldOptions.dietaryPreferences, searchable: true },
      { name: "medicalConditions", type: "select", label: "Medical conditions", options: FieldOptions.medicalConditions, searchable: true },
      { name: "wheelchairRequired", type: "switch", label: "Wheelchair assistance needed", switchLabel: "Yes, wheelchair assistance is required" },
    ],
  },
];

export const travellerConfig = {
  layout: {
    columns: 2,
    expandable: true,
    defaultExpanded: true,
    showExpandAll: true,
    expandAllLabel: "Expand all",
    collapseAllLabel: "Collapse all",
  },
  sections: travellerSections,
};

const ControlledDemo = ({ config, values: initialValues, errors = {} }) => {
  const [values, setValues] = useState(initialValues || DEFAULT_VALUES);
  const [openSections, setOpenSections] = useState({});
  return (
    <div style={{ maxWidth: 720, width: "100%" }}>
      <ConfigurableForm
        config={config}
        values={values}
        errors={errors}
        openSections={openSections}
        onOpenSectionsChange={setOpenSections}
        onChange={(name, value) => setValues((prev) => ({ ...prev, [name]: value }))}
      />
      <pre
        style={{
          marginTop: "1rem",
          padding: "0.75rem",
          background: "#f6f7f9",
          borderRadius: 8,
          fontSize: "0.72rem",
          overflow: "auto",
          color: "#1f2937",
        }}
      >
        {JSON.stringify(values, null, 2)}
      </pre>
    </div>
  );
};

export default {
  title: "Trem UI/Forms/ConfigurableForm",
  component: ConfigurableForm,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    "layout.expandable": { control: "boolean", description: "Allow sections to be collapsed/expanded" },
    "layout.defaultExpanded": { control: "boolean", description: "Default open state of collapsible sections" },
    "layout.showExpandAll": { control: "boolean", description: "Show Expand all / Collapse all toolbar" },
    "layout.columns": { control: { type: "number", min: 1, max: 4, step: 1 }, description: "Number of grid columns" },
  },
};

export const TravellerDetails = {
  args: {
    config: travellerConfig,
    values: DEFAULT_VALUES,
    errors: DEFAULT_ERRORS,
  },
  render: (args) => <ControlledDemo {...args} />,
};

export const CollapsedByDefault = {
  args: {
    config: {
      ...travellerConfig,
      layout: { ...travellerConfig.layout, defaultExpanded: false, expandAllLabel: "Expand all sections", collapseAllLabel: "Collapse all sections" },
    },
    values: DEFAULT_VALUES,
    errors: DEFAULT_ERRORS,
  },
  render: (args) => <ControlledDemo {...args} />,
};

const allFieldTypesConfig = {
  layout: { columns: 2, expandable: true, defaultExpanded: true },
  sections: [
    {
      id: "all-types",
      title: "Every field type",
      collapsible: true,
      defaultExpanded: true,
      fields: [
        { name: "textField", type: "text", label: "Text", placeholder: "Free text" },
        { name: "emailField", type: "email", label: "Email", placeholder: "you@example.com" },
        { name: "numberField", type: "number", label: "Number", placeholder: "0", min: 0, max: 999 },
        { name: "telField", type: "tel", label: "Telephone", placeholder: "Phone", maxLength: 10 },
        { name: "monthYearField", type: "monthYear", label: "Month / Year", placeholder: "MM/YY" },
        { name: "dateField", type: "date", label: "Date", placeholder: "Select date" },
        { name: "selectField", type: "select", label: "Dropdown", options: FieldOptions.titles, placeholder: "Choose one" },
        { name: "searchableField", type: "select", label: "Searchable dropdown", options: FieldOptions.countries, searchable: true, placeholder: "Search..." },
        { name: "passwordField", type: "password", label: "Password", placeholder: "••••••" },
        { name: "textareaField", type: "textarea", label: "Textarea", placeholder: "Long text", rows: 3 },
        { name: "radioField", type: "radio", label: "Radio group", options: [
          { value: "a", label: "Option A" },
          { value: "b", label: "Option B" },
          { value: "c", label: "Option C" },
        ] },
        { name: "checkboxField", type: "checkbox", label: "Checkbox", checkboxLabel: "I agree to the terms" },
        { name: "switchField", type: "switch", label: "Toggle switch", switchLabel: "Enable notifications" },
        { name: "counterField", type: "counter", label: "Counter", min: 1, max: 10, colSpan: 2 },
      ],
    },
  ],
};

export const AllFieldTypes = {
  args: {
    config: allFieldTypesConfig,
    values: {},
    errors: {},
  },
  render: (args) => <ControlledDemo {...args} />,
};

export const Playground = {
  args: {
    config: travellerConfig,
    values: { ...DEFAULT_VALUES },
    errors: { firstName: "First name is required", contactEmail: "Contact email is required" },
  },
  render: (args) => {
    const { config, ...rest } = args;
    const layout = config.layout || {};
    return (
      <ControlledDemo
        config={{ ...config, layout: { ...layout, expandable: layout.expandable ?? true, defaultExpanded: layout.defaultExpanded ?? true, showExpandAll: layout.showExpandAll ?? false, columns: layout.columns ?? 2 } }}
        {...rest}
      />
    );
  },
};
