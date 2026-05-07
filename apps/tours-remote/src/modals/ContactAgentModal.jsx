// src/components/ContactAgentModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Title } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";
import { Button } from "@packages/trem-ui";
import ContactForm from "../components/forms/contact-agent-form/contact_form";
import fetchData from "../utils/fetchData";
const defaultFields = [
    { name: "name", label: "Full name", type: "text", value: "" },
    { name: "email", label: "Email", type: "email", value: "" },
    { name: "phone", label: "Phone", type: "text", value: "" }
];

const ContactAgentModal = ({ open, onClose, tourId, formData }) => {
    // console.log for quick debug
    console.log("ContactAgentModal render", { open, tourId, hasFormData: !!formData });

    // fields meta either from parent-provided formData or default
    const fieldsMeta = formData?.structure?.fields ?? defaultFields;
    const submitText = formData?.structure?.submitText ?? "Send Request";

    // build initial form state from fields meta
    const initialForm = useMemo(() => {
        const obj = {};
        fieldsMeta.forEach((f) => { obj[f.name] = f.value ?? ""; });
        return obj;
    }, [fieldsMeta]);

    const [form, setForm] = useState(initialForm);
    const [msg, setMsg] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // when fields meta changes (or modal opened with different data), reset form
    useEffect(() => {
        setForm(initialForm);
        setMsg(null);
    }, [initialForm]);

    if (!open) return null;

    // tour info: prefer data provided via formData.data[0], else minimal fallback
    const tour = (formData?.data && formData.data[0]) ? formData.data[0] : { _id: tourId, title: "" };

    const handleChange = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

    const validateBasic = () => {
        if (!form.name?.trim()) return "Name is required";
        if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email";
        if (!form.phone?.trim()) return "Phone is required";
        return null;
    };

    const handleSubmit = async (ev) => {
        ev?.preventDefault?.();
        const vErr = validateBasic();
        if (vErr) return setMsg({ type: "error", text: vErr });

        setSubmitting(true);
        setMsg(null);

        const payload = {
            tourId: tour._id ?? tourId,
            tourTitle: tour?.title ?? "title unknown",
            url: window.location.href,
            fields: form,
            createdAt: new Date().toISOString()
        };

        try {
            // POST to submit endpoint (controller expects ?form=contact-agent)
            const { status, message } = await fetchData("/submit.json?form=contact-agent", { method: "POST", body: payload });
            // backend returns: { status, message, componentData }
            if (status === "success") {
                setMsg({ type: "success", text: message });
                // optionally clear form and auto-close
                setTimeout(() => onClose(), 1100);
            } else {
                setMsg({ type: "error", text: message });
            }
        } catch (err) {
            console.error("submit error", err?.response || err);
            setMsg({ type: "error", text: err?.response?.message });
        } finally {
            setSubmitting(false);
        }
    };

    console.log("ContactAgentModal render complete", { tour, form, msg, submitting });

    return (
        <div className="ct-modal-overlay" role="dialog" aria-modal="true">
            <div className="ct-modal-card">
                <button className="ct-close" onClick={onClose} aria-label="Close">✕</button>

                {/* Custom Title & Subtitle */}
                <Title text={formData?.title} variant="primary" size="medium" />
                {formData?.description && <SubTitle text={formData.description} variant="primary" size="small" />}

                <SubTitle text={`(${tour?.title})`} variant="tertiary" size="small" />

                {/* ContactForm (separate component) */}
                <ContactForm
                    fieldsMeta={fieldsMeta}
                    formValues={form}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                    submitting={submitting}
                    submitText={submitText}
                    Button={Button} // pass your Button component so ContactForm can render it
                />

                {msg && <div style={{ marginTop: 10, color: msg.type === "error" ? "#c00" : "green" }}>{msg.text}</div>}
            </div>

            {/* inline styles for isolation — keep as before */}
            <style jsx>{`
        .ct-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9999; }
        .ct-modal-card { background:#fff; padding:20px; width:520px; max-width:96%; border-radius:10px; position:relative; box-shadow:0 8px 30px rgba(0,0,0,0.12); }
        .ct-close { position:absolute; right:12px; top:10px; border:none; background:transparent; cursor:pointer; font-size:16px; }
      `}</style>
        </div>
    );
};

ContactAgentModal.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
    tourId: PropTypes.string,
    formData: PropTypes.object
};

export default ContactAgentModal;
