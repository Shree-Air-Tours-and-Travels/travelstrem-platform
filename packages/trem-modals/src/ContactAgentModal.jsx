import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, ContactForm } from "@packages/trem-ui";
import { fetchData, validateFields } from "@packages/trem-utils";
import "./ContactAgentModal.styles.scss";

const defaultFields = [
    { name: "name", label: "Full name", type: "text", required: true, minLength: 2, value: "" },
    { name: "email", label: "Email", type: "email", required: true, value: "" },
    { name: "phone", label: "Phone", type: "tel", required: true, value: "" }
];

const ContactAgentModal = ({ open, onClose, tourId, formData }) => {
    const fieldsMeta = useMemo(() => (formData?.structure?.fields ?? defaultFields).map((field) => ({
        ...field,
        type: field.name === "email" ? "email" : field.name === "phone" ? "tel" : field.type,
        required: field.required ?? ["name", "email", "phone"].includes(field.name),
    })), [formData?.structure?.fields]);
    const submitText = formData?.structure?.submitText ?? "Send Request";

    const initialForm = useMemo(() => {
        const obj = {};
        fieldsMeta.forEach((f) => { obj[f.name] = f.value ?? ""; });
        return obj;
    }, [fieldsMeta]);

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [msg, setMsg] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setForm(initialForm);
        setErrors({});
        setMsg(null);
    }, [initialForm]);

    if (!open) return null;

    const tour = (formData?.data && formData.data[0]) ? formData.data[0] : { _id: tourId, title: "" };

    const fieldsMap = useMemo(() => {
        const map = {};
        fieldsMeta.forEach((field) => {
            if (field?.name) map[field.name] = field;
        });
        return map;
    }, [fieldsMeta]);

    const handleChange = (name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors((prev) => {
            const copy = { ...prev };
            delete copy[name];
            return copy;
        });
    };

    const handleSubmit = async (ev) => {
        ev?.preventDefault?.();
        const validation = validateFields(form, fieldsMap);
        if (!validation.ok) {
            setErrors(validation.errors);
            setMsg({ type: "error", text: "Please fix the highlighted fields." });
            return;
        }

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
            const { status, message } = await fetchData("/submit.json?form=contact-agent", { method: "POST", body: payload });
            if (status === "success") {
                setMsg({ type: "success", text: message });
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

    const priceStr = tour?.price
        ? (typeof tour.price === "object" ? tour.price?.from ?? tour.price?.amount ?? "" : tour.price)
        : tour?.priceInfo?.from ?? "";

    return (
        <div className="ct-modal-overlay" role="dialog" aria-modal="true">
            <div className="ct-modal-backdrop" onClick={onClose} />
            <div className="ct-modal-card">
                <Button variant="text" isCircular iconLeft="x" onClick={onClose} aria-label="Close" primaryClassName="ct-modal-close" />

                <div className="ct-modal-card__body">
                    <div className="ct-modal-card__header">
                        <h3 className="ct-modal-card__title">{formData?.title || "Contact Agent"}</h3>
                        {formData?.description && <p className="ct-modal-card__desc">{formData.description}</p>}
                    </div>

                    {tour?.title && (
                        <div className="ct-modal-card__tour">
                            {tour?.image && (
                                <div className="ct-modal-card__tour-img">
                                    <img src={tour.image} alt={tour.title} />
                                </div>
                            )}
                            <div className="ct-modal-card__tour-info">
                                <strong>{tour.title}</strong>
                                {priceStr && <span className="ct-modal-card__tour-price">{priceStr}</span>}
                            </div>
                        </div>
                    )}

                    <ContactForm
                        fieldsMeta={fieldsMeta}
                        formValues={form}
                        onChange={handleChange}
                        onSubmit={handleSubmit}
                        onCancel={onClose}
                        submitting={submitting}
                        submitText={submitText}
                        errors={errors}
                        Button={Button}
                    />

                    {msg && (
                        <div className={`ct-modal-card__msg ct-modal-card__msg--${msg.type}`}>
                            {msg.text}
                        </div>
                    )}
                </div>
            </div>
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
