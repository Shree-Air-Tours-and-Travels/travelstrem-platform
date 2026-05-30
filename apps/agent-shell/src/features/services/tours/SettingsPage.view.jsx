import React from "react";
import { get } from "lodash";
import { Button, Icon, SubTitle } from "@packages/trem-ui";
import { AVATAR_ICONS } from "./tours.constants";
import pageConfig from "./settingsPage.config.json";

export default function SettingsPage({ profile, auth, onUpdatePassword, onUpdateAvatar, onUpdateProfile, setToast }) {
    const userName = get(profile, "name") || get(auth, "user.name") || "";
    const [name, setName] = React.useState(userName);
    const [profileSaving, setProfileSaving] = React.useState(false);
    const [passForm, setPassForm] = React.useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [passSubmitting, setPassSubmitting] = React.useState(false);
    const [passError, setPassError] = React.useState(null);
    const [avatarUpdating, setAvatarUpdating] = React.useState(false);
    const profileAvatar = get(profile, "avatar") || get(auth, "user.avatar") || "user";
    const [selectedAvatar, setSelectedAvatar] = React.useState(profileAvatar);
    const pwSection = pageConfig.sections.password;
    const pfSection = pageConfig.sections.profile;
    const toastTimerRef = React.useRef(null);

    React.useEffect(() => { setName(get(profile, "name") || get(auth, "user.name") || ""); }, [profile, auth]);
    React.useEffect(() => { setSelectedAvatar(profileAvatar); }, [profileAvatar]);
    React.useEffect(() => {
        return () => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);

    function dismissToastAfter(ms) {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), ms);
    }

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileSaving(true);
        try {
            await onUpdateProfile({ name });
            setToast({ message: pageConfig.toast.profileUpdated.message, type: pageConfig.toast.profileUpdated.type, visible: true });
            dismissToastAfter(3000);
        } catch (err) {
            setToast({ message: err.message || pageConfig.toast.profileFailed.message, type: "error", visible: true });
            dismissToastAfter(3000);
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePassChange = (field) => (e) => setPassForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handlePassSubmit = async (e) => {
        e.preventDefault();
        setPassError(null);
        if (passForm.newPassword.length < 6) { setPassError(pwSection.error.minLength); return; }
        if (passForm.newPassword !== passForm.confirmPassword) { setPassError(pwSection.error.mismatch); return; }
        setPassSubmitting(true);
        try {
            await onUpdatePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
            setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setToast({ message: pageConfig.toast.passwordUpdated.message, type: pageConfig.toast.passwordUpdated.type, visible: true });
            dismissToastAfter(3000);
        } catch (err) {
            setPassError(err.message || pageConfig.toast.passwordFailed.message);
        } finally {
            setPassSubmitting(false);
        }
    };

    const handleAvatarSelect = async (icon) => {
        if (icon === selectedAvatar) return;
        setSelectedAvatar(icon);
        setAvatarUpdating(true);
        try {
            await onUpdateAvatar(icon);
            setToast({ message: pageConfig.toast.avatarUpdated.message, type: pageConfig.toast.avatarUpdated.type, visible: true });
            dismissToastAfter(3000);
        } catch (err) {
            setSelectedAvatar(profileAvatar);
            setToast({ message: err.message || pageConfig.toast.avatarFailed.message, type: "error", visible: true });
            dismissToastAfter(3000);
        } finally {
            setAvatarUpdating(false);
        }
    };

    return (
        <section className="agent-main-widget agent-settings-widget">
            <header className="agent-widget-toolbar">
                <SubTitle text={pageConfig.pageTitle} />
            </header>
            <div className="agent-settings-content">
                <div className="agent-settings-section">
                    <SubTitle text={pfSection.title} />
                    <form className="settings-form" onSubmit={handleProfileSubmit}>
                        <label className="agency-form__field">
                            <span>{pfSection.fields.name.label}</span>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={pfSection.fields.name.placeholder} required />
                        </label>
                        <div className="settings-form__actions">
                            <Button type="submit" primaryClassName="btn" variant="solid" color="primary" text={profileSaving ? pfSection.buttons.save.saving : pfSection.buttons.save.text} disabled={profileSaving} />
                        </div>
                    </form>
                </div>
                <div className="agent-settings-section">
                    <SubTitle text={pwSection.title} />
                    <form className="settings-form" onSubmit={handlePassSubmit}>
                        {passError && <div className="agency-form__error">{passError}</div>}
                        <label className="agency-form__field">
                            <span>{pwSection.fields.currentPassword.label}</span>
                            <input type="password" value={passForm.currentPassword} onChange={handlePassChange("currentPassword")} placeholder={pwSection.fields.currentPassword.placeholder} required />
                        </label>
                        <label className="agency-form__field">
                            <span>{pwSection.fields.newPassword.label}</span>
                            <input type="password" value={passForm.newPassword} onChange={handlePassChange("newPassword")} placeholder={pwSection.fields.newPassword.placeholder} required />
                        </label>
                        <label className="agency-form__field">
                            <span>{pwSection.fields.confirmPassword.label}</span>
                            <input type="password" value={passForm.confirmPassword} onChange={handlePassChange("confirmPassword")} placeholder={pwSection.fields.confirmPassword.placeholder} required />
                        </label>
                        <div className="settings-form__actions">
                            <Button type="submit" primaryClassName="btn" variant="solid" color="primary" text={passSubmitting ? pwSection.buttons.update.updating : pwSection.buttons.update.text} disabled={passSubmitting} />
                        </div>
                    </form>
                </div>
                <div className="agent-settings-section">
                    <SubTitle text={pageConfig.sections.avatar.title} />
                    <p className="settings-avatar-hint">{pageConfig.sections.avatar.hint}</p>
                    <div className="settings-avatar-grid">
                        {AVATAR_ICONS.map((icon) => (
                            <button
                                key={icon}
                                type="button"
                                className={`settings-avatar-option ${icon === selectedAvatar ? "settings-avatar-option--active" : ""}`}
                                onClick={() => handleAvatarSelect(icon)}
                                disabled={avatarUpdating}
                                aria-label={icon}
                            >
                                <Icon name={icon} size={22} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
