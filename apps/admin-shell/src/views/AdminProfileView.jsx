import React, { useState } from "react";
import { InputField } from "@packages/trem-ui";
import "./AdminProfileView.scss";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function AdminProfileView({ user, onSaveProfile, saving }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email address";
    if (form.phone && !/^\+?[\d\s\-()]{7,15}$/.test(form.phone)) errs.phone = "Invalid phone number";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaved(false);
    if (!validate()) return;
    await onSaveProfile?.({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="apv">
      <div className="apv__header">
        <h1 className="apv__title">Profile</h1>
        <p className="apv__subtitle">Manage your admin account</p>
      </div>

      <div className="apv__grid">
        <div className="apv__main">
          <form className="apv__form" onSubmit={handleSubmit} noValidate>
            <div className="apv__form-header">
              <h3 className="apv__form-title">Personal Information</h3>
              <p className="apv__form-subtitle">Update your account details</p>
            </div>

            <div className="apv__fields">
              <div className="apv__field">
                <label className="apv__label" htmlFor="admin-name">Full Name</label>
                <InputField
                  id="admin-name"
                  variant="text"
                  value={form.name}
                  onChange={(val) => setForm({ ...form, name: val })}
                  placeholder="Your name"
                  maxLength={100}
                  error={errors.name}
                />
              </div>
              <div className="apv__field">
                <label className="apv__label" htmlFor="admin-email">Email</label>
                <InputField
                  id="admin-email"
                  variant="email"
                  value={form.email}
                  onChange={(val) => setForm({ ...form, email: val })}
                  placeholder="your@email.com"
                  maxLength={254}
                  error={errors.email}
                />
              </div>
              <div className="apv__field">
                <label className="apv__label" htmlFor="admin-phone">Phone</label>
                <InputField
                  id="admin-phone"
                  variant="tel"
                  value={form.phone}
                  onChange={(val) => setForm({ ...form, phone: val })}
                  placeholder="+91 XXXXX XXXXX"
                  maxLength={15}
                  error={errors.phone}
                />
              </div>
            </div>

            <div className="apv__form-footer">
              <button type="submit" className="apv__save" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {saved && <span className="apv__saved">Saved successfully</span>}
            </div>
          </form>
        </div>

        <div className="apv__side">
          <div className="apv__card">
            <div className="apv__avatar">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            <h3 className="apv__name">{user?.name || "Admin"}</h3>
            <p className="apv__email">{user?.email || ""}</p>
            {user?.phone && <p className="apv__phone">{user.phone}</p>}
          </div>

          <div className="apv__card">
            <h4 className="apv__card-title">Account Details</h4>
            <div className="apv__detail">
              <span className="apv__detail-label">Role</span>
              <span className="apv__detail-value apv__detail-value--badge">{user?.role || "admin"}</span>
            </div>
            {user?.adminLevel && (
              <div className="apv__detail">
                <span className="apv__detail-label">Admin Level</span>
                <span className="apv__detail-value apv__detail-value--badge">{user.adminLevel}</span>
              </div>
            )}
            <div className="apv__detail">
              <span className="apv__detail-label">Member since</span>
              <span className="apv__detail-value">{formatDate(user?.createdAt)}</span>
            </div>
            <div className="apv__detail">
              <span className="apv__detail-label">User ID</span>
              <span className="apv__detail-value apv__detail-value--mono">{user?.id?.slice(-8) || "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
