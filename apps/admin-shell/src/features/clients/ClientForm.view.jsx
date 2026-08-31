import React from "react";
import { PRODUCT_TYPE } from "@packages/trem-ui";
import "./ClientForm.scss";

const PRODUCTS = [PRODUCT_TYPE.TREVIO, PRODUCT_TYPE.TREVISTA, "dashboard", "admin", "agent"];

export default function ClientFormView({
  form,
  isEdit,
  saving,
  error,
  onChange,
  onBrandingChange,
  onSubmit,
  onCancel,
}) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="cf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cf-header">
          <h2>{isEdit ? "Edit Client" : "New Client"}</h2>
          <button className="cf-close" onClick={onCancel}>
            &times;
          </button>
        </div>

        {error && <div className="cf-error">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="cf-section">
            <h3>Details</h3>
            <div className="cf-row">
              <label>
                <span>Name *</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  required
                />
              </label>
              <label>
                <span>Slug *</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => onChange("slug", e.target.value)}
                  required
                  pattern="[a-z0-9\-]+"
                />
              </label>
            </div>
            <div className="cf-row">
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => onChange("contactEmail", e.target.value)}
                />
              </label>
              <label>
                <span>Phone</span>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => onChange("contactPhone", e.target.value)}
                />
              </label>
            </div>
            <div className="cf-row">
              <label>
                <span>Website</span>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => onChange("website", e.target.value)}
                />
              </label>
              <label>
                <span>Status</span>
                <select value={form.status} onChange={(e) => onChange("status", e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
          </div>

          <div className="cf-section">
            <h3>Product Branding</h3>
            <p className="cf-note">
              Customize how each product appears. Leave logo empty to use the shared TravelsTrem
              favicon.
            </p>
            {PRODUCTS.map((product) => {
              const b = form.branding[product] || {};
              return (
                <div key={product} className="cf-product">
                  <div className="cf-product__header">
                    <span className="cf-product__name">{b.name || product}</span>
                    <span className="cf-product__subtitle">{b.subtitle}</span>
                  </div>
                  <div className="cf-row cf-row--branding">
                    <label>
                      <span>Display Name</span>
                      <input
                        type="text"
                        value={b.name || ""}
                        onChange={(e) => onBrandingChange(product, "name", e.target.value)}
                      />
                    </label>
                    <label>
                      <span>Subtitle</span>
                      <input
                        type="text"
                        value={b.subtitle || ""}
                        onChange={(e) => onBrandingChange(product, "subtitle", e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cf-actions">
            <button type="button" className="btn btn--ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
