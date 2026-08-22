import React, { useCallback, useEffect, useState } from "react";
import { Button, InputField, NoDataFound, Spinner, StatusBadge } from "@packages/trem-ui";
import api from "../../services/apiClient";
import "./PartnerWorkspace.scss";

const unwrap = (response) => response?.data?.componentData?.data ?? response?.data?.data ?? response?.data;
const pretty = (value = "") => String(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const configs = {
  dashboard: { endpoint: "/tenancy/dashboard", title: "Agency dashboard" },
  agents: { endpoint: "/tenancy/agencies/me/users", title: "Agency agents" },
  customers: { endpoint: "/tenancy/customers", title: "Customers" },
  reports: { endpoint: "/tenancy/reports", title: "Agency reports" },
  deletions: { endpoint: "/tenancy/deletion-requests", title: "Deletion requests" },
  notifications: { endpoint: "/tenancy/notifications", title: "Notifications" },
};

export default function PartnerWorkspace({ tab, user }) {
  const config = configs[tab] || configs.dashboard;
  const [state, setState] = useState({ loading: true, error: "", value: null });
  const [notice, setNotice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", designation: "", reason: "" });
  const isAdmin = user?.agencyRole === "partner_admin";
  const agencyId = user?.agencyId || "me";
  const endpoint = tab === "agents" ? `/tenancy/agencies/${agencyId}/users` : config.endpoint;
  const load = useCallback(async () => { setState((value) => ({ ...value, loading: true, error: "" })); try { const response = await api.get(endpoint, { params: { limit: 50 } }); setState({ loading: false, error: "", value: unwrap(response) }); } catch (error) { setState({ loading: false, error: error?.response?.data?.message || "This workspace could not be loaded.", value: null }); } }, [endpoint]);
  useEffect(() => { load(); }, [load]);
  const perform = async (request, message) => { try { await request(); setNotice(message); setShowCreate(false); setForm({ name: "", email: "", phone: "", designation: "", reason: "" }); await load(); } catch (error) { setNotice(error?.response?.data?.message || "Action failed."); } };
  const create = () => tab === "agents"
    ? perform(() => api.post(`/tenancy/agencies/${agencyId}/users/invite`, { ...form, agencyRole: "partner_agent", productKeys: user.productAccess || [] }), "Agent invited securely.")
    : perform(() => api.post("/tenancy/customers", form), "Customer added.");
  const items = state.value?.items || (Array.isArray(state.value) ? state.value : []);
  const metrics = state.value && !items.length ? Object.entries(state.value).filter(([, value]) => typeof value === "number") : [];
  const recentItems = tab === "dashboard" ? [
    ...(state.value?.recentTrips || []).map((item) => ({ ...item, workspaceKind: "Trip" })),
    ...(state.value?.recentCustomers || []).map((item) => ({ ...item, workspaceKind: "Customer" })),
  ].slice(0, 12) : [];

  return <section className="partner-workspace"><header><div><p>{isAdmin ? "Partner Admin" : "Partner Agent"}</p><h2>{config.title}</h2><span>{isAdmin ? "Agency-wide, tenant-isolated operations." : "Your assigned work and customers only."}</span></div><div className="partner-workspace__header-actions">{["agents", "customers"].includes(tab) && <Button text={tab === "agents" ? "Invite agent" : "Add customer"} onClick={() => setShowCreate(true)} />}<Button text="Refresh" variant="outline" onClick={load} /></div></header>
    {notice && <div className="partner-workspace__notice" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
    {state.loading ? <div className="partner-workspace__state"><Spinner label="Loading workspace" /></div> : state.error ? <div className="partner-workspace__state"><strong>Unable to load</strong><span>{state.error}</span><Button text="Try again" onClick={load} /></div> : metrics.length ? <><div className="partner-workspace__metrics">{metrics.map(([key, value]) => <article key={key}><span>{pretty(key)}</span><strong>{value}</strong></article>)}</div>{recentItems.length > 0 && <><h3>Recent activity</h3><div className="partner-workspace__list">{recentItems.map((item, index) => <article key={`${item.workspaceKind}-${item._id || index}`}><div><strong>{item.title || item.name || item.bookingRef || pretty(item.workspaceKind)}</strong><span>{item.workspaceKind}</span></div><StatusBadge value={item.status || "active"} /></article>)}</div></>}</> : items.length ? <div className="partner-workspace__list">{items.map((item) => <article key={item._id}><div><strong>{item.name || item.title || item.email || pretty(item.type)}</strong><span>{item.email || item.phone || item.message || item.reason || ""}</span></div><StatusBadge value={item.accountStatus || item.status || (item.readAt ? "read" : "new")} />{tab === "agents" && isAdmin && item.agencyRole === "partner_agent" && <div className="partner-workspace__actions"><Button text={item.accountStatus === "active" ? "Deactivate" : "Activate"} variant="outline" onClick={() => perform(() => api.patch(`/tenancy/users/${item._id}`, { accountStatus: item.accountStatus === "active" ? "deactivated" : "active" }), "Agent status updated.")} />{item.accountStatus === "invited" ? <Button text="Resend invite" variant="text" onClick={() => perform(() => api.post(`/tenancy/users/${item._id}/resend-invitation`), "Invitation resent.")} /> : <Button text="Send password reset" variant="text" onClick={() => perform(() => api.post("/auth/forgot-password", { email: item.email }), "Password reset instructions sent.")} />}<Button text="Request deletion" color="danger" variant="text" onClick={() => { setForm((value) => ({ ...value, agentId: item._id })); setShowCreate(true); }} /></div>}</article>)}</div> : <NoDataFound title="No records yet" description="New records will appear here as your agency works in TravelsTREM." />}
    {showCreate && <div className="partner-workspace__overlay" onMouseDown={(event) => event.target === event.currentTarget && setShowCreate(false)}><form className="partner-workspace__modal" onSubmit={(event) => { event.preventDefault(); form.agentId ? perform(() => api.post(`/tenancy/users/${form.agentId}/deletion-request`, { reason: form.reason }), "Deletion request sent to TravelsTREM.") : create(); }}><header><div><span>PARTNERTREM</span><h3>{form.agentId ? "Request permanent deletion" : tab === "agents" ? "Invite an agent" : "Add a customer"}</h3></div><Button type="button" variant="text" onClick={() => setShowCreate(false)} text="Close" /></header>{form.agentId ? <label>Reason<textarea value={form.reason} onChange={(event) => setForm((value) => ({ ...value, reason: event.target.value }))} required /></label> : <><InputField label="Full name" required value={form.name} onChange={(name) => setForm((value) => ({ ...value, name }))} /><InputField label="Email" variant="email" required value={form.email} onChange={(email) => setForm((value) => ({ ...value, email }))} /><InputField label="Phone" variant="tel" value={form.phone} onChange={(phone) => setForm((value) => ({ ...value, phone }))} />{tab === "agents" && <InputField label="Designation" value={form.designation} onChange={(designation) => setForm((value) => ({ ...value, designation }))} />}</>}<footer><Button type="button" variant="outline" text="Cancel" onClick={() => setShowCreate(false)} /><Button type="submit" text={form.agentId ? "Submit request" : tab === "agents" ? "Send invitation" : "Save customer"} /></footer></form></div>}
  </section>;
}
