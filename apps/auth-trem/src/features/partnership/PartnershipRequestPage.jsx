import React from "react";
import { AuthHeader, Button, FileUploader } from "@packages/trem-ui";
import "./partnership-request.scss";

const initialForm = {
  agencyName: "", legalName: "", registrationNumber: "", gstNumber: "", panNumber: "", website: "",
  companyEmail: "", companyPhone: "", line1: "", line2: "", country: "India", state: "", city: "", postalCode: "",
  yearsInBusiness: "", numberOfEmployees: "", approximateCustomerBase: "", servicesOffered: "", notes: "",
  contactName: "", designation: "", contactEmail: "", contactMobile: "",
};

const field = (label, name, options = {}) => ({ label, name, ...options });
const agencyFields = [
  field("Agency name", "agencyName", { required: true }), field("Registered business name", "legalName"),
  field("Registration number", "registrationNumber"), field("GST number", "gstNumber"), field("PAN number", "panNumber"),
  field("Website", "website", { type: "url" }), field("Company email", "companyEmail", { type: "email", required: true }),
  field("Company phone", "companyPhone", { type: "tel" }), field("Address line 1", "line1"), field("Address line 2", "line2"),
  field("Country", "country"), field("State", "state"), field("City", "city"), field("Postal code", "postalCode"),
  field("Years in business", "yearsInBusiness", { type: "number", min: 0 }), field("Number of employees", "numberOfEmployees", { type: "number", min: 0 }),
  field("Approximate customer base", "approximateCustomerBase", { type: "number", min: 0 }), field("Services offered (comma separated)", "servicesOffered"),
];

export default function PartnershipRequestPage({ api, theme, onToggleTheme }) {
  const [form, setForm] = React.useState(initialForm);
  const [documents, setDocuments] = React.useState([]);
  const [logo, setLogo] = React.useState(null);
  const [state, setState] = React.useState({ loading: false, error: "", success: "" });

  const update = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: "", success: "" });
    const payload = {
      agencyName: form.agencyName, legalName: form.legalName, registrationNumber: form.registrationNumber,
      gstNumber: form.gstNumber, panNumber: form.panNumber, website: form.website, companyEmail: form.companyEmail,
      companyPhone: form.companyPhone, address: { line1: form.line1, line2: form.line2, country: form.country, state: form.state, city: form.city, postalCode: form.postalCode },
      yearsInBusiness: Number(form.yearsInBusiness) || 0, numberOfEmployees: Number(form.numberOfEmployees) || 0,
      approximateCustomerBase: Number(form.approximateCustomerBase) || 0,
      servicesOffered: form.servicesOffered.split(",").map((value) => value.trim()).filter(Boolean),
      notes: form.notes, primaryContact: { fullName: form.contactName, designation: form.designation, email: form.contactEmail, mobile: form.contactMobile },
    };
    const body = new FormData(); body.append("payload", JSON.stringify(payload)); documents.forEach((document) => body.append("documents", document)); if (logo) body.append("logo", logo);
    try {
      const response = await api.post("/tenancy/partnership-requests", body, { headers: { "Content-Type": "multipart/form-data" } });
      setForm(initialForm); setDocuments([]); setLogo(null);
      setState({ loading: false, error: "", success: `Request submitted. Reference: ${response.data?.componentData?.data?.requestId || "created"}` });
    } catch (error) {
      setState({ loading: false, success: "", error: error.response?.data?.message || "We could not submit your request. Please review the details and try again." });
    }
  };

  return <div className="partner-request-page">
    <AuthHeader config={{ brand: { name: process.env.REACT_APP_COMPANY_NAME || "TravelsTREM", tagline: "Tours · Reservations · Experiences · Management" } }} theme={theme} onToggleTheme={onToggleTheme} />
    <main className="partner-request-page__main">
      <header><span>Agency partnerships</span><h1>Grow with the TravelsTREM platform</h1><p>Tell us about your agency. Our partnership team will verify your business and help configure the right products and workspace.</p></header>
      <form onSubmit={submit} className="partner-request-page__form">
        <fieldset><legend>Agency information</legend><div className="partner-request-page__grid">
          {agencyFields.map(({ label, name, ...props }) => <label key={name}><span>{label}{props.required ? " *" : ""}</span><input name={name} value={form[name]} onChange={update} {...props} /></label>)}
        </div></fieldset>
        <fieldset><legend>Primary contact</legend><div className="partner-request-page__grid">
          {[field("Full name", "contactName", { required: true }), field("Designation", "designation"), field("Work email", "contactEmail", { type: "email", required: true }), field("Mobile number", "contactMobile", { type: "tel" })].map(({ label, name, ...props }) => <label key={name}><span>{label}{props.required ? " *" : ""}</span><input name={name} value={form[name]} onChange={update} {...props} /></label>)}
        </div></fieldset>
        <fieldset><legend>Branding and verification</legend><div className="partner-request-page__grid">
          <FileUploader variant="compact" label="Agency logo" description="JPG, PNG or WebP · up to 8 MB" accept=".jpg,.jpeg,.png,.webp" maxFileSize={8 * 1024 * 1024} value={logo} onChange={setLogo} selectionOnly autoUpload={false} />
          <FileUploader variant="compact" label="Verification documents" description="PDF, JPG, PNG or WebP · up to 8 files, 8 MB each" accept=".pdf,.jpg,.jpeg,.png,.webp" maxFileSize={8 * 1024 * 1024} maxFiles={8} multiple value={documents} onChange={setDocuments} selectionOnly autoUpload={false} />
        </div><label><span>Notes</span><textarea name="notes" value={form.notes} onChange={update} rows="4" /></label></fieldset>
        {state.error && <div className="partner-request-page__message partner-request-page__message--error" role="alert">{state.error}</div>}
        {state.success && <div className="partner-request-page__message partner-request-page__message--success" role="status">{state.success}</div>}
        <Button type="submit" text={state.loading ? "Submitting…" : "Submit partnership request"} disabled={state.loading} />
      </form>
    </main>
  </div>;
}
