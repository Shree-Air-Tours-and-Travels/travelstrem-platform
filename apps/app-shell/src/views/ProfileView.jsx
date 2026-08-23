import React from "react";
import ProfileForm from "../components/ProfileForm";
import "./ProfileView.scss";

export default function ProfileView({ user, onSaveProfile, saving }) {
  return (
    <div className="dpv">
      <div className="dpv__header">
        <h1 className="dpv__title">Profile</h1>
        <p className="dpv__subtitle">Manage your account settings</p>
      </div>

      <div className="dpv__grid">
        <div className="dpv__main">
          <ProfileForm user={user} onSave={onSaveProfile} loading={saving} />
        </div>

        <div className="dpv__side">
          <div className="dpv__card">
            <div className="dpv__avatar">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            <h3 className="dpv__name">{user?.name || "User"}</h3>
            <p className="dpv__email">{user?.email || ""}</p>
            {user?.phone && <p className="dpv__phone">{user.phone}</p>}
          </div>

          <div className="dpv__card">
            <h4 className="dpv__card-title">Account Details</h4>
            <div className="dpv__detail">
              <span className="dpv__detail-label">Member since</span>
              <span className="dpv__detail-value">{formatDate(user?.createdAt)}</span>
            </div>
            <div className="dpv__detail">
              <span className="dpv__detail-label">User ID</span>
              <span className="dpv__detail-value dpv__detail-value--mono">
                {user?.id?.slice(-8) || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}
