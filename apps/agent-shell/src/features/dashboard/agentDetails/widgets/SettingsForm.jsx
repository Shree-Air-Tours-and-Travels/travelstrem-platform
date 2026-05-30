import React, { useState, useEffect } from "react";
import { Button, InputField, Title } from "@packages/trem-ui";
import { fetchData } from "@packages/trem-utils";
import { getLabel, getWidgetProps } from "./_helpers";

export default function SettingsForm({ widget, labels, profile, icons = [], onProfileUpdate }) {
    const props = getWidgetProps(widget);
    const sections = props.sections || [];
    const [form, setForm] = useState({ name: "", avatar: "user", currentPassword: "", newPassword: "", confirmPassword: "" });
    const [saving, setSaving] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (profile) {
            setForm((prev) => ({ ...prev, name: profile.name || "", avatar: profile.avatar || "user" }));
        }
    }, [profile]);

    const showToast = (msg, type = "success") => {
        setToast({ message: msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const saveProfile = async () => {
        setSaving("profile");
        try {
            const res = await fetchData("/auth/profile", {
                method: "PUT",
                body: JSON.stringify({ name: form.name, avatar: form.avatar }),
                headers: { "Content-Type": "application/json" },
            });
            if (res?.status === "success") {
                onProfileUpdate?.(res.componentData?.data);
                showToast(getLabel(labels, "toastProfileSaved", "Profile updated successfully"));
            } else {
                showToast(res?.message || getLabel(labels, "toastError", "Something went wrong"), "error");
            }
        } catch {
            showToast(getLabel(labels, "toastError", "Something went wrong"), "error");
        } finally {
            setSaving(null);
        }
    };

    const savePassword = async () => {
        if (form.newPassword !== form.confirmPassword) {
            showToast(getLabel(labels, "passwordMismatch", "Passwords do not match"), "error");
            return;
        }
        if (form.newPassword.length < 6) {
            showToast(getLabel(labels, "passwordMinLength", "Password must be at least 6 characters"), "error");
            return;
        }
        setSaving("password");
        try {
            const res = await fetchData("/auth/password", {
                method: "PUT",
                body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
                headers: { "Content-Type": "application/json" },
            });
            if (res?.status === "success") {
                setForm((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
                showToast(getLabel(labels, "toastPasswordSaved", "Password updated successfully"));
            } else {
                showToast(res?.message || getLabel(labels, "toastError", "Something went wrong"), "error");
            }
        } catch {
            showToast(getLabel(labels, "toastError", "Something went wrong"), "error");
        } finally {
            setSaving(null);
        }
    };

    return (
        <section className="dashboard-settings">
            {toast && (
                <div className={`dashboard-settings__toast ${toast.type === "error" ? "is-error" : ""}`}>
                    {toast.message}
                </div>
            )}
            {sections.map((section) => (
                <div key={section.id} className="dashboard-settings__section">
                    <Title text={getLabel(labels, section.titleRef, section.id)} />
                    <div className="dashboard-settings__fields">
                        {section.fields.map((field) => {
                            const label = getLabel(labels, field.labelRef, field.id);
                            const placeholder = getLabel(labels, field.placeholderRef, "");
                            if (field.type === "iconPicker") {
                                return (
                                    <div key={field.id} className="dashboard-settings__field">
                                        <label>{label}</label>
                                        <div className="dashboard-settings__icon-grid">
                                            {icons.map((icon) => (
                                                <Button
                                                    key={icon}
                                                    variant="outline"
                                                    iconLeft={icon}
                                                    isCircular
                                                    primaryClassName={`dashboard-settings__icon-btn${form.avatar === icon ? " is-active" : ""}`}
                                                    onClick={() => setForm((prev) => ({ ...prev, avatar: icon }))}
                                                    title={icon}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div key={field.id} className="dashboard-settings__field">
                                    <label htmlFor={`settings-${field.id}`}>{label}</label>
                                    <InputField
                                        variant={field.type || "text"}
                                        placeholder={placeholder}
                                        value={form[field.id] || ""}
                                        onChange={(value) => setForm((prev) => ({ ...prev, [field.id]: value }))}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    {section.id === "profile" && (
                        <Button
                            variant="solid"
                            color="primary"
                            text={saving === "profile" ? getLabel(labels, "btnUpdating", "Saving...") : getLabel(labels, "btnSave", "Save Changes")}
                            onClick={saveProfile}
                            disabled={saving === "profile"}
                            primaryClassName="dashboard-settings__submit"
                        />
                    )}
                    {section.id === "password" && (
                        <Button
                            variant="solid"
                            color="primary"
                            text={saving === "password" ? getLabel(labels, "btnUpdating", "Saving...") : getLabel(labels, "btnSave", "Save Changes")}
                            onClick={savePassword}
                            disabled={saving === "password"}
                            primaryClassName="dashboard-settings__submit"
                        />
                    )}
                </div>
            ))}
        </section>
    );
}
