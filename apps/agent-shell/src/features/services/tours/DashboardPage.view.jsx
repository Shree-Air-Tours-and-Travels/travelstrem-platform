import React from "react";
import { get } from "lodash";
import { Button, Icon, Paragraph, StatusBadge, SubTitle, Title } from "@packages/trem-ui";

function AgencySection({ application, loading, auth, onApply, onRefresh }) {
    const [form, setForm] = React.useState({ agencyName: "", contactName: "", contactEmail: "", contactPhone: "", website: "", gstNumber: "" });
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState(null);
    const isLinked = !!(auth.user?.partnerAgencyRef || get(application, "status") === "approved");

    const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(null);
        if (!form.agencyName.trim()) { setSubmitError("Agency name is required."); return; }
        setSubmitting(true);
        try {
            await onApply({ ...form, contactEmail: form.contactEmail || auth.user?.email || "" });
            setForm({ agencyName: "", contactName: "", contactEmail: "", contactPhone: "", website: "", gstNumber: "" });
        } catch (err) {
            setSubmitError(err.message || "Submission failed.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="agency-loading">Loading agency info...</div>;
    }

    if (application != null || isLinked) {
        const app = application || {};
        const statusLabel = app.status || "approved";
        return (
            <div className="agency-section">
                <div className="agency-section__head">
                    <SubTitle text="Partner Agency" />
                    <Button primaryClassName="btn" variant="text" onClick={onRefresh} iconLeft="refreshCw" text="" aria-label="Refresh agency" />
                </div>
                <div className="agency-status-card">
                    <StatusBadge value={statusLabel} className="agency-status-badge" />
                    <dl className="agency-details">
                        <div><dt>Agency Name</dt><dd>{app.agencyName || auth.user?.partnerAgencyRef || "-"}</dd></div>
                        <div><dt>Agency Ref</dt><dd>{app.partnerAgencyRef || auth.user?.partnerAgencyRef || "-"}</dd></div>
                        <div><dt>Contact</dt><dd>{app.contactName || "-"}</dd></div>
                        <div><dt>Email</dt><dd>{app.contactEmail || "-"}</dd></div>
                        <div><dt>Phone</dt><dd>{app.contactPhone || "-"}</dd></div>
                        <div><dt>Website</dt><dd>{app.website || "-"}</dd></div>
                        <div><dt>GST Number</dt><dd>{app.gstNumber || "-"}</dd></div>
                    </dl>
                    {app.notes && <p className="agency-notes">Notes: {app.notes}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="agency-section">
            <div className="agency-section__head">
                <SubTitle text="Apply for Partner Agency" />
            </div>
            <form className="agency-form" onSubmit={handleSubmit}>
                {submitError && <div className="agency-form__error">{submitError}</div>}
                <label className="agency-form__field">
                    <span>Agency Name *</span>
                    <input type="text" value={form.agencyName} onChange={handleChange("agencyName")} placeholder="Your agency name" required />
                </label>
                <label className="agency-form__field">
                    <span>Contact Name</span>
                    <input type="text" value={form.contactName} onChange={handleChange("contactName")} placeholder="Full name" />
                </label>
                <label className="agency-form__field">
                    <span>Contact Email</span>
                    <input type="email" value={form.contactEmail} onChange={handleChange("contactEmail")} placeholder={auth.user?.email || "Email address"} />
                </label>
                <label className="agency-form__field">
                    <span>Contact Phone</span>
                    <input type="tel" value={form.contactPhone} onChange={handleChange("contactPhone")} placeholder="Phone number" />
                </label>
                <label className="agency-form__field">
                    <span>Website</span>
                    <input type="url" value={form.website} onChange={handleChange("website")} placeholder="https://example.com" />
                </label>
                <label className="agency-form__field">
                    <span>GST Number</span>
                    <input type="text" value={form.gstNumber} onChange={handleChange("gstNumber")} placeholder="GSTIN" />
                </label>
                <div className="agency-form__actions">
                    <Button type="submit" primaryClassName="btn" variant="solid" color="primary" text={submitting ? "Submitting..." : "Submit Application"} disabled={submitting} />
                </div>
            </form>
        </div>
    );
}

export default function DashboardPage({ profile, auth, profileLoading, fetchProfile, agencyApplication, agencyLoading, onApplyAgency, fetchAgency, onNavigateSettings }) {
    const data = profile || {};
    return (
        <section className="agent-main-widget agent-profile-widget">
            <header className="agent-widget-toolbar">
                <SubTitle text="Profile" />
                <div className="agent-widget-actions">
                    <Button primaryClassName="btn" variant="text" onClick={onNavigateSettings} iconLeft="settings" text="" aria-label="Settings" />
                    <Button primaryClassName="btn" variant="outline" iconLeft="refreshCw" onClick={fetchProfile} text="Refresh" />
                </div>
            </header>
            <div className="agent-profile-grid">
                <article className="agent-profile-card-large">
                    <span className="agent-profile-card-large__avatar">{(data.name || auth.user?.name || "A").charAt(0).toUpperCase()}</span>
                    <div>
                        <Title text={profileLoading ? "Loading profile" : data.name || auth.user?.name || "Agent"} />
                        <Paragraph text={data.email || auth.user?.email || ""} />
                    </div>
                </article>
                <dl className="agent-profile-summary">
                    <div><dt>Role</dt><dd>{data.role ?? auth.role}</dd></div>
                    <div><dt>Status</dt><dd>{data.approvalStatus ?? "approved"}</dd></div>
                    <div><dt>Agency Ref</dt><dd>{data.agencyRef ?? "independent"}</dd></div>
                    <div><dt>Agent Ref</dt><dd>{data.agentRef ?? "unassigned"}</dd></div>
                </dl>
            </div>
            <AgencySection application={agencyApplication} loading={agencyLoading} auth={auth} onApply={onApplyAgency} onRefresh={fetchAgency} />
        </section>
    );
}
