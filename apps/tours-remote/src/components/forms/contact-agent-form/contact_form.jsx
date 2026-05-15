// src/components/forms/ContactForm.jsx
import React from "react";
import PropTypes from "prop-types";

/**
 * ContactForm
 * - Renders fields based on `fieldsMeta` (array of { name, label, type, ... })
 * - Uses controlled values from `formValues`
 * - Calls onChange(name, value) for updates
 * - Renders submit / cancel buttons using passed Button component
 */
const ContactForm = ({
    fieldsMeta = [],
    formValues = {},
    onChange,
    onSubmit,
    onCancel,
    submitting = false,
    submitText = "Send Request",
    errors = {},
    Button
}) => {
    const renderField = (f) => {
        const val = formValues[f.name] ?? "";
        const type = f.type ?? "text";

        // For now we render standard input types (text, email, tel, textarea)
        if (type === "textarea") {
            return (
                <textarea
                    name={f.name}
                    value={val}
                    onChange={(e) => onChange(f.name, e.target.value)}
                    style={{ ...styles.input, ...(errors[f.name] ? styles.inputError : {}) }}
                    placeholder={f.placeholder ?? ""}
                    aria-invalid={!!errors[f.name]}
                />
            );
        }

        // default input
        return (
            <input
                name={f.name}
                type={type}
                value={val}
                onChange={(e) => onChange(f.name, e.target.value)}
                style={{ ...styles.input, ...(errors[f.name] ? styles.inputError : {}) }}
                placeholder={f.placeholder ?? ""}
                aria-invalid={!!errors[f.name]}
            />
        );
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(e); }}>
            {fieldsMeta.map((f) => (
                <div key={f.name} style={{ marginTop: 10 }}>
                    <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>{f.label ?? f.name}</label>
                    {renderField(f)}
                    {errors[f.name] ? <div style={styles.fieldError}>{errors[f.name]}</div> : null}
                </div>
            ))}

            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                {/* Use provided Button component for visual consistency */}
                {Button ? (
                    <>
                        <Button
                            text={submitting ? "Sending..." : submitText}
                            size="medium"
                            variant="solid"
                            color="primary"
                            onClick={onSubmit}
                        />
                        <Button
                            text="Cancel"
                            size="medium"
                            variant="outline"
                            color="primary"
                            onClick={onCancel}
                        />
                    </>
                ) : (
                    <>
                        <button type="submit" disabled={submitting} style={styles.submit}>
                            {submitting ? "Sending..." : submitText}
                        </button>
                        <button type="button" onClick={onCancel} style={styles.cancel}>Cancel</button>
                    </>
                )}
            </div>
        </form>
    );
};

const styles = {
    input: {
        width: "100%",
        padding: 10,
        borderRadius: 6,
        border: "1px solid var(--control-border)",
        boxSizing: "border-box",
        background: "var(--control-bg)",
        color: "var(--control-text)"
    },
    inputError: {
        borderColor: "#dc2626",
        boxShadow: "0 0 0 3px rgba(220,38,38,0.10)"
    },
    fieldError: {
        marginTop: 6,
        color: "#b91c1c",
        fontSize: 12
    },
    submit: {
        padding: "9px 14px",
        borderRadius: 8,
        border: "none",
        background: "var(--color-primary)",
        color: "var(--color-on-primary)",
        cursor: "pointer"
    },
    cancel: {
        padding: "9px 14px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "transparent",
        color: "var(--text)",
        cursor: "pointer"
    }
};

ContactForm.propTypes = {
    fieldsMeta: PropTypes.array,
    formValues: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    submitting: PropTypes.bool,
    submitText: PropTypes.string,
    errors: PropTypes.object,
    Button: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
};

export default ContactForm;
