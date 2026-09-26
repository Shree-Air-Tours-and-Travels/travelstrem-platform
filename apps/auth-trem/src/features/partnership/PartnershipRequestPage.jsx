import React from "react";
import {
  AuthHeader, Button, FileUploader, InputField, Spinner, StatusBadge, TextArea,
  WizardFormShell, WizardValidationSummary,
} from "@packages/trem-ui";
import "./partnership-request.scss";

const STORAGE_KEY = "travelstrem.partnership.activation";
const EMPTY_FORM = {
  agencyName: "", legalName: "", registrationNumber: "", gstNumber: "", panNumber: "",
  website: "", companyEmail: "", companyPhone: "",
  address: { line1: "", line2: "", country: "India", state: "", city: "", postalCode: "" },
  yearsInBusiness: "", numberOfEmployees: "", approximateCustomerBase: "",
  servicesOfferedText: "", notes: "",
  primaryContact: { fullName: "", designation: "", email: "", mobile: "" },
};
const unwrap = (response) => response?.data?.componentData?.data ?? response?.data?.data ?? response?.data;
const responseFieldErrors = (error) =>
  error?.response?.data?.componentData?.data?.errors || error?.response?.data?.data?.errors || {};
const getValue = (source, path) => path.split(".").reduce((value, key) => value?.[key], source);
const setValue = (source, path, value) => {
  const next = structuredClone(source);
  const keys = path.split(".");
  let target = next;
  keys.slice(0, -1).forEach((key) => { target[key] ||= {}; target = target[key]; });
  target[keys.at(-1)] = value;
  return next;
};
const storage = {
  read: () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; } },
  write: (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)),
  clear: () => localStorage.removeItem(STORAGE_KEY),
};

const validateWidgets = (widgets, form, documents) => {
  const errors = {};
  widgets.forEach((widget) => {
    if (["review", "logo"].includes(widget.type)) return;
    const value = widget.type === "documents" ? documents : getValue(form, widget.path);
    if (widget.required && (!value || (Array.isArray(value) && !value.length))) {
      errors[widget.path] = `${widget.label} is required.`;
      return;
    }
    if (!value) return;
    if (widget.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[widget.path] = "Enter a valid email address.";
    if (widget.type === "url" && !/^https?:\/\//i.test(value)) errors[widget.path] = "Enter a complete URL beginning with http:// or https://.";
    if (widget.pattern && !new RegExp(widget.pattern).test(value)) errors[widget.path] = widget.patternMessage || `Enter a valid ${widget.label.toLowerCase()}.`;
    if (widget.type === "number" && Number(value) < Number(widget.min || 0)) errors[widget.path] = `${widget.label} must be at least ${widget.min || 0}.`;
  });
  return errors;
};

function ReviewSummary({ form, documents, logo }) {
  const groups = [
    { title: "Agency", rows: [["Trading name", form.agencyName], ["Legal name", form.legalName], ["Company email", form.companyEmail], ["Company phone", form.companyPhone], ["Website", form.website || "Not provided"]] },
    { title: "Registration", rows: [["Registration", form.registrationNumber], ["GST", form.gstNumber], ["PAN", form.panNumber], ["Registered address", [form.address.line1, form.address.city, form.address.state, form.address.postalCode, form.address.country].filter(Boolean).join(", ")]] },
    { title: "Activation contact", rows: [["Name", form.primaryContact.fullName], ["Designation", form.primaryContact.designation], ["Work email", form.primaryContact.email], ["Mobile", form.primaryContact.mobile]] },
    { title: "Verification", rows: [["Agency logo", logo ? logo.name : "Not provided"], ["Documents", `${documents.length} selected`], ["Services", form.servicesOfferedText]] },
  ];
  return <div className="partner-request-page__review">{groups.map((group) => <section key={group.title}><h3>{group.title}</h3><dl>{group.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl></section>)}</div>;
}

function PartnershipWidget({ widget, form, setForm, errors, setErrors, documents, setDocuments, logo, setLogo }) {
  if (widget.type === "review") return <ReviewSummary form={form} documents={documents} logo={logo} />;
  if (widget.type === "logo") return <FileUploader variant="compact" label={widget.label} description="JPG, PNG or WebP · up to 8 MB" accept={widget.accept} maxFileSize={8 * 1024 * 1024} value={logo} onChange={setLogo} selectionOnly autoUpload={false} />;
  if (widget.type === "documents") return <FileUploader variant="compact" label={widget.label} description="PDF or image · up to 8 files, 8 MB each" accept={widget.accept} maxFileSize={8 * 1024 * 1024} maxFiles={widget.maxFiles} multiple value={documents} onChange={setDocuments} selectionOnly autoUpload={false} />;
  const common = { label: widget.label, value: getValue(form, widget.path) ?? "", required: widget.required, placeholder: widget.placeholder, error: errors[widget.path], maxLength: widget.maxLength, className: widget.fullWidth ? "is-full" : "", onChange: (value) => { setForm((current) => setValue(current, widget.path, value)); setErrors((current) => { if (!current[widget.path]) return current; const next = { ...current }; delete next[widget.path]; return next; }); } };
  if (widget.type === "textarea") return <TextArea {...common} rows={5} />;
  return <InputField {...common} variant={widget.type} min={widget.min} max={widget.max} />;
}

function SubmissionReceipt({ receipt, onStartAgain }) {
  return <main className="partner-request-page__receipt" role="status">
    <div className="partner-request-page__receipt-mark">✓</div>
    <StatusBadge value="Submitted for review" tone="success" />
    <h1>Your partnership application is with our activation team</h1>
    <p>We sent a receipt to <strong>{receipt.email}</strong>. If approved, the Partner Admin activation invitation will arrive by email.</p>
    <section>
      <div><span>Agency</span><strong>{receipt.agencyName}</strong></div>
      <div><span>Application reference</span><strong>{receipt.requestId}</strong></div>
      <div><span>Submitted</span><strong>{new Date(receipt.submittedAt).toLocaleString()}</strong></div>
      <div><span>Current stage</span><strong>Governance review</strong></div>
    </section>
    <div className="partner-request-page__receipt-actions"><Button text="Back to TravelsTREM sign in" onClick={() => window.location.assign("/")} /><Button text="Start another application" variant="outline" onClick={onStartAgain} /></div>
    <small>Do not submit another application for the same business while this request is active.</small>
  </main>;
}

export default function PartnershipRequestPage({ api, theme, onToggleTheme }) {
  const [workflow, setWorkflow] = React.useState(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [documents, setDocuments] = React.useState([]);
  const [logo, setLogo] = React.useState(null);
  const [draft, setDraft] = React.useState(null);
  const [activeStep, setActiveStep] = React.useState("business");
  const [completed, setCompleted] = React.useState([]);
  const [errors, setErrors] = React.useState({});
  const [state, setState] = React.useState({ loading: true, saving: false, error: "", savedAt: null });
  const [receipt, setReceipt] = React.useState(() => storage.read()?.receipt || null);

  React.useEffect(() => {
    let live = true;
    (async () => {
      try {
        const definition = unwrap(await api.get("/tenancy/partnership-workflow"));
        if (!live) return;
        setWorkflow(definition);
        const saved = storage.read();
        if (saved?.requestId && saved?.resumeToken && !saved.receipt) {
          try {
            const record = unwrap(await api.get(`/tenancy/partnership-requests/drafts/${saved.requestId}`, { headers: { "x-partnership-resume-token": saved.resumeToken } }));
            if (!live) return;
            setDraft(saved);
            setForm((current) => ({ ...current, ...record, servicesOfferedText: (record.servicesOffered || []).join(", ") }));
            setActiveStep(record.currentStep || "business");
            setCompleted(record.completedSteps || []);
          } catch { storage.clear(); }
        }
        setState((current) => ({ ...current, loading: false }));
      } catch (error) {
        if (live) setState({ loading: false, saving: false, savedAt: null, error: error.response?.data?.message || "The partnership workflow is temporarily unavailable." });
      }
    })();
    return () => { live = false; };
  }, [api]);

  const ensureDraft = async () => {
    if (draft) return draft;
    const created = unwrap(await api.post("/tenancy/partnership-requests/drafts"));
    const next = { requestId: created.requestId, resumeToken: created.resumeToken };
    setDraft(next); storage.write(next); return next;
  };
  const saveStep = async (nextStep) => {
    const current = workflow.steps.find((step) => step.id === activeStep);
    const nextErrors = validateWidgets(current.widgets, form, documents);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setState((value) => ({ ...value, error: "" }));
      return;
    }
    setState((value) => ({ ...value, saving: true, error: "" }));
    try {
      const identity = await ensureDraft();
      const done = [...new Set([...completed, activeStep])];
      const response = unwrap(await api.patch(`/tenancy/partnership-requests/drafts/${identity.requestId}`, { payload: form, nodeId: activeStep }, { headers: { "x-partnership-resume-token": identity.resumeToken } }));
      setCompleted(response.completedSteps || done); setActiveStep(response.currentStep || nextStep);
      setState({ loading: false, saving: false, error: "", savedAt: response.savedAt });
    } catch (error) {
      const serverErrors = responseFieldErrors(error);
      if (Object.keys(serverErrors).length) setErrors((current) => ({ ...current, ...serverErrors }));
      setState((value) => ({
        ...value,
        saving: false,
        error: Object.keys(serverErrors).length
          ? ""
          : error.response?.data?.message || "Your progress could not be saved.",
      }));
    }
  };
  const submit = async () => {
    const nextErrors = workflow.steps.reduce((all, step) => ({ ...all, ...validateWidgets(step.widgets, form, documents) }), {});
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const first = workflow.steps.find((step) => step.widgets.some((widget) => nextErrors[widget.path]));
      if (first) setActiveStep(first.id);
      setState((value) => ({ ...value, error: "" })); return;
    }
    setState((value) => ({ ...value, saving: true, error: "" }));
    try {
      const identity = await ensureDraft();
      const body = new FormData(); body.append("payload", JSON.stringify(form));
      documents.forEach((file) => body.append("documents", file)); if (logo) body.append("logo", logo);
      const result = unwrap(await api.post(`/tenancy/partnership-requests/drafts/${identity.requestId}/submit`, body, { headers: { "Content-Type": "multipart/form-data", "x-partnership-resume-token": identity.resumeToken } }));
      const nextReceipt = { ...result, submittedAt: result.submittedAt || new Date().toISOString() };
      storage.write({ receipt: nextReceipt }); setReceipt(nextReceipt);
    } catch (error) { setState((value) => ({ ...value, saving: false, error: error.response?.data?.message || "The application could not be submitted." })); }
  };
  const reset = () => { storage.clear(); setReceipt(null); setDraft(null); setForm(EMPTY_FORM); setDocuments([]); setLogo(null); setActiveStep("business"); setCompleted([]); };
  const index = workflow?.steps.findIndex((step) => step.id === activeStep) ?? 0;
  const nextStep = workflow?.steps[index + 1];
  const returnToSignIn = () => window.location.assign("/");

  return <div className="partner-request-page">
    <AuthHeader config={{ brand: { name: process.env.REACT_APP_COMPANY_NAME || "TravelsTREM", tagline: "Tours · Reservations · Experiences · Management" } }} theme={theme} onToggleTheme={onToggleTheme} />
    {receipt ? <SubmissionReceipt receipt={receipt} onStartAgain={reset} /> : state.loading ? <div className="partner-request-page__loading"><Spinner label="Preparing your activation journey" /></div> : state.error && !workflow ? <div className="partner-request-page__loading"><strong>{state.error}</strong><Button text="Try again" onClick={() => window.location.reload()} /></div> : workflow ? <WizardFormShell className="partner-request-page__wizard" eyebrow="Agency partnerships" title={workflow.title} subtitle={workflow.subtitle} status={draft ? "Draft saved" : "Not started"} headerActions={<Button text="Return to sign in" variant="text" iconLeft="logout" onClick={returnToSignIn} />} steps={workflow.steps} activeStepId={activeStep} completedStepIds={completed} progress={Math.round((completed.length / workflow.steps.length) * 100)} canNavigate railTitle="Activate your agency" railSubtitle={`${workflow.steps.length} verified steps`} onStepChange={(stepId) => { if (completed.includes(stepId) || stepId === activeStep) setActiveStep(stepId); }} actionBar={<footer className="partner-request-page__actions"><div className="partner-request-page__actions-secondary"><Button text={index === 0 ? "Sign in" : "Previous"} variant="outline" iconLeft={index === 0 ? "logout" : "arrowLeft"} disabled={state.saving} onClick={index === 0 ? returnToSignIn : () => setActiveStep(workflow.steps[index - 1].id)} /><span>{state.saving ? "Saving securely…" : state.savedAt ? `Progress saved at ${new Date(state.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Your progress is saved after each step"}</span></div>{index === workflow.steps.length - 1 ? <Button text={state.saving ? "Submitting…" : "Submit application"} disabled={state.saving} onClick={submit} /> : <Button text={state.saving ? "Saving…" : "Save and continue"} iconRight="chevronRight" disabled={state.saving} onClick={() => saveStep(nextStep.id)} />}</footer>}>
      <WizardValidationSummary errors={Object.fromEntries(workflow.steps[index]?.widgets.map((widget) => [widget.path, errors[widget.path]]).filter(([, message]) => message))} />
      {state.error ? <div className="partner-request-page__message" role="alert">{state.error}</div> : null}
      <div className="partner-request-page__step-grid">{workflow.steps[index]?.widgets.map((widget) => <PartnershipWidget key={widget.path} widget={widget} form={form} setForm={setForm} errors={errors} setErrors={setErrors} documents={documents} setDocuments={setDocuments} logo={logo} setLogo={setLogo} />)}</div>
    </WizardFormShell> : null}
  </div>;
}
