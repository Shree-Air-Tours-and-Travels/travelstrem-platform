import React from "react";
import { AccountProfile } from "@packages/trem-ui";
import "./ProfileView.scss";

export default function ProfileView({
  user,
  onSaveProfile,
  onUpdatePassword,
  onUpdateAvatar,
  saving,
  passwordSaving,
  avatarSaving,
}) {
  const profileUser = { ...(user || {}), accountRole: "member" };
  const meaningfulRole = (value, ignored) => {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized && !ignored.includes(normalized);
  };
  const hasElevatedIdentity = Boolean(
    meaningfulRole(user?.adminLevel, ["none", "not_required"]) ||
      meaningfulRole(user?.agencyRole, ["none", "member", "not_required"]) ||
      meaningfulRole(user?.agentApprovalStatus, ["none", "not_required"]) ||
      user?.agentRef ||
      user?.agencyRef ||
      user?.partnerAgencyRef,
  );

  return (
    <div className="dpv">
      <AccountProfile
        user={profileUser}
        title="Profile"
        subtitle="View and manage your TravelsTREM account."
        portalLabel="Traveller"
        roleLabel="Logged in as"
        saving={saving}
        passwordSaving={passwordSaving}
        avatarSaving={avatarSaving}
        showExtendedAccountDetails={hasElevatedIdentity}
        onSaveProfile={onSaveProfile}
        onUpdatePassword={onUpdatePassword}
        onUpdateAvatar={onUpdateAvatar}
      />
    </div>
  );
}
