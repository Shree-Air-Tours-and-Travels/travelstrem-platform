import React from "react";
import { AccountProfile } from "@packages/trem-ui";
import "./AdminProfileView.scss";

export default function AdminProfileView({
  user,
  onSaveProfile,
  onUpdatePassword,
  onUpdateAvatar,
  saving,
  passwordSaving,
  avatarSaving,
}) {
  const accountRole = user?.adminLevel === "master" ? "master-admin" : "admin";
  const profileUser = { ...(user || {}), accountRole };

  return (
    <div className="apv">
      <AccountProfile
        user={profileUser}
        title="Admin profile"
        subtitle="View and manage your AdminTREM account."
        portalLabel="Admin"
        roleLabel="Logged in as"
        saving={saving}
        passwordSaving={passwordSaving}
        avatarSaving={avatarSaving}
        onSaveProfile={onSaveProfile}
        onUpdatePassword={onUpdatePassword}
        onUpdateAvatar={onUpdateAvatar}
      />
    </div>
  );
}
