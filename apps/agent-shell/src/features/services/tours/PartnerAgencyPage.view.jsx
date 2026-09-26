import React from "react";
import { get } from "lodash";
import { Button, Icon, StatusBadge, SubTitle } from "@packages/trem-ui";
import pageConfig from "./partnerAgencyPage.config.json";
import api from "../../../services/apiClient";

const maskValue = (value, type) => {
  const text = String(value || "");
  if (!text || text === "-") return "-";
  if (type === "email") {
    const [local = "", domain = ""] = text.split("@");
    return `${local.slice(0, 2)}${"•".repeat(Math.max(4, local.length - 2))}${domain ? `@${domain}` : ""}`;
  }
  if (type === "phone") {
    const visible = text.slice(-4);
    return `${"•".repeat(Math.max(6, text.length - visible.length))}${visible}`;
  }
  const visible = text.slice(-4);
  return `${"•".repeat(Math.max(6, text.length - visible.length))}${visible}`;
};

export default function PartnerAgencyPage({
  agencyApplication,
  agencyLoading,
  auth,
  onApplyAgency,
  fetchAgency,
  embedded = false,
}) {
  const [form, setForm] = React.useState({
    agencyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    gstNumber: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState(null);
  const [revealedFields, setRevealedFields] = React.useState(() => new Set());
  const [productState, setProductState] = React.useState({
    loading: false,
    products: [],
    agents: [],
    requests: [],
    selected: [],
    selectedAgentIds: [],
    reason: "",
    message: "",
  });
  const isLinked = auth.user?.partnerAgencyRef || get(agencyApplication, "status") === "approved";
  const isPartnerAdmin = auth.user?.agencyRole === "partner_admin";

  const toggleFieldVisibility = (key) => {
    setRevealedFields((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const loadProductRequests = React.useCallback(async () => {
    if (!isLinked || !isPartnerAdmin) return;
    setProductState((current) => ({ ...current, loading: true, message: "" }));
    try {
      const [response, teamResponse] = await Promise.all([
        api.get("/tenancy/product-access-requests", { params: { limit: 20 } }),
        api.get("/tenancy/agencies/me/users", { params: { status: "active", limit: 100 } }),
      ]);
      const data = response?.data?.componentData?.data || {};
      const team = teamResponse?.data?.componentData?.data || {};
      setProductState((current) => ({
        ...current,
        loading: false,
        products: data.products || [],
        agents: team.items || [],
        requests: data.items || [],
      }));
    } catch (error) {
      setProductState((current) => ({
        ...current,
        loading: false,
        message: error?.response?.data?.message || "Product requests could not be loaded.",
      }));
    }
  }, [isLinked, isPartnerAdmin]);
  React.useEffect(() => {
    loadProductRequests();
  }, [loadProductRequests]);

  const submitProductRequest = async () => {
    setProductState((current) => ({ ...current, loading: true, message: "" }));
    try {
      await api.post("/tenancy/product-access-requests", {
        requestedProducts: productState.selected,
        requestedAgentIds: productState.selectedAgentIds,
        reason: productState.reason,
      });
      setProductState((current) => ({
        ...current,
        selected: [],
        selectedAgentIds: [],
        reason: "",
        message: "Your product request is now awaiting Master Admin review.",
      }));
      await loadProductRequests();
    } catch (error) {
      setProductState((current) => ({
        ...current,
        loading: false,
        message: error?.response?.data?.message || "Product request could not be submitted.",
      }));
    }
  };

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!form.agencyName.trim()) {
      setSubmitError(pageConfig.errors.agencyNameRequired);
      return;
    }
    setSubmitting(true);
    try {
      await onApplyAgency({ ...form, contactEmail: form.contactEmail || auth.user?.email || "" });
      setForm({
        agencyName: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        website: "",
        gstNumber: "",
      });
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
    const availableProducts = productState.products.filter(
      (product) => !enabledProducts.includes(product.key),
    );
    const pendingProductKeys = new Set(
      productState.requests
        .filter((request) => request.status === "pending")
        .flatMap((request) => request.requestedProducts || []),
    );
    const activeAgents = productState.agents.filter((agent) => agent.accountStatus === "active");
    const allAgentsSelected =
      activeAgents.length > 0 && activeAgents.every((agent) => productState.selectedAgentIds.includes(agent._id));
    return (
      <section className={`agent-main-widget${embedded ? " is-agency-workspace-embedded" : ""}`}>
        <header className="agent-widget-toolbar">
          <SubTitle text={pageConfig.pageTitle} />
          <div className="agent-widget-actions">
            <Button
              primaryClassName="btn"
              variant="text"
              onClick={fetchAgency}
              iconLeft={pageConfig.buttons.refresh.iconLeft}
              text=""
              aria-label={pageConfig.refreshAriaLabel}
            />
          </div>
        </header>
        <div className="agency-section">
          <div className="agency-status-card">
            <div className="agency-status-card__intro">
              <span className="agency-status-card__icon" aria-hidden="true">
                <Icon name="shieldCheck" size={24} />
              </span>
              <div>
                <span>{pageConfig.profileSummary.eyebrow}</span>
                <h3>{pageConfig.profileSummary.title}</h3>
                <p>{pageConfig.profileSummary.description}</p>
              </div>
              <StatusBadge value={statusLabel} className="agency-status-badge" />
            </div>
            <dl className="agency-details">
              {pageConfig.details.map((detail) => {
                const value = app[detail.accessor] || auth.user?.[detail.accessor] || "-";
                const isRevealed = revealedFields.has(detail.key);
                return (
                  <div key={detail.key} className="agency-details__item">
                    <span className="agency-details__icon" aria-hidden="true">
                      <Icon name={detail.icon || "info"} size={18} />
                    </span>
                    <div className="agency-details__copy">
                      <dt>{detail.label}</dt>
                      <dd className={detail.sensitive && !isRevealed ? "is-masked" : ""}>
                        {detail.sensitive && !isRevealed
                          ? maskValue(value, detail.mask)
                          : value}
                      </dd>
                    </div>
                    {detail.sensitive && value !== "-" ? (
                      <button
                        type="button"
                        className="agency-details__visibility"
                        aria-label={`${
                          isRevealed
                            ? pageConfig.profileSummary.hideLabel
                            : pageConfig.profileSummary.showLabel
                        } ${detail.label}`}
                        aria-pressed={isRevealed}
                        onClick={() => toggleFieldVisibility(detail.key)}
                      >
                        <Icon name={isRevealed ? "eyeSlash" : "eye"} size={18} />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </dl>
            {app.notes && <p className="agency-notes">Notes: {app.notes}</p>}
          </div>
        </div>
        <div className="agency-section agency-products">
          <div className="agency-section__head">
            <div>
              <h3>Product access</h3>
              <p>
                Products currently enabled for your agency and requests awaiting platform approval.
              </p>
            </div>
          </div>
          <div className="agency-products__enabled">
            {enabledProducts.map((product) => (
              <span key={product}>
                {product.replace(/\b\w/g, (letter) => letter.toUpperCase())}
              </span>
            ))}
            {!enabledProducts.length && <small>No products are currently enabled.</small>}
          </div>
          {isPartnerAdmin && (
            <div className="agency-products__request">
              <h4>Request another product</h4>
              {availableProducts.length ? (
                <>
                  <div className="agency-products__options">
                    {availableProducts.map((product) => (
                      <label key={product.key}>
                        <input
                          type="checkbox"
                          checked={productState.selected.includes(product.key)}
                          disabled={pendingProductKeys.has(product.key)}
                          onChange={(event) =>
                            setProductState((current) => ({
                              ...current,
                              selected: event.target.checked
                                ? [...new Set([...current.selected, product.key])]
                                : current.selected.filter((key) => key !== product.key),
                            }))
                          }
                        />
                        <span>
                          <strong>{product.name}</strong>
                          <small>
                            {pendingProductKeys.has(product.key)
                              ? "A request for this product is awaiting review."
                              : product.description ||
                                "Extend this agency workspace with this product."}
                          </small>
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="agency-products__agents">
                    <div>
                      <strong>Agents who need access</strong>
                      <small>Only selected active agents receive the product when the request is approved.</small>
                    </div>
                    {activeAgents.length ? (
                      <>
                        <label className="agency-products__select-all">
                          <input
                            type="checkbox"
                            checked={allAgentsSelected}
                            onChange={(event) =>
                              setProductState((current) => ({
                                ...current,
                                selectedAgentIds: event.target.checked
                                  ? activeAgents.map((agent) => agent._id)
                                  : [],
                              }))
                            }
                          />
                          Select all agents
                        </label>
                        <div className="agency-products__options">
                          {activeAgents.map((agent) => (
                            <label key={agent._id}>
                              <input
                                type="checkbox"
                                checked={productState.selectedAgentIds.includes(agent._id)}
                                onChange={(event) =>
                                  setProductState((current) => ({
                                    ...current,
                                    selectedAgentIds: event.target.checked
                                      ? [...new Set([...current.selectedAgentIds, agent._id])]
                                      : current.selectedAgentIds.filter((id) => id !== agent._id),
                                  }))
                                }
                              />
                              <span>
                                <strong>{agent.name}</strong>
                                <small>{agent.email} · {agent.agencyRole === "partner_admin" ? "Partner Admin" : "Partner Agent"}</small>
                              </span>
                            </label>
                          ))}
                        </div>
                      </>
                    ) : (
                      <small>No active agents are available to receive access.</small>
                    )}
                  </div>
                  <label className="agency-products__reason">
                    <span>Business requirement</span>
                    <textarea
                      rows="4"
                      value={productState.reason}
                      onChange={(event) =>
                        setProductState((current) => ({ ...current, reason: event.target.value }))
                      }
                      placeholder="Explain how your agency plans to use these products."
                    />
                  </label>
                  <Button
                    variant="solid"
                    color="primary"
                    text={productState.loading ? "Submitting..." : "Submit product request"}
                    disabled={
                      productState.loading ||
                      !productState.selected.length ||
                      !productState.selectedAgentIds.length ||
                      productState.reason.trim().length < 10
                    }
                    onClick={submitProductRequest}
                  />
                </>
              ) : (
                <p>Every currently available platform product is already enabled.</p>
              )}
            </div>
          )}
          {productState.message && (
            <div className="agency-form__error" role="status">
              {productState.message}
            </div>
          )}
          {isPartnerAdmin && productState.requests.length > 0 && (
            <div className="agency-products__history">
              <h4>Request history</h4>
              {productState.requests.map((request) => (
                <article key={request._id}>
                  <div>
                    <strong>
                      {request.requestedProducts
                        .map((product) =>
                          product.replace(/\b\w/g, (letter) => letter.toUpperCase()),
                        )
                        .join(", ")}
                    </strong>
                    <small>{new Date(request.createdAt).toLocaleDateString()}</small>
                    <small>{request.requestedAgents?.length || 0} agents requested</small>
                  </div>
                  <StatusBadge value={request.status} />
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={`agent-main-widget${embedded ? " is-agency-workspace-embedded" : ""}`}>
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
              placeholder={
                field.key === "contactEmail"
                  ? auth.user?.email || field.placeholder
                  : field.placeholder
              }
              required={field.required}
            />
          </label>
        ))}
        <div className="agency-form__actions">
          <Button
            type="submit"
            primaryClassName="btn"
            variant="solid"
            color="primary"
            text={
              submitting ? pageConfig.buttons.submit.submitting : pageConfig.buttons.submit.text
            }
            disabled={submitting}
          />
        </div>
      </form>
    </section>
  );
}
