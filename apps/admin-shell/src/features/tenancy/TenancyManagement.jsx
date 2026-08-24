import React, { useCallback, useEffect, useState } from "react";
import {
  BottomSheet, Button, FilterChips, InfoCard, InputField, MetricSummary, MultiSelect,
  NoDataFound, Pagination, SearchBar, SingleSelect, Spinner, StatusBadge, TextArea,
} from "@packages/trem-ui";
import api from "../../services/apiClient";
import "./TenancyManagement.scss";

const PAGE_SIZE = 12;
const WORKSPACES = [
  { id: "lifecycle", label: "Applications & agencies", help: "Review applications and manage active partner agencies", sections: ["requests", "agencies"] },
  { id: "access", label: "Product access", help: "Approve access requests and manage product availability", sections: ["productRequests", "products"] },
  { id: "risk", label: "Risk & audit history", help: "Review deletion requests and platform activity", sections: ["deletions", "audit"] },
];
const CONFIG = {
  requests: { label: "Partner applications", endpoint: "/tenancy/partnership-requests", search: "Search agency, applicant or registration number", statuses: ["draft", "submitted", "under_review", "additional_information_required", "approved", "rejected", "converted"] },
  agencies: { label: "Registered agencies", endpoint: "/tenancy/agencies", search: "Search agency, reference or contact", statuses: ["pending", "approved", "active", "suspended", "deactivated", "rejected"] },
  productRequests: { label: "Product access requests", endpoint: "/tenancy/product-access-requests", search: "Search agency or requested product", statuses: ["pending", "approved", "rejected"] },
  products: { label: "Platform products", endpoint: "/tenancy/products", search: "Search platform products", statuses: ["active", "inactive"] },
  deletions: { label: "Deletion approvals", endpoint: "/tenancy/deletion-requests", search: "Search agent, agency or requester", statuses: ["pending", "approved", "rejected", "completed", "cancelled"] },
  audit: { label: "Audit activity", endpoint: "/tenancy/audit-logs", search: "Search action, entity or actor", statuses: [] },
};
const unwrap = (response) => response?.data?.componentData?.data ?? response?.data?.data ?? response?.data;
const pretty = (value = "") => String(value).replaceAll("_", " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (m) => m.toUpperCase());
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "Not recorded");
const agencyOf = (record) => record?.agency || record || {};
const idOf = (record) => record?._id || record?.id;

function DetailGrid({ fields }) {
  return <dl className="tenant-console__detail-grid">{fields.filter((field) => field.value != null).map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.value || "Not provided"}</dd></div>)}</dl>;
}

export default function TenancyManagement() {
  const [workspace, setWorkspace] = useState("lifecycle");
  const [section, setSection] = useState("requests");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: true, error: "", data: { items: [] } });
  const [selected, setSelected] = useState(null);
  const [team, setTeam] = useState([]);
  const [notice, setNotice] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [confirmDraftDelete, setConfirmDraftDelete] = useState(false);
  const [products, setProducts] = useState([]);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [onboard, setOnboard] = useState({ agencyName: "", legalName: "", registrationNumber: "", gstNumber: "", panNumber: "", companyEmail: "", companyPhone: "", website: "", line1: "", city: "", state: "", postalCode: "", country: "India", yearsInBusiness: "", numberOfEmployees: "", approximateCustomerBase: "", servicesOffered: "", contactName: "", designation: "", contactEmail: "", contactMobile: "", products: [] });
  const [form, setForm] = useState({ products: [], adminName: "", adminEmail: "", message: "", productName: "", productDescription: "", productStatus: "active", productHidden: false });
  const config = CONFIG[section];
  const activeWorkspace = WORKSPACES.find((item) => item.id === workspace) || WORKSPACES[0];

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const response = await api.get(config.endpoint, { params: { search: query || undefined, status: status || undefined, skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE } });
      const payload = unwrap(response);
      setState({ loading: false, error: "", data: Array.isArray(payload) ? { items: payload, total: payload.length } : payload || { items: [] } });
    } catch (error) {
      setState({ loading: false, error: error?.response?.data?.message || "Unable to load this governance workspace.", data: { items: [] } });
    }
  }, [config.endpoint, page, query, status]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get("/tenancy/products").then((response) => setProducts(unwrap(response) || [])).catch(() => setProducts([])); }, []);

  const resetForm = (record = {}) => setForm({ products: record.productAccess || [], adminName: "", adminEmail: "", message: "", productName: record.name || "", productDescription: record.description || "", productStatus: record.status || "active", productHidden: Boolean(record.hidden) });
  const act = async (request, success, keepOpen = false) => {
    setReviewError("");
    try { await request(); setNotice(success); if (!keepOpen) setSelected(null); await load(); }
    catch (error) {
      const message = error?.response?.data?.message || "Action failed.";
      if (selected) setReviewError(message); else setNotice(message);
    }
  };
  const open = async (item) => {
    setTeam([]); resetForm(item); setReviewError(""); setConfirmDraftDelete(false);
    if (!["requests", "agencies"].includes(section)) { setSelected(item); return; }
    try {
      const response = await api.get(section === "requests" ? `/tenancy/partnership-requests/${idOf(item)}` : `/tenancy/agencies/${idOf(item)}`);
      const record = unwrap(response); const agency = agencyOf(record); setSelected(record); resetForm(agency);
      if (section === "requests") setForm((value) => ({ ...value, products: [], adminName: record?.primaryContact?.fullName || "", adminEmail: record?.primaryContact?.email || "" }));
      else api.get(`/tenancy/agencies/${idOf(agency)}/users`, { params: { limit: 20 } }).then((result) => setTeam(unwrap(result)?.items || [])).catch(() => setTeam([]));
    } catch (error) { setNotice(error?.response?.data?.message || "Details could not be loaded."); }
  };
  const requireReason = (callback, errorMessage = "Record a clear governance reason using at least 10 characters.") => form.message.trim().length >= 10 ? callback() : setReviewError(errorMessage);
  const review = async (next) => {
    setPendingAction(next); setReviewError("");
    try {
      const response = await api.patch(`/tenancy/partnership-requests/${selected._id}/status`, { status: next, message: form.message, reason: form.message });
      const updated = unwrap(response);
      setSelected(updated?.request || updated);
      setForm((value) => ({ ...value, message: "" }));
      setNotice(`Application moved to ${pretty(next)}.`);
      await load();
    } catch (error) {
      setReviewError(error?.response?.data?.message || "The review action could not be completed.");
    } finally { setPendingAction(""); }
  };
  const deleteDraft = async () => {
    setPendingAction("delete_draft"); setReviewError("");
    try {
      await api.delete(`/tenancy/partnership-requests/${selected._id}`);
      setSelected(null); setConfirmDraftDelete(false);
      setNotice("Incomplete partnership draft permanently deleted.");
      await load();
    } catch (error) {
      setReviewError(error?.response?.data?.message || "The draft could not be deleted.");
    } finally { setPendingAction(""); }
  };
  const convert = () => {
    if (!form.products.length || !form.adminName.trim() || !form.adminEmail.trim()) { setNotice("Assign a product and provide the initial Partner Admin details."); return; }
    act(() => api.post(`/tenancy/partnership-requests/${selected._id}/convert`, { products: form.products, partnerAdmin: { name: form.adminName.trim(), email: form.adminEmail.trim(), products: form.products } }), "Agency created and Partner Admin invited.");
  };
  const agencyStatus = (next) => act(() => api.patch(`/tenancy/agencies/${idOf(agencyOf(selected))}`, { status: next }), `Agency ${next}. Active sessions and access were updated safely.`);
  const saveAgencyProducts = () => act(() => api.patch(`/tenancy/agencies/${idOf(agencyOf(selected))}`, { productAccess: form.products }), "Agency product access updated.");
  const inviteAdmin = () => {
    const agency = agencyOf(selected);
    if (!form.adminName.trim() || !form.adminEmail.trim()) { setNotice("Enter the Partner Admin name and work email."); return; }
    act(() => api.post(`/tenancy/agencies/${idOf(agency)}/users/invite`, { name: form.adminName.trim(), email: form.adminEmail.trim(), agencyRole: "partner_admin", productKeys: agency.productAccess || [] }), "Partner Admin invited.");
  };
  const updateMember = (member, next) => act(() => api.patch(`/tenancy/users/${member._id}`, { accountStatus: next }), `${member.name}'s access is now ${next}.`);
  const decideProduct = (next) => act(() => api.patch(`/tenancy/product-access-requests/${selected._id}`, { status: next, decisionNote: form.message }), `Product request ${next}.`);
  const decideDeletion = (next) => act(() => api.patch(`/tenancy/deletion-requests/${selected._id}`, { status: next, notes: form.message }), `Deletion request ${next}.`);
  const saveProduct = () => act(() => api.put(`/tenancy/products/${selected.key}`, { name: form.productName, description: form.productDescription, status: form.productStatus, hidden: form.productHidden }), "Platform product updated.");
  const activeProducts = products.filter((product) => product.status === "active" && !product.hidden).map((product) => ({ value: product.key, label: product.name }));
  const onboardRequired = onboardStep === 0
    ? ["agencyName", "legalName", "companyEmail", "companyPhone"]
    : onboardStep === 1 ? ["registrationNumber", "gstNumber", "panNumber", "line1", "city", "state", "postalCode", "country", "yearsInBusiness", "numberOfEmployees", "approximateCustomerBase", "servicesOffered"]
      : onboardStep === 2 ? ["contactName", "designation", "contactEmail", "contactMobile"] : ["products"];
  const continueOnboarding = () => {
    if (onboardRequired.some((key) => Array.isArray(onboard[key]) ? !onboard[key].length : !String(onboard[key] || "").trim())) { setNotice("Complete all required activation fields before continuing."); return; }
    setOnboardStep((value) => Math.min(3, value + 1));
  };
  const createAndInvitePartner = async () => {
    if (!onboard.products.length) { setNotice("Assign at least one active product."); return; }
    try {
      const created = unwrap(await api.post("/tenancy/partnership-requests", {
        agencyName: onboard.agencyName, legalName: onboard.legalName,
        registrationNumber: onboard.registrationNumber, gstNumber: onboard.gstNumber,
        panNumber: onboard.panNumber, companyEmail: onboard.companyEmail,
        companyPhone: onboard.companyPhone, website: onboard.website,
        address: { line1: onboard.line1, city: onboard.city, state: onboard.state, postalCode: onboard.postalCode, country: onboard.country },
        yearsInBusiness: Number(onboard.yearsInBusiness), numberOfEmployees: Number(onboard.numberOfEmployees),
        approximateCustomerBase: Number(onboard.approximateCustomerBase),
        servicesOffered: onboard.servicesOffered.split(",").map((value) => value.trim()).filter(Boolean),
        primaryContact: { fullName: onboard.contactName, designation: onboard.designation, email: onboard.contactEmail, mobile: onboard.contactMobile },
      }));
      await api.patch(`/tenancy/partnership-requests/${created.requestId}/status`, { status: "under_review", message: "Application completed by a Master Admin." });
      await api.patch(`/tenancy/partnership-requests/${created.requestId}/status`, { status: "approved", message: "Identity reviewed during direct Master Admin onboarding." });
      await api.post(`/tenancy/partnership-requests/${created.requestId}/convert`, { products: onboard.products, partnerAdmin: { name: onboard.contactName, email: onboard.contactEmail, products: onboard.products } });
      setOnboardOpen(false); setOnboardStep(0);
      setOnboard({ agencyName: "", legalName: "", registrationNumber: "", gstNumber: "", panNumber: "", companyEmail: "", companyPhone: "", website: "", line1: "", city: "", state: "", postalCode: "", country: "India", yearsInBusiness: "", numberOfEmployees: "", approximateCustomerBase: "", servicesOffered: "", contactName: "", designation: "", contactEmail: "", contactMobile: "", products: [] });
      setNotice("Agency workspace created and the Partner Admin activation invitation was sent.");
      await load();
    } catch (error) { setNotice(error?.response?.data?.message || "The agency could not be activated."); }
  };

  const switchWorkspace = (next) => { const target = WORKSPACES.find((item) => item.id === next); setWorkspace(next); setSection(target.sections[0]); setSelected(null); setStatus(""); setQuery(""); setPage(1); };
  const switchSection = (next) => { setSection(next); setSelected(null); setStatus(""); setQuery(""); setPage(1); };
  const items = state.data?.items || []; const total = Number(state.data?.total ?? items.length); const totalPages = Math.ceil(total / PAGE_SIZE);
  const filters = [status ? { id: "status", label: `Status: ${pretty(status)}` } : null, query ? { id: "query", label: `Search: ${query}` } : null].filter(Boolean);
  const metrics = [
    { id: "total", label: "Records in scope", value: total, icon: "briefcaseBusiness" },
    { id: "attention", label: "Need attention", value: items.filter((item) => ["submitted", "under_review", "pending"].includes(item.status)).length, icon: "clock" },
    { id: "resolved", label: "Active or resolved", value: items.filter((item) => ["active", "approved", "completed", "converted"].includes(item.status)).length, icon: "shieldCheck" },
    { id: "visible", label: "Visible this page", value: items.length, icon: "itinerary" },
  ];

  const recordCard = (item) => {
    const title = item.agencyName || item.agencyId?.agencyName || item.name || item.title || (item.status === "draft" ? "Incomplete partnership application" : pretty(item.action));
    const subtitle = item.companyEmail || item.contactEmail || item.requestedBy?.email || item.partnerAgencyRef || item.key || item.entityType || "Platform record";
    const productList = section === "agencies" ? item.productAccess || [] : section === "productRequests" ? item.requestedProducts || [] : [];
    return <InfoCard key={idOf(item) || item.key} title={title} subtitle={subtitle} badge={{ value: item.hidden ? "hidden" : item.status || item.type || "recorded" }} fields={[
      productList.length ? { id: "products", label: "Products", value: productList.map(pretty).join(", ") } : null,
      { id: "reference", label: section === "audit" ? "Entity" : "Reference", value: section === "audit" ? `${item.entityType || "Record"} · ${item.entityId || "—"}` : item.partnerAgencyRef || item.agencyId?.partnerAgencyRef || item.key || "—" },
      { id: "updated", label: section === "audit" ? "Recorded" : "Last updated", value: formatDate(item.updatedAt || item.createdAt) },
    ].filter(Boolean)} actionLabel={section === "audit" ? "View audit details" : section === "requests" ? "Review application" : section === "agencies" ? "Manage agency" : section === "productRequests" ? "Review access request" : section === "deletions" ? "Review deletion request" : "Manage product"} onClick={() => open(item)} className="tenant-console__record" />;
  };

  const requestReview = () => {
    const isReopenedReviewDraft = selected.status === "draft" && Boolean(selected.reopenedAt);
    const draftDeleteControls = confirmDraftDelete ? <div className="tenant-console__draft-confirm"><strong>Permanently delete this draft?</strong><span>This action cannot be undone.</span><div className="tenant-console__actions"><Button text="Keep draft" variant="outline" disabled={Boolean(pendingAction)} onClick={() => setConfirmDraftDelete(false)} /><Button text={pendingAction === "delete_draft" ? "Deleting…" : "Permanently delete"} color="danger" disabled={Boolean(pendingAction)} onClick={deleteDraft} /></div></div> : <Button text="Delete draft application" color="danger" variant="outline" onClick={() => setConfirmDraftDelete(true)} />;
    return <>
      {selected.logo || selected.website ? <section className="tenant-console__agency-presence">
        <div className="tenant-console__agency-logo">{selected.logo ? <img src={selected.logo} alt={`${selected.agencyName || "Agency"} logo`} /> : <span>{String(selected.agencyName || "A").charAt(0)}</span>}</div>
        <div><small>Applicant agency</small><strong>{selected.agencyName || selected.legalName || "Unnamed agency"}</strong><span>{selected.website || "No website provided"}</span></div>
        {selected.website ? <Button text="Visit agency website" variant="outline" href={selected.website} target="_blank" rel="noreferrer" /> : null}
      </section> : null}
      <section className="tenant-console__review-section"><h4>Business identity</h4><DetailGrid fields={[
        { label: "Legal name", value: selected.legalName }, { label: "Primary contact", value: selected.primaryContact?.fullName }, { label: "Work email", value: selected.companyEmail || selected.primaryContact?.email }, { label: "Phone", value: selected.companyPhone || selected.primaryContact?.mobile },
        { label: "Website", value: selected.website }, { label: "Registration number", value: selected.registrationNumber }, { label: "GST number", value: selected.gstNumber }, { label: "PAN number", value: selected.panNumber }, { label: "Years in business", value: selected.yearsInBusiness }, { label: "Team size", value: selected.numberOfEmployees },
      ]} /></section>
      {selected.documents?.length ? <section className="tenant-console__review-section"><h4>Verification documents</h4><div className="tenant-console__actions">{selected.documents.map((document) => <Button key={document._id} text={document.name || "Open document"} variant="outline" href={`${api.defaults.baseURL || "/api"}/tenancy/partnership-requests/${selected._id}/documents/${document._id}`} target="_blank" />)}</div></section> : null}
      {selected.status !== "draft" ? <section className="tenant-console__review-section"><div className="tenant-console__section-heading"><div><h4>Review decision</h4><p>The application remains open here after each transition.</p></div><StatusBadge value={selected.status} /></div><TextArea label="Decision reason or information request" value={form.message} onChange={(message) => { setForm((value) => ({ ...value, message })); setReviewError(""); }} placeholder="Tell the applicant exactly what is required or record the governance reason." maxLength={600} error={reviewError} /><div className="tenant-console__actions">
        {selected.status === "submitted" ? <Button text={pendingAction === "under_review" ? "Starting review…" : "Start formal review"} disabled={Boolean(pendingAction)} onClick={() => review("under_review")} /> : null}
        {selected.status === "under_review" ? <><Button text={pendingAction === "additional_information_required" ? "Sending request…" : "Request information"} variant="outline" disabled={Boolean(pendingAction)} onClick={() => requireReason(() => review("additional_information_required"))} /><Button text={pendingAction === "approved" ? "Approving…" : "Approve partner"} disabled={Boolean(pendingAction)} onClick={() => review("approved")} /><Button text={pendingAction === "rejected" ? "Rejecting…" : "Reject application"} color="danger" disabled={Boolean(pendingAction)} onClick={() => requireReason(() => review("rejected"))} /></> : null}
        {selected.status === "rejected" ? <Button text={pendingAction === "draft" ? "Reopening…" : "Reopen as review draft"} variant="outline" disabled={Boolean(pendingAction)} onClick={() => requireReason(() => review("draft"), "Explain why this rejected application should be reopened using at least 10 characters.")} /> : null}
        {!["submitted", "under_review", "rejected"].includes(selected.status) ? <span className="tenant-console__decision-state">No review action is required at the current stage.</span> : null}
      </div></section> : isReopenedReviewDraft ? <section className="tenant-console__review-section"><div className="tenant-console__section-heading"><div><h4>Reopened review draft</h4><p>All submitted details and documents are preserved. Resume formal review without asking the partner to complete the form again.</p></div><StatusBadge value="draft" /></div>{reviewError ? <div className="tenant-console__inline-error" role="alert">{reviewError}</div> : null}<div className="tenant-console__actions"><Button text={pendingAction === "under_review" ? "Resuming review…" : "Resume formal review"} disabled={Boolean(pendingAction)} onClick={() => review("under_review")} />{draftDeleteControls}</div></section> : <section className="tenant-console__review-section tenant-console__danger-zone"><h4>Incomplete application draft</h4><p>This draft has not been submitted. Deleting it permanently removes the saved application from the database.</p>{reviewError ? <div className="tenant-console__inline-error" role="alert">{reviewError}</div> : null}{draftDeleteControls}</section>}
      {selected.status === "approved" ? <section className="tenant-console__review-section"><h4>Provision agency workspace</h4><p>Create the isolated tenant and invite its first Partner Admin.</p><MultiSelect label="Enabled products" value={form.products} onChange={(value) => setForm((current) => ({ ...current, products: value }))} options={activeProducts} /><div className="tenant-console__form-grid"><InputField label="Partner Admin name" value={form.adminName} onChange={(adminName) => setForm((value) => ({ ...value, adminName }))} /><InputField label="Partner Admin email" variant="email" value={form.adminEmail} onChange={(adminEmail) => setForm((value) => ({ ...value, adminEmail }))} /></div><Button text="Create agency & invite admin" onClick={convert} /></section> : null}
    </>;
  };

  const agencyReview = () => {
    const agency = agencyOf(selected); const current = agency.status || "pending";
    const transitions = ({ pending: ["active", "rejected"], approved: ["active", "rejected"], active: ["suspended", "deactivated"], suspended: ["active", "deactivated"], deactivated: ["active"], rejected: [] }[current] || []);
    return <>
      <MetricSummary variant="cards" items={[{ id: "admins", label: "Partner admins", value: selected.stats?.admins || 0, icon: "user" }, { id: "agents", label: "Agents", value: selected.stats?.agents || 0, icon: "usersRound" }, { id: "trips", label: "Trips", value: selected.stats?.trips || 0, icon: "map" }, { id: "customers", label: "Customers", value: selected.stats?.customers || 0, icon: "briefcaseBusiness" }]} />
      <section className="tenant-console__review-section"><h4>Agency identity</h4><DetailGrid fields={[{ label: "Agency reference", value: agency.partnerAgencyRef }, { label: "Legal name", value: agency.legalName }, { label: "Primary contact", value: agency.contactName }, { label: "Contact email", value: agency.contactEmail }, { label: "Contact phone", value: agency.contactPhone }, { label: "Created", value: formatDate(agency.createdAt) }]} /></section>
      <section className="tenant-console__review-section"><h4>Product access</h4><p>Changes immediately alter what this tenant can assign to its team.</p><MultiSelect label="Enabled products" value={form.products} onChange={(value) => setForm((currentForm) => ({ ...currentForm, products: value }))} options={activeProducts} /><Button text="Update product access" variant="outline" onClick={saveAgencyProducts} /></section>
      <section className="tenant-console__review-section tenant-console__danger-zone"><h4>Lifecycle controls</h4><p>Suspending or deactivating an agency revokes active sessions for its team.</p>{transitions.some((next) => next !== "active") ? <TextArea label="Mandatory governance reason" value={form.message} onChange={(message) => setForm((value) => ({ ...value, message }))} placeholder="Explain the evidence and operational reason." maxLength={600} /> : null}<div className="tenant-console__actions">{transitions.map((next) => <Button key={next} text={pretty(next)} variant={next === "active" ? "solid" : "outline"} color={["rejected", "deactivated"].includes(next) ? "danger" : "primary"} onClick={() => next === "active" ? agencyStatus(next) : requireReason(() => agencyStatus(next))} />)}{!transitions.length ? <span>No further lifecycle transitions are permitted.</span> : null}</div></section>
      <section className="tenant-console__review-section"><div className="tenant-console__section-heading"><div><h4>Agency team</h4><p>Control invitations and account access.</p></div><StatusBadge value={`${team.length} accounts`} tone="info" /></div><div className="tenant-console__team-list">{team.map((member) => <article key={member._id}><div><strong>{member.name}</strong><small>{member.email} · {pretty(member.agencyRole)}</small></div><StatusBadge value={member.accountStatus} /><div className="tenant-console__actions">{member.accountStatus === "invited" ? <Button text="Resend invite" variant="text" onClick={() => act(() => api.post(`/tenancy/users/${member._id}/resend-invitation`), "Invitation resent.", true)} /> : null}{member.accountStatus === "active" ? <Button text="Suspend access" variant="text" color="danger" onClick={() => requireReason(() => updateMember(member, "suspended"))} /> : null}{["suspended", "deactivated"].includes(member.accountStatus) ? <Button text="Reactivate" variant="text" onClick={() => updateMember(member, "active")} /> : null}</div></article>)}{!team.length ? <p>No partner accounts were returned for this agency.</p> : null}</div><div className="tenant-console__form-grid"><InputField label="New Partner Admin name" value={form.adminName} onChange={(adminName) => setForm((value) => ({ ...value, adminName }))} /><InputField label="Work email" variant="email" value={form.adminEmail} onChange={(adminEmail) => setForm((value) => ({ ...value, adminEmail }))} /></div><Button text="Invite Partner Admin" variant="outline" onClick={inviteAdmin} /></section>
    </>;
  };

  const otherReview = () => {
    if (section === "productRequests") return <section className="tenant-console__review-section"><h4>Requested product access</h4><DetailGrid fields={[{ label: "Agency", value: selected.agencyId?.agencyName }, { label: "Current products", value: (selected.currentProducts || []).map(pretty).join(", ") || "None" }, { label: "Requested products", value: (selected.requestedProducts || []).map(pretty).join(", ") }, { label: "Business reason", value: selected.reason }]} />{selected.status === "pending" ? <><TextArea label="Decision note" value={form.message} onChange={(message) => setForm((value) => ({ ...value, message }))} /><div className="tenant-console__actions"><Button text="Approve access" onClick={() => decideProduct("approved")} /><Button text="Reject request" color="danger" variant="outline" onClick={() => requireReason(() => decideProduct("rejected"))} /></div></> : null}</section>;
    if (section === "deletions") return <section className="tenant-console__review-section tenant-console__danger-zone"><h4>Permanent deletion review</h4><p>The backend checks owned tours, trips and customers before deletion or anonymisation.</p><DetailGrid fields={[{ label: "Agent", value: selected.agentId?.name || selected.agentName }, { label: "Agency", value: selected.agencyId?.agencyName }, { label: "Requested by", value: selected.requestedBy?.email || selected.requestedBy?.name }, { label: "Request reason", value: selected.reason }, { label: "Requested", value: formatDate(selected.createdAt) }]} />{selected.status === "pending" ? <><TextArea label="Mandatory decision note" value={form.message} onChange={(message) => setForm((value) => ({ ...value, message }))} /><div className="tenant-console__actions"><Button text="Approve with safeguards" color="danger" onClick={() => requireReason(() => decideDeletion("approved"))} /><Button text="Reject deletion" variant="outline" onClick={() => requireReason(() => decideDeletion("rejected"))} /></div></> : null}</section>;
    if (section === "products") return <section className="tenant-console__review-section"><h4>Platform product controls</h4><p>Inactive or hidden products are excluded from new assignments and customer discovery.</p><InputField label="Product name" value={form.productName} onChange={(productName) => setForm((value) => ({ ...value, productName }))} /><TextArea label="Description" value={form.productDescription} onChange={(productDescription) => setForm((value) => ({ ...value, productDescription }))} /><SingleSelect label="Availability" value={form.productStatus} onChange={(productStatus) => setForm((value) => ({ ...value, productStatus }))} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} /><div className="tenant-console__visibility-control"><div><strong>Customer and agency visibility</strong><span>{form.productHidden ? "Hidden from discovery and assignment" : "Visible where active"}</span></div><Button text={form.productHidden ? "Make visible" : "Hide product"} variant="outline" onClick={() => setForm((value) => ({ ...value, productHidden: !value.productHidden }))} /></div><Button text="Save product controls" onClick={saveProduct} /></section>;
    return <section className="tenant-console__review-section"><h4>Immutable audit entry</h4><DetailGrid fields={[{ label: "Action", value: pretty(selected.action) }, { label: "Actor role", value: pretty(selected.actorRole) }, { label: "Entity", value: selected.entityType }, { label: "Entity reference", value: selected.entityId }, { label: "Recorded", value: formatDate(selected.createdAt) }, { label: "Correlation reference", value: selected.correlationId }]} /></section>;
  };

  const selectedTitle = selected ? agencyOf(selected).agencyName || selected.name || selected.agencyId?.agencyName || (selected.status === "draft" ? "Incomplete partnership application" : pretty(selected.action)) : "Governance review";
  return <section className="tenant-console" aria-label="Partner governance administration">
    <header className="tenant-console__heading"><div><p>Platform governance</p><h2>Partner & agency controls</h2><span>Review partner risk, tenant access and lifecycle decisions from one auditable workspace.</span></div><div className="tenant-console__actions"><Button text="Onboard partner agency" iconLeft="plus" onClick={() => setOnboardOpen(true)} /><Button text="Refresh workspace" variant="outline" iconLeft="refreshCw" onClick={load} /></div></header>
    {notice ? <div className="tenant-console__notice" role="status"><span>{notice}</span><Button variant="text" isCircular iconLeft="x" aria-label="Dismiss" onClick={() => setNotice("")} /></div> : null}
    <nav className="tenant-console__workspaces" aria-label="Governance workspaces">{WORKSPACES.map((item) => <Button key={item.id} variant={workspace === item.id ? "solid" : "outline"} onClick={() => switchWorkspace(item.id)} primaryClassName="tenant-console__workspace-button"><strong>{item.label}</strong><small>{item.help}</small></Button>)}</nav>
    <MetricSummary items={metrics} variant="cards" ariaLabel={`${config.label} summary`} />
    <section className="tenant-console__directory"><div className="tenant-console__directory-heading"><div><h3>{config.label}</h3><p>{total} records in this view</p></div><SingleSelect label="View" value={section} onChange={switchSection} options={activeWorkspace.sections.map((key) => ({ value: key, label: CONFIG[key].label }))} /></div>
      <div className="tenant-console__filters"><SearchBar value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder={config.search} />{config.statuses.length ? <SingleSelect label="Status" placeholder="All statuses" clearable value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={config.statuses.map((value) => ({ value, label: pretty(value) }))} /> : null}</div>
      <FilterChips items={filters} onRemove={(key) => { if (key === "status") setStatus(""); else setQuery(""); setPage(1); }} onClearAll={() => { setStatus(""); setQuery(""); setPage(1); }} />
      {state.loading ? <div className="tenant-console__state"><Spinner label="Loading governance records" /></div> : state.error ? <div className="tenant-console__state is-error"><strong>Could not load governance data</strong><span>{state.error}</span><Button text="Try again" onClick={load} /></div> : !items.length ? <NoDataFound icon="shieldCheck" title="No records need attention" description="Records matching this governance view will appear here." actionLabel={filters.length ? "Clear filters" : "Refresh"} onAction={filters.length ? () => { setStatus(""); setQuery(""); } : load} /> : <div className="tenant-console__records">{items.map(recordCard)}</div>}
      <div className="tenant-console__pagination-slot"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} disabled={state.loading} /></div>
    </section>
    <BottomSheet open={Boolean(selected)} onClose={() => { if (!pendingAction) { setSelected(null); setReviewError(""); setConfirmDraftDelete(false); } }} title={selectedTitle} className="tenant-console__review-sheet">{selected ? <div className="tenant-console__review"><div className="tenant-console__review-intro"><div><small>{config.label}</small><h3>{selectedTitle}</h3></div><StatusBadge value={agencyOf(selected).status || selected.status || selected.type || "recorded"} /></div>{section !== "requests" && reviewError ? <div className="tenant-console__inline-error" role="alert">{reviewError}</div> : null}{section === "requests" ? requestReview() : section === "agencies" ? agencyReview() : otherReview()}</div> : null}</BottomSheet>
    <BottomSheet open={onboardOpen} onClose={() => setOnboardOpen(false)} title="Create and activate a partner agency" className="tenant-console__review-sheet">
      <div className="tenant-console__onboarding">
        <div className="tenant-console__onboarding-progress">{["Business identity", "Registration & operations", "Activation contact", "Products & invitation"].map((label, index) => <button type="button" key={label} className={index === onboardStep ? "is-active" : index < onboardStep ? "is-complete" : ""} onClick={() => index < onboardStep && setOnboardStep(index)}><span>{index < onboardStep ? "✓" : index + 1}</span><strong>{label}</strong></button>)}</div>
        <section className="tenant-console__review-section">
          <div><small>Step {onboardStep + 1} of 4</small><h3>{["Verify the agency", "Record legal and operating details", "Choose the Partner Admin", "Provision access and send invitation"][onboardStep]}</h3></div>
          {onboardStep === 0 ? <div className="tenant-console__form-grid">{[["Agency trading name", "agencyName"], ["Registered legal name", "legalName"], ["Company email", "companyEmail", "email"], ["Company phone", "companyPhone", "tel"], ["Website", "website", "url"]].map(([label, key, variant]) => <InputField key={key} label={label} required={key !== "website"} variant={variant || "text"} value={onboard[key]} onChange={(value) => setOnboard((current) => ({ ...current, [key]: value }))} />)}</div> : null}
          {onboardStep === 1 ? <><div className="tenant-console__form-grid">{[["Registration number", "registrationNumber"], ["GST number", "gstNumber"], ["PAN number", "panNumber"], ["Address line 1", "line1"], ["City", "city"], ["State", "state"], ["Postal code", "postalCode"], ["Country", "country"], ["Years in business", "yearsInBusiness", "number"], ["Number of employees", "numberOfEmployees", "number"], ["Approximate customer base", "approximateCustomerBase", "number"]].map(([label, key, variant]) => <InputField key={key} label={label} required variant={variant || "text"} value={onboard[key]} onChange={(value) => setOnboard((current) => ({ ...current, [key]: value }))} />)}</div><TextArea label="Services offered" required value={onboard.servicesOffered} placeholder="Tours, corporate travel, visas…" onChange={(value) => setOnboard((current) => ({ ...current, servicesOffered: value }))} /></> : null}
          {onboardStep === 2 ? <div className="tenant-console__form-grid">{[["Full name", "contactName"], ["Designation", "designation"], ["Work email", "contactEmail", "email"], ["Mobile number", "contactMobile", "tel"]].map(([label, key, variant]) => <InputField key={key} label={label} required variant={variant || "text"} value={onboard[key]} onChange={(value) => setOnboard((current) => ({ ...current, [key]: value }))} />)}</div> : null}
          {onboardStep === 3 ? <><MultiSelect label="Enabled platform products" required value={onboard.products} options={activeProducts} onChange={(value) => setOnboard((current) => ({ ...current, products: value }))} /><div className="tenant-console__activation-summary"><StatusBadge value="Direct activation" tone="warning" /><p>This creates the isolated agency workspace, grants only the selected products, and emails a one-time activation invitation to <strong>{onboard.contactEmail}</strong>.</p></div></> : null}
          <div className="tenant-console__actions"><Button text="Previous step" variant="outline" disabled={onboardStep === 0} onClick={() => setOnboardStep((value) => Math.max(0, value - 1))} />{onboardStep < 3 ? <Button text={`Continue to ${["Registration & operations", "Partner Admin", "Products & invitation"][onboardStep]}`} onClick={continueOnboarding} /> : <Button text="Activate agency and send invitation" onClick={createAndInvitePartner} />}</div>
        </section>
      </div>
    </BottomSheet>
  </section>;
}
