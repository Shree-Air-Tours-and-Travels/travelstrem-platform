import React from "react";
import { useMasterOptions } from "@packages/trem-utils";
import Button from "../Button/Button.jsx";
import BottomSheet from "../BottomSheet/BottomSheet.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import InputField from "../InputField/InputField.jsx";
import {
  ACCOUNT_AVATAR_ICONS,
  isAccountAvatarIcon,
  resolveAccountAvatar,
} from "./accountAvatar.constants.js";
import "./AccountProfile.styles.scss";

export { ACCOUNT_AVATAR_ICONS } from "./accountAvatar.constants.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_BREAKPOINT = 640;

function useMobileLayout() {
  const [mobile, setMobile] = React.useState(
    () => typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT,
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return mobile;
}

const normalizeId = (user) => {
  const raw = user?.id ?? user?._id;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" || typeof raw === "bigint") return String(raw);
  if (typeof raw === "object") {
    if (typeof raw.$oid === "string") return raw.$oid;
    if (typeof raw.toHexString === "function") return raw.toHexString();
    const value = raw.toString?.();
    return value && value !== "[object Object]" ? value : "";
  }
  return "";
};

const normalizeDate = (value) => {
  if (!value) return null;
  const raw =
    typeof value === "object"
      ? value.$date || value.date || value.value || value.toISOString?.() || value.toString?.()
      : value;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = normalizeDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getInitial = (user) => (user?.name || user?.email || "U").charAt(0).toUpperCase();

function DetailRow({ label, value, badge = false, mono = false }) {
  if (!value) return null;
  return (
    <div className="trem-account-profile__detail">
      <span>{label}</span>
      <strong
        className={`${badge ? "is-badge" : ""} ${mono ? "is-mono" : ""}`.trim()}
      >
        {value}
      </strong>
    </div>
  );
}

function ProfileAvatar({ user, size = "large" }) {
  const avatar = resolveAccountAvatar(user?.avatar);
  const supportedIcon = isAccountAvatarIcon(avatar);
  return (
    <span className={`trem-account-profile__avatar trem-account-profile__avatar--${size}`}>
      {supportedIcon ? (
        <Icon name={avatar} size={size === "large" ? 34 : 22} />
      ) : (
        getInitial(user)
      )}
    </span>
  );
}

export default function AccountProfile({
  user = {},
  title = "Profile",
  subtitle = "Manage your account settings",
  roleLabel = "Role",
  portalLabel = "User",
  saving = false,
  passwordSaving = false,
  avatarSaving = false,
  canEditEmail = false,
  canEditPhone = true,
  onSaveProfile,
  onUpdatePassword,
  onUpdateAvatar,
  extraDetails = [],
  showExtendedAccountDetails = true,
  showRole = showExtendedAccountDetails,
  showAdminLevel = showExtendedAccountDetails,
  showAgencyRole = showExtendedAccountDetails,
  showAgentStatus = showExtendedAccountDetails,
  showUserId = showExtendedAccountDetails,
  showExtraDetails = showExtendedAccountDetails,
}) {
  const { options: masterOptions } = useMasterOptions(["common.phoneCountryCodes"]);
  const phoneCountryCodes = masterOptions["common.phoneCountryCodes"] || [];
  const [editing, setEditing] = React.useState(false);
  const [avatarOpen, setAvatarOpen] = React.useState(false);
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [passwordError, setPasswordError] = React.useState("");
  const mobile = useMobileLayout();
  const [form, setForm] = React.useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || user?.mobile || "",
  });
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  React.useEffect(() => {
    if (editing) return;
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || user?.mobile || "",
    });
  }, [editing, user?.email, user?.mobile, user?.name, user?.phone]);

  const userId = normalizeId(user);
  const accountRole = user?.accountRole || user?.displayRole || user?.role || portalLabel;
  const validateProfile = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (canEditEmail) {
      if (!form.email.trim()) next.email = "Email is required.";
      else if (!emailRegex.test(form.email.trim())) next.email = "Enter a valid email.";
    }
    if (form.phone && !/^\+?[\d\s\-()]{7,15}$/.test(form.phone)) {
      next.phone = "Enter a valid phone number.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    if (!validateProfile()) return;
    const result = await onSaveProfile?.({
      name: form.name.trim(),
      ...(canEditEmail ? { email: form.email.trim() } : {}),
      ...(canEditPhone ? { phone: form.phone.trim() } : {}),
    });
    if (result?.success === false) {
      setErrors({ form: result.message || "Unable to update profile." });
      return;
    }
    setEditing(false);
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    if (!passwordForm.currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    const result = await onUpdatePassword?.({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    if (result?.success === false) {
      setPasswordError(result.message || "Unable to update password.");
      return;
    }
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordOpen(false);
  };

  const selectAvatar = async (avatar) => {
    if (avatar === user?.avatar || avatarSaving) return;
    const result = await onUpdateAvatar?.(avatar);
    if (result?.success !== false) setAvatarOpen(false);
  };

  const avatarOptions = (
    <div className="trem-account-profile__avatar-grid">
      {ACCOUNT_AVATAR_ICONS.map((icon) => (
        <button
          key={icon}
          type="button"
          className={icon === user?.avatar ? "is-active" : ""}
          onClick={() => selectAvatar(icon)}
          disabled={avatarSaving}
          aria-label={`Use ${icon} avatar`}
        >
          <Icon name={icon} size={23} />
        </button>
      ))}
    </div>
  );

  return (
    <section className="trem-account-profile">
      <header className="trem-account-profile__page-head">
        <span className="trem-account-profile__eyebrow">
          <Icon name="shieldCheck" size={17} />
          {portalLabel} account
        </span>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </header>

      <div className="trem-account-profile__grid">
        <div className="trem-account-profile__main">
          <article className="trem-account-profile__card trem-account-profile__identity-card">
            <div className="trem-account-profile__identity">
              <ProfileAvatar user={user} />
              <div>
                <h2>{user?.name || "User"}</h2>
                <p>{user?.email || "No email configured"}</p>
                {user?.phone || user?.mobile ? <small>{user.phone || user.mobile}</small> : null}
              </div>
            </div>
            <div className="trem-account-profile__actions">
              <Button
                variant="outline"
                color="primary"
                iconLeft="edit"
                text={editing ? "Editing" : "Edit profile"}
                onClick={() => setEditing(true)}
                disabled={editing}
              />
              <Button
                variant="outline"
                color="primary"
                iconLeft="sparkles"
                text="Change avatar"
                onClick={() => setAvatarOpen((open) => !open)}
              />
            </div>
          </article>

          <article className="trem-account-profile__card">
            <div className="trem-account-profile__card-head">
              <div>
                <h3>Personal information</h3>
                <p>{editing ? "Update only the fields that should change." : "Verified account details."}</p>
              </div>
              {!editing ? (
                <Button variant="text" color="primary" iconLeft="edit" text="Edit" onClick={() => setEditing(true)} />
              ) : null}
            </div>

            {!editing ? (
              <dl className="trem-account-profile__readonly">
                <DetailRow label="Full name" value={user?.name || "—"} />
                <DetailRow label="Email" value={user?.email || "—"} />
                <DetailRow label="Phone" value={user?.phone || user?.mobile || "—"} />
              </dl>
            ) : (
              <form className="trem-account-profile__form" onSubmit={submitProfile} noValidate>
                {errors.form ? <p className="trem-account-profile__error">{errors.form}</p> : null}
                <label>
                  <span>Full name</span>
                  <InputField
                    variant="text"
                    value={form.name}
                    onChange={(value) => setForm((current) => ({ ...current, name: value }))}
                    maxLength={100}
                    error={errors.name}
                  />
                </label>
                <label>
                  <span>Email</span>
                  <InputField
                    variant="email"
                    value={form.email}
                    onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                    disabled={!canEditEmail}
                    maxLength={254}
                    error={errors.email}
                  />
                </label>
                {canEditPhone ? (
                  <label>
                    <span>Phone</span>
                    <InputField
                      variant="tel"
                      value={form.phone}
                      onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
                      countryCodeOptions={phoneCountryCodes}
                      maxLength={15}
                      error={errors.phone}
                    />
                  </label>
                ) : null}
                <div className="trem-account-profile__form-actions">
                  <Button type="submit" variant="solid" color="primary" text={saving ? "Saving…" : "Save changes"} disabled={saving} />
                  <Button
                    variant="text"
                    color="primary"
                    text="Cancel"
                    disabled={saving}
                    onClick={() => {
                      setEditing(false);
                      setErrors({});
                    }}
                  />
                </div>
              </form>
            )}
          </article>

          <article className="trem-account-profile__card">
            <div className="trem-account-profile__card-head">
              <div>
                <h3>Password & security</h3>
                <p>Change your password without leaving the profile page.</p>
              </div>
              <Button
                variant={passwordOpen ? "text" : "outline"}
                color="primary"
                iconLeft="lock"
                text={passwordOpen ? "Close" : "Reset password"}
                onClick={() => setPasswordOpen((open) => !open)}
              />
            </div>
            {passwordOpen ? (
              <form className="trem-account-profile__form" onSubmit={submitPassword}>
                <div className="trem-account-profile__password-help">
                  <Icon name="info" size={18} />
                  <span>
                    If you do not remember your current password, sign out and use Forgot password
                    from the sign-in page.
                  </span>
                </div>
                {passwordError ? <p className="trem-account-profile__error">{passwordError}</p> : null}
                <label>
                  <span>Current password</span>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        currentPassword: event.target.value,
                      }))
                    }
                    autoComplete="current-password"
                    required
                  />
                </label>
                <label>
                  <span>New password</span>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                    }
                    autoComplete="new-password"
                    required
                  />
                </label>
                <label>
                  <span>Confirm new password</span>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                    required
                  />
                </label>
                <div className="trem-account-profile__form-actions">
                  <Button type="submit" variant="solid" color="primary" text={passwordSaving ? "Updating…" : "Update password"} disabled={passwordSaving} />
                </div>
              </form>
            ) : (
              <div className="trem-account-profile__security-note">
                <Icon name="shield" size={19} />
                <span>For security, changing password revokes existing sessions. You may need to sign in again on other devices.</span>
              </div>
            )}
          </article>
        </div>

        <aside className="trem-account-profile__side">
          {avatarOpen && !mobile ? (
            <article className="trem-account-profile__card">
              <div className="trem-account-profile__card-head">
                <div>
                  <h3>Choose avatar</h3>
                  <p>Pick an icon for all portals.</p>
                </div>
              </div>
              {avatarOptions}
            </article>
          ) : (
            <article className="trem-account-profile__card trem-account-profile__summary">
              <ProfileAvatar user={user} />
              <h3>{user?.name || "User"}</h3>
              <p>{user?.email || ""}</p>
            </article>
          )}

          <article className="trem-account-profile__card">
            <h3 className="trem-account-profile__side-title">Account details</h3>
            {showRole && (
              <DetailRow label={roleLabel} value={accountRole} badge />
            )}
            {showAdminLevel && user?.adminLevel && (
              <DetailRow label="Admin level" value={user.adminLevel} badge />
            )}
            {showAgencyRole && user?.agencyRole && (
              <DetailRow label="Agency role" value={user.agencyRole} badge />
            )}
            {showAgentStatus && user?.agentApprovalStatus && (
              <DetailRow label="Agent status" value={user.agentApprovalStatus} badge />
            )}
            <DetailRow label="Member since" value={formatDate(user?.createdAt)} />
            {showUserId && (
              <DetailRow label="User ID" value={userId ? userId.slice(-8) : "—"} mono />
            )}
            {showExtraDetails &&
              extraDetails.map((item) => <DetailRow key={item.label} {...item} />)}
          </article>
        </aside>
      </div>

      <BottomSheet
        open={avatarOpen && mobile}
        onClose={() => setAvatarOpen(false)}
        title="Choose avatar"
        closeLabel="Close avatar picker"
      >
        <p className="trem-account-profile__avatar-sheet-copy">
          Pick an icon for all portals.
        </p>
        {avatarOptions}
      </BottomSheet>
    </section>
  );
}
