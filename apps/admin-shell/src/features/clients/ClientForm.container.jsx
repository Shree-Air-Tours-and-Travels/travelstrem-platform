import React, { useState, useEffect } from "react";
import ClientFormView from "./ClientForm.view";

const DEFAULT_BRANDING = {
  trevio: { logoSrc: "/favicon.png", name: "Trevio", subtitle: "by TravelsTrem", initial: "" },
  trevista: { logoSrc: "/favicon.png", name: "Trevista", subtitle: "by TravelsTrem", initial: "" },
  dashboard: { logoSrc: "/favicon.png", name: "TravelsTrem", subtitle: "Dashboard", initial: "" },
  admin: { logoSrc: "/favicon.png", name: "TravelsTREM", subtitle: "Admin", initial: "" },
  agent: { logoSrc: "/favicon.png", name: "TravelsTrem", subtitle: "Partner Portal", initial: "" },
};

export default function ClientFormContainer({ client, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    status: "active",
    branding: JSON.parse(JSON.stringify(DEFAULT_BRANDING)),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (client) {
      const branding = client.branding || {};
      const brandingMap = {};
      for (const [key, val] of Object.entries(branding)) {
        brandingMap[key] = { ...DEFAULT_BRANDING[key], ...val };
      }
      setForm({
        name: client.name || "",
        slug: client.slug || "",
        contactEmail: client.contactEmail || "",
        contactPhone: client.contactPhone || "",
        website: client.website || "",
        status: client.status || "active",
        branding: { ...JSON.parse(JSON.stringify(DEFAULT_BRANDING)), ...brandingMap },
      });
    }
  }, [client]);

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && !client) {
        next.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
      return next;
    });
  };

  const handleBrandingChange = (product, field, value) => {
    setForm((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        [product]: { ...prev.branding[product], [field]: value },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      await onSave(form);
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClientFormView
      form={form}
      isEdit={!!client}
      saving={saving}
      error={error}
      onChange={handleChange}
      onBrandingChange={handleBrandingChange}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    />
  );
}
