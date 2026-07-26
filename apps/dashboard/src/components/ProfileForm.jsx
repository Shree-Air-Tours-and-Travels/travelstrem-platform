import React, { useState } from "react";
import "./ProfileForm.scss";

export default function ProfileForm({ user, onSave, loading }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaved(false);
    await onSave?.(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form className="dpf" onSubmit={handleSubmit}>
      <div className="dpf__header">
        <h3 className="dpf__title">Personal Information</h3>
        <p className="dpf__subtitle">Update your account details</p>
      </div>

      <div className="dpf__fields">
        <div className="dpf__field">
          <label className="dpf__label" htmlFor="profile-name">Full Name</label>
          <input
            id="profile-name"
            className="dpf__input"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
          />
        </div>
        <div className="dpf__field">
          <label className="dpf__label" htmlFor="profile-email">Email</label>
          <input
            id="profile-email"
            className="dpf__input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="your@email.com"
          />
        </div>
        <div className="dpf__field">
          <label className="dpf__label" htmlFor="profile-phone">Phone</label>
          <input
            id="profile-phone"
            className="dpf__input"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+91 XXXXX XXXXX"
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
