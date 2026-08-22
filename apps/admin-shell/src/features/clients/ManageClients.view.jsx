import React, { useRef } from "react";
import { BrandLogo } from "@packages/trem-ui";
import "./ManageClients.scss";

const PRODUCTS = ["trevio", "trevista", "dashboard", "admin", "agent"];

function LogoUploadCell({ client, product, onUpload }) {
  const inputRef = useRef(null);
  const branding = client.branding?.[product] || {};
  const logoSrc = branding.logoSrc || "";

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onUpload(client._id, product, file);
    } catch (err) {
      alert(err.message || "Upload failed");
    }
    e.target.value = "";
  };

  return (
    <div className="client-logo-cell" onClick={() => inputRef.current?.click()}>
      <BrandLogo logoSrc={logoSrc} name="" size="small" />
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} style={{ display: "none" }} />
      <span className="client-logo-cell__label">{branding.name || product}</span>
    </div>
  );
}

export default function ManageClientsView({ clients, loading, error, onCreate, onEdit, onDelete, onLogoUpload, onRetry }) {
  if (loading) return <div className="mc-loading">Loading clients...</div>;
  if (error) return <div className="mc-error"><p>{error}</p><button onClick={onRetry}>Retry</button></div>;

  return (
    <div className="manage-clients">
      <div className="mc-header">
        <h1>Clients</h1>
        <button className="btn btn--primary" onClick={onCreate}>+ Add Client</button>
      </div>

      {clients.length === 0 ? (
        <div className="mc-empty">
          <p>No clients yet. Add your first client to start managing white-label branding.</p>
          <button className="btn btn--primary" onClick={onCreate}>Create Client</button>
        </div>
      ) : (
        <div className="mc-grid">
          {clients.map((client) => (
            <div key={client._id} className="mc-card">
              <div className="mc-card__header">
                <div>
                  <h3 className="mc-card__name">{client.name}</h3>
                  <span className="mc-card__slug">{client.slug}</span>
                </div>
                <span className={`mc-card__status mc-card__status--${client.status}`}>{client.status}</span>
              </div>

              <div className="mc-card__logos">
                {PRODUCTS.map((product) => (
                  <LogoUploadCell key={product} client={client} product={product} onUpload={onLogoUpload} />
                ))}
              </div>

              <div className="mc-card__actions">
                <button className="btn btn--ghost btn--sm" onClick={() => onEdit(client)}>Edit</button>
                <button className="btn btn--danger btn--sm" onClick={() => onDelete(client)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
