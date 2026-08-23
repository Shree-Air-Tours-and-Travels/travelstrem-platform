import React, { useState } from "react";
import { InputField } from "@packages/trem-ui";
import "./ProfileForm.scss";

export default function ProfileForm({ user, onSave, loading }) {
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
    await onSave?.({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form className="dpf" onSubmit={handleSubmit} noValidate>
      <div className="dpf__header">
        <h3 className="dpf__title">Personal Information</h3>
        <p className="dpf__subtitle">Update your account details</p>
      </div>

      <div className="dpf__fields">
        <div className="dpf__field">
          <label className="dpf__label" htmlFor="profile-name">Full Name</label>
          <InputField
            id="profile-name"
            variant="text"
            value={form.name}
            onChange={(val) => setForm({ ...form, name: val })}
            placeholder="Your name"
            maxLength={100}
            error={errors.name}
          />
        </div>
        <div className="dpf__field">
          <label className="dpf__label" htmlFor="profile-email">Email</label>
          <InputField
            id="profile-email"
            variant="email"
            value={form.email}
            onChange={(val) => setForm({ ...form, email: val })}
            placeholder="your@email.com"
            maxLength={254}
            error={errors.email}
          />
        </div>
        <div className="dpf__field">
          <label className="dpf__label" htmlFor="profile-phone">Phone</label>
          <InputField
            id="profile-phone"
            variant="tel"
            value={form.phone}
            onChange={(val) => setForm({ ...form, phone: val })}
            placeholder="+91 XXXXX XXXXX"
            maxLength={15}
            error={errors.phone}
          />
        </div>
      </div>

      <div className="dpf__footer">
        <button type="submit" className="dpf__save" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
        {saved && <span className="dpf__saved">Saved successfully</span>}
      </div>
    </form>
  );
}
