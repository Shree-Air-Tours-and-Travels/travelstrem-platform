import React from "react";
import { get } from "lodash";
import { Button, StatusBadge, SubTitle } from "@packages/trem-ui";
import pageConfig from "./partnerAgencyPage.config.json";
import api from "../../../services/apiClient";

export default function PartnerAgencyPage({ agencyApplication, agencyLoading, auth, onApplyAgency, fetchAgency }) {
    const [form, setForm] = React.useState({ agencyName: "", contactName: "", contactEmail: "", contactPhone: "", website: "", gstNumber: "" });
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState(null);
    const [productState, setProductState] = React.useState({ loading: false, products: [], requests: [], selected: [], reason: "", message: "" });
    const isLinked = auth.user?.partnerAgencyRef || get(agencyApplication, "status") === "approved";
    const isPartnerAdmin = auth.user?.agencyRole === "partner_admin";

    const loadProductRequests = React.useCallback(async () => {
        if (!isLinked || !isPartnerAdmin) return;
        setProductState((current) => ({ ...current, loading: true, message: "" }));
        try {
            const response = await api.get("/tenancy/product-access-requests", { params: { limit: 20 } });
            const data = response?.data?.componentData?.data || {};
            setProductState((current) => ({ ...current, loading: false, products: data.products || [], requests: data.items || [] }));
        } catch (error) {
            setProductState((current) => ({ ...current, loading: false, message: error?.response?.data?.message || "Product requests could not be loaded." }));
        }
    }, [isLinked, isPartnerAdmin]);
    React.useEffect(() => { loadProductRequests(); }, [loadProductRequests]);

    const submitProductRequest = async () => {
        setProductState((current) => ({ ...current, loading: true, message: "" }));
        try {
            await api.post("/tenancy/product-access-requests", { requestedProducts: productState.selected, reason: productState.reason });
            setProductState((current) => ({ ...current, selected: [], reason: "", message: "Your product request is now awaiting Master Admin review." }));
            await loadProductRequests();
        } catch (error) {
            setProductState((current) => ({ ...current, loading: false, message: error?.response?.data?.message || "Product request could not be submitted." }));
        }
    };

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
        const app = agencyApplication?.agency || agencyApplication || {};
        const statusLabel = app.status || "approved";
        const enabledProducts = app.productAccess || auth.user?.productAccess || [];
        const availableProducts = productState.products.filter((product) => !enabledProducts.includes(product.key));
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
                <div className="agency-section agency-products">
                    <div className="agency-section__head"><div><h3>Product access</h3><p>Products currently enabled for your agency and requests awaiting platform approval.</p></div></div>
                    <div className="agency-products__enabled">{enabledProducts.map((product) => <span key={product}>{product.replace(/\b\w/g, (letter) => letter.toUpperCase())}</span>)}{!enabledProducts.length && <small>No products are currently enabled.</small>}</div>
                    {isPartnerAdmin && <div className="agency-products__request"><h4>Request another product</h4>{availableProducts.length ? <><div className="agency-products__options">{availableProducts.map((product) => <label key={product.key}><input type="checkbox" checked={productState.selected.includes(product.key)} onChange={(event) => setProductState((current) => ({ ...current, selected: event.target.checked ? [...new Set([...current.selected, product.key])] : current.selected.filter((key) => key !== product.key) }))} /><span><strong>{product.name}</strong><small>{product.description || "Extend this agency workspace with this product."}</small></span></label>)}</div><label className="agency-products__reason"><span>Business requirement</span><textarea rows="4" value={productState.reason} onChange={(event) => setProductState((current) => ({ ...current, reason: event.target.value }))} placeholder="Explain how your agency plans to use these products." /></label><Button variant="solid" color="primary" text={productState.loading ? "Submitting..." : "Submit product request"} disabled={productState.loading || !productState.selected.length || productState.reason.trim().length < 10} onClick={submitProductRequest} /></> : <p>Every currently available platform product is already enabled.</p>}</div>}
                    {productState.message && <div className="agency-form__error" role="status">{productState.message}</div>}
                    {isPartnerAdmin && productState.requests.length > 0 && <div className="agency-products__history"><h4>Request history</h4>{productState.requests.map((request) => <article key={request._id}><div><strong>{request.requestedProducts.map((product) => product.replace(/\b\w/g, (letter) => letter.toUpperCase())).join(", ")}</strong><small>{new Date(request.createdAt).toLocaleDateString()}</small></div><StatusBadge value={request.status} /></article>)}</div>}
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
