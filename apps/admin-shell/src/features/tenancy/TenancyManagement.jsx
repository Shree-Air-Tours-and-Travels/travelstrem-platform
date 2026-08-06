import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, NoDataFound, Spinner, StatusBadge } from "@packages/trem-ui";
import api from "../../services/apiClient";
import "./TenancyManagement.scss";

const SECTIONS = [
  ["requests", "Partner Requests"], ["agencies", "Agencies"], ["productRequests", "Product Requests"], ["deletions", "Deletion Requests"],
  ["audit", "Audit Logs"], ["products", "Platform Products"],
];
const unwrap = (response) => response?.data?.componentData?.data ?? response?.data?.data ?? response?.data;
const pretty = (value = "") => String(value).replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());

export default function TenancyManagement() {
  const [section, setSection] = useState("requests");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [state, setState] = useState({ loading: true, error: "", data: { items: [] } });
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const [productCatalog, setProductCatalog] = useState([]);
  const [form, setForm] = useState({ products: [], adminName: "", adminEmail: "", message: "", productName: "", productDescription: "", productStatus: "active" });

  const endpoint = useMemo(() => ({ requests: "/tenancy/partnership-requests", agencies: "/tenancy/agencies", productRequests: "/tenancy/product-access-requests", deletions: "/tenancy/deletion-requests", audit: "/tenancy/audit-logs", products: "/tenancy/products" }[section]), [section]);
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const response = await api.get(endpoint, { params: { search: query || undefined, status: status || undefined, limit: 50 } });
      const payload = unwrap(response);
      setState({ loading: false, error: "", data: Array.isArray(payload) ? { items: payload, total: payload.length } : payload || { items: [] } });
    } catch (error) { setState({ loading: false, error: error?.response?.data?.message || "Unable to load this workspace.", data: { items: [] } }); }
  }, [endpoint, query, status]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get("/tenancy/products")
      .then((response) => setProductCatalog(unwrap(response) || []))
      .catch(() => setProductCatalog([]));
  }, []);

  const act = async (request, success) => {
    try { await request(); setNotice(success); setSelected(null); await load(); }
    catch (error) { setNotice(error?.response?.data?.message || "Action failed."); }
  };
  const open = async (item) => {
    if (section !== "requests" && section !== "agencies") { setSelected(item); if (section === "products") setForm((value) => ({ ...value, productName: item.name || "", productDescription: item.description || "", productStatus: item.status || "active" })); return; }
    try {
      const response = await api.get(section === "requests" ? `/tenancy/partnership-requests/${item._id}` : `/tenancy/agencies/${item._id}`);
      const record = unwrap(response); setSelected(record); setForm((value) => ({ ...value, adminName: section === "requests" ? record?.primaryContact?.fullName || "" : "", adminEmail: section === "requests" ? record?.primaryContact?.email || "" : "", products: [] }));
    } catch (error) { setNotice(error?.response?.data?.message || "Details could not be loaded."); }
  };
  const review = (next) => act(() => api.patch(`/tenancy/partnership-requests/${selected._id}/status`, { status: next, message: form.message, reason: form.message }), `Request marked ${pretty(next)}.`);
  const convert = () => {
    if (!form.products.length) { setNotice("Select at least one active product for this agency."); return; }
    if (!form.adminName.trim() || !form.adminEmail.trim()) { setNotice("Enter the Partner Admin name and work email."); return; }
    act(() => api.post(`/tenancy/partnership-requests/${selected._id}/convert`, { products: form.products, partnerAdmin: { name: form.adminName.trim(), email: form.adminEmail.trim(), products: form.products } }), "Agency created and invitation sent.");
  };
  const agencyStatus = (next) => act(() => api.patch(`/tenancy/agencies/${selected.agency?._id || selected._id}`, { status: next }), `Agency ${next}.`);
  const decideProductRequest = (next) => act(() => api.patch(`/tenancy/product-access-requests/${selected._id}`, { status: next, decisionNote: form.message }), `Product request ${next}.`);
  const inviteAgencyAdmin = () => act(() => api.post(`/tenancy/agencies/${selected.agency?._id || selected._id}/users/invite`, { name: form.adminName, email: form.adminEmail, agencyRole: "partner_admin", productKeys: selected.agency?.productAccess || selected.productAccess || [] }), "Additional Partner Admin invited.");
  const saveProduct = () => act(() => api.put(`/tenancy/products/${selected.key}`, { name: form.productName, description: form.productDescription, status: form.productStatus }), "Product updated.");

  const items = state.data?.items || [];
  return (
    <section className="tenant-console" aria-label="Multi-tenant administration">
      <div className="tenant-console__heading"><div><p>Platform administration</p><h2>Agency & access management</h2><span>Review partners, isolate tenants, and manage their complete lifecycle.</span></div><Button text="Refresh" variant="outline" onClick={load} /></div>
      {notice && <div className="tenant-console__notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
      <nav className="tenant-console__tabs" aria-label="Tenancy sections">{SECTIONS.map(([key, label]) => <button key={key} className={section === key ? "is-active" : ""} onClick={() => { setSection(key); setSelected(null); setStatus(""); }}>{label}</button>)}</nav>
      <div className="tenant-console__filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${SECTIONS.find(([key]) => key === section)?.[1].toLowerCase()}`} />{section !== "audit" && section !== "products" && <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{["submitted", "under_review", "additional_information_required", "approved", "rejected", "converted", "active", "suspended", "deactivated", "pending", "completed"].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select>}</div>
      {state.loading ? <div className="tenant-console__state"><Spinner label="Loading tenant data" /></div> : state.error ? <div className="tenant-console__state is-error"><strong>Could not load data</strong><span>{state.error}</span><Button text="Try again" onClick={load} /></div> : items.length === 0 ? <NoDataFound title="Nothing to review" description="Records matching these filters will appear here." /> : (
        <div className="tenant-console__table-wrap"><table><thead><tr><th>Name / event</th><th>Contact / entity</th>{["agencies", "productRequests"].includes(section) && <th>Products</th>}<th>Status</th><th>Updated</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{items.map((item) => <tr key={item._id || item.key}><td><strong>{item.agencyName || item.agencyId?.agencyName || item.name || item.title || pretty(item.action)}</strong><small>{item.partnerAgencyRef || item.agencyId?.partnerAgencyRef || item.key || item.actorRole || ""}</small></td><td>{item.companyEmail || item.contactEmail || item.requestedBy?.email || `${item.entityType || ""} ${item.entityId || ""}`}</td>{["agencies", "productRequests"].includes(section) && <td><div className="tenant-console__product-chips">{(section === "agencies" ? item.productAccess || [] : item.requestedProducts || []).map((product) => <span key={product}>{pretty(product)}</span>)}{!(section === "agencies" ? item.productAccess || [] : item.requestedProducts || []).length && <small>None assigned</small>}</div></td>}<td><StatusBadge value={item.status || item.type || "recorded"} /></td><td>{new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</td><td><Button text="View" variant="text" onClick={() => open(item)} /></td></tr>)}</tbody></table></div>
      )}
      {selected && <div className="tenant-console__overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><aside className="tenant-console__drawer" role="dialog" aria-modal="true" aria-label="Record details"><header><div><small>{pretty(section)}</small><h3>{selected.agencyName || selected.agency?.agencyName || selected.name || pretty(selected.action)}</h3></div><button onClick={() => setSelected(null)} aria-label="Close">×</button></header><div className="tenant-console__drawer-body"><dl>{Object.entries(section === "agencies" && selected.agency ? selected.agency : selected).filter(([key, value]) => !["_id", "__v", "documents", "history", "internalNotes"].includes(key) && ["string", "number"].includes(typeof value)).slice(0, 16).map(([key, value]) => <div key={key}><dt>{pretty(key)}</dt><dd>{String(value)}</dd></div>)}</dl>
        {section === "requests" && <><label>Applicant message / decision reason<textarea value={form.message} onChange={(event) => setForm((value) => ({ ...value, message: event.target.value }))} /></label>{selected.documents?.length > 0 && <div className="tenant-console__actions">{selected.documents.map((document) => <a key={document._id} href={`${api.defaults.baseURL || "/api"}/tenancy/partnership-requests/${selected._id}/documents/${document._id}`} target="_blank" rel="noreferrer">{document.name || "Verification document"}</a>)}</div>}{selected.status === "submitted" && <Button text="Start review" onClick={() => review("under_review")} />}{selected.status === "under_review" && <div className="tenant-console__actions"><Button text="Request information" variant="outline" onClick={() => review("additional_information_required")} /><Button text="Approve" onClick={() => review("approved")} /><Button text="Reject" color="danger" onClick={() => review("rejected")} /></div>}{selected.status === "approved" && <div className="tenant-console__convert"><h4>Create agency</h4><p className="tenant-console__help">Assign the products agreed with this partner. The initial Partner Admin receives access to the same products.</p><fieldset className="tenant-console__products"><legend>Products</legend>{productCatalog.filter((product) => product.status === "active").map((product) => <label key={product.key}><input type="checkbox" checked={form.products.includes(product.key)} onChange={(event) => setForm((value) => ({ ...value, products: event.target.checked ? [...new Set([...value.products, product.key])] : value.products.filter((key) => key !== product.key) }))} /><span><strong>{product.name}</strong><small>{product.description}</small></span></label>)}{!productCatalog.some((product) => product.status === "active") && <p>No active platform products are available. Activate a product before creating the agency.</p>}</fieldset><label>Partner Admin name<input value={form.adminName} onChange={(event) => setForm((value) => ({ ...value, adminName: event.target.value }))} /></label><label>Partner Admin email<input type="email" value={form.adminEmail} onChange={(event) => setForm((value) => ({ ...value, adminEmail: event.target.value }))} /></label><Button text="Create agency & invite admin" onClick={convert} disabled={!form.products.length || !form.adminName.trim() || !form.adminEmail.trim()} /></div>}</>}
        {section === "agencies" && <><div className="tenant-console__convert"><h4>Enabled products</h4><p className="tenant-console__help">These products are currently available to this agency.</p><div className="tenant-console__product-chips">{(selected.agency?.productAccess || selected.productAccess || []).map((product) => <span key={product}>{pretty(product)}</span>)}{!(selected.agency?.productAccess || selected.productAccess || []).length && <small>No products assigned</small>}</div></div><div className="tenant-console__actions"><Button text="Activate" onClick={() => agencyStatus("active")} /><Button text="Suspend" variant="outline" onClick={() => agencyStatus("suspended")} /><Button text="Deactivate" color="danger" onClick={() => agencyStatus("deactivated")} /></div><div className="tenant-console__convert"><h4>Invite another Partner Admin</h4><label>Full name<input value={form.adminName} onChange={(event) => setForm((value) => ({ ...value, adminName: event.target.value }))} /></label><label>Work email<input type="email" value={form.adminEmail} onChange={(event) => setForm((value) => ({ ...value, adminEmail: event.target.value }))} /></label><Button text="Send admin invitation" onClick={inviteAgencyAdmin} /></div></>}
        {section === "productRequests" && <><div className="tenant-console__convert"><h4>Requested upgrade</h4><p><strong>Current:</strong> {(selected.currentProducts || []).map(pretty).join(", ") || "None"}</p><p><strong>Requested:</strong> {(selected.requestedProducts || []).map(pretty).join(", ")}</p><p><strong>Business reason:</strong> {selected.reason}</p></div>{selected.status === "pending" && <><label>Decision note<textarea value={form.message} onChange={(event) => setForm((value) => ({ ...value, message: event.target.value }))} placeholder="Optional approval note or rejection context" /></label><div className="tenant-console__actions"><Button text="Approve products" onClick={() => decideProductRequest("approved")} /><Button text="Reject request" variant="outline" color="danger" onClick={() => decideProductRequest("rejected")} /></div></>}</>}
        {section === "deletions" && selected.status === "pending" && <div className="tenant-console__actions"><Button text="Approve safely" onClick={() => act(() => api.patch(`/tenancy/deletion-requests/${selected._id}`, { status: "approved", notes: "Approved after dependency validation." }), "Deletion request processed.")} /><Button text="Reject" variant="outline" onClick={() => act(() => api.patch(`/tenancy/deletion-requests/${selected._id}`, { status: "rejected" }), "Deletion request rejected.")} /></div>}
        {section === "products" && <div className="tenant-console__convert"><label>Product name<input value={form.productName} onChange={(event) => setForm((value) => ({ ...value, productName: event.target.value }))} /></label><label>Description<textarea value={form.productDescription} onChange={(event) => setForm((value) => ({ ...value, productDescription: event.target.value }))} /></label><label>Status<select value={form.productStatus} onChange={(event) => setForm((value) => ({ ...value, productStatus: event.target.value }))}><option value="active">Active</option><option value="inactive">Inactive</option></select></label><Button text="Save product" onClick={saveProduct} /></div>}
      </div></aside></div>}
    </section>
  );
}
