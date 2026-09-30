import React from "react";
import { AccountProfile } from "@packages/trem-ui";

export default function ProfilePage({
  profile,
  auth,
  onUpdatePassword,
  onUpdateAvatar,
  onUpdateProfile,
  title = "Agent profile",
  subtitle = "View and manage your PartnerTREM account.",
  portalLabel = "Partner",
}) {
  const [saving, setSaving] = React.useState(false);
  const [passwordSaving, setPasswordSaving] = React.useState(false);
  const [avatarSaving, setAvatarSaving] = React.useState(false);
  const sourceUser = { ...(auth?.user || {}), ...(profile || {}) };
  const accountRole =
    sourceUser.agencyRole === "partner_admin"
      ? "Partner admin"
      : sourceUser.agencyRole === "partner_agent"
        ? "Partner agent"
        : "Agent";
  const user = { ...sourceUser, accountRole };

  const saveProfile = async (data) => {
    setSaving(true);
    try {
      await onUpdateProfile?.(data);
      return { success: true };
    } catch (error) {
      return { success: false, message: error?.message || "Profile update failed" };
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async (data) => {
    setPasswordSaving(true);
    try {
      await onUpdatePassword?.(data);
      return { success: true };
    } catch (error) {
      return { success: false, message: error?.message || "Password update failed" };
    } finally {
      setPasswordSaving(false);
    }
  };

  const updateAvatar = async (avatar) => {
    setAvatarSaving(true);
    try {
      await onUpdateAvatar?.(avatar);
      return { success: true };
    } catch (error) {
      return { success: false, message: error?.message || "Avatar update failed" };
    } finally {
      setAvatarSaving(false);
    }
  };

  return (
    <section className="agent-main-widget agent-profile-widget">
      <AccountProfile
        user={user}
        title={title}
        subtitle={subtitle}
        portalLabel={portalLabel}
        roleLabel="Logged in as"
        saving={saving}
        passwordSaving={passwordSaving}
        avatarSaving={avatarSaving}
        onSaveProfile={saveProfile}
        onUpdatePassword={updatePassword}
        onUpdateAvatar={updateAvatar}
        showRole
        showAdminLevel={false}
        showAgencyRole={false}
        showAgentStatus={false}
        showUserId={false}
        showExtraDetails={false}
      />
    </section>
  );
}
