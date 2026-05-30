import React from "react";
import { get } from "lodash";
import { Button, StatusBadge, SubTitle } from "@packages/trem-ui";
import pageConfig from "./partnerAgencyPage.config.json";

export default function PartnerAgencyPage({ agencyApplication, agencyLoading, auth, onApplyAgency, fetchAgency }) {
    const [form, setForm] = React.useState({ agencyName: "", contactName: "", contactEmail: "", contactPhone: "", website: "", gstNumber: "" });
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState(null);
    const isLinked = auth.user?.partnerAgencyRef || get(agencyApplication, "status") === "approved";

    const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(null);
        if (!form.agencyName.trim()) { setSubmitError(pageConfig.errors.agencyNameRequired); return; }
        setSubmitting(true);
        try {
            await onApplyAgency({ ...form, contactEmail: form.contactEmail || auth.user?.email || "" });
            setForm({ agencyName: "", contactName: "", contactEmail: "", contactPhone: "", website: "", gstNumber: "" });
        } catch (err) {
            setSubmitError(err.message || pageConfig.errors.submissionFailed);
        } finally {
            setSubmitting(false);
        }
    };

    if (agencyLoading) {
        return <div className="agency-loading">{pageConfig.loadingText}</div>;
    }

    if (agencyApplication || isLinked) {
        const app = agencyApplication || {};
        const statusLabel = app.status || "approved";
        return (
            <section className="agent-main-widget">
                <header className="agent-widget-toolbar">
                    <SubTitle text={pageConfig.pageTitle} />
                    <div className="agent-widget-actions">
                        <Button primaryClassName="btn" variant="text" onClick={fetchAgency} iconLeft={pageConfig.buttons.refresh.iconLeft} text="" aria-label={pageConfig.refreshAriaLabel} />
                    </div>
                </header>
                <div className="agency-section">
                    <div className="agency-status-card">
                        <StatusBadge value={statusLabel} className="agency-status-badge" />
                        <dl className="agency-details">
                            {pageConfig.details.map((d) => (
                                <div key={d.key}><dt>{d.label}</dt><dd>{app[d.accessor] || auth.user?.[d.accessor] || "-"}</dd></div>
                            ))}
                        </dl>
                        {app.notes && <p className="agency-notes">Notes: {app.notes}</p>}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="agent-main-widget">
            <header className="agent-widget-toolbar">
                <SubTitle text={pageConfig.applyTitle} />
            </header>
            <form className="agency-form" onSubmit={handleSubmit}>
                {submitError && <div className="agency-form__error">{submitError}</div>}
                {pageConfig.fields.map((field) => (
                    <label key={field.key} className="agency-form__field">
                        <span>{field.label}</span>
                        <input
                            type={field.type || "text"}
                            value={form[field.key]}
                            onChange={handleChange(field.key)}
                            placeholder={field.key === "contactEmail" ? (auth.user?.email || field.placeholder) : field.placeholder}
                            required={field.required}
                        />
                    </label>
                ))}
                <div className="agency-form__actions">
                    <Button type="submit" primaryClassName="btn" variant="solid" color="primary" text={submitting ? pageConfig.buttons.submit.submitting : pageConfig.buttons.submit.text} disabled={submitting} />
                </div>
            </form>
        </section>
    );
}
