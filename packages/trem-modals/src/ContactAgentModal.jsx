import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button, ContactForm, ErrorState, Preloader } from "@packages/trem-ui";
import { fetchData, validateFields } from "@packages/trem-utils";
import ModalShell from "./ModalShell.jsx";
import "./ContactAgentModal.styles.scss";

const normalizeFormData = (component) => {
    const labels = component?.elements?.labels || {};
    const widgetProps = component?.structure?.widgets?.[0]?.props || {};
    const header = component?.structure?.header || {};

    return {
        title: labels[header.titleRef] || "",
        description: labels[header.descriptionRef] || "",
        brandLogo: component?.elements?.urls?.brandLogo,
        contextLabels: {
            operatedBy: labels.operatedBy,
            travelSpecialist: labels.travelSpecialist,
        },
        structure: {
            submitText: labels[widgetProps.submitLabelRef] || "",
            fields: (widgetProps.fields || []).map((field) => ({
                ...field,
                label: labels[field.labelRef] || field.name,
                placeholder: labels[field.placeholderRef] || "",
                options: (field.options || []).map((option) => ({
                    ...option,
                    label: labels[option.labelRef] || option.label || option.title || option.value,
                })),
            })),
        },
        data: component?.data?.tour ? [component.data.tour] : [],
    };
};

const ContactAgentModal = ({ open, onClose, tourId, user = null, product = "trevista", closeOnOutsideClick = false }) => {
    const [formData, setFormData] = useState(null);
    const [formLoadError, setFormLoadError] = useState("");
    const requestIdRef = useRef(0);

    const loadForm = useCallback(async () => {
        const requestId = ++requestIdRef.current;
        setFormData(null);
        setFormLoadError("");
        try {
            const query = new URLSearchParams({ form: "contact-agent", product });
            if (tourId) query.set("tourId", tourId);
            const response = await fetchData(`/form.json?${query.toString()}`);
            if (response?.status !== "success" || !response.component) {
                throw new Error(response?.message || "The enquiry form could not be loaded.");
            }
            if (requestId === requestIdRef.current) {
                setFormData(normalizeFormData(response.component));
            }
        } catch (error) {
            if (requestId === requestIdRef.current) {
                setFormLoadError(error?.message || "The enquiry form could not be loaded.");
            }
        }
    }, [product, tourId]);

    useEffect(() => {
        if (open) {
            loadForm();
            return;
        }
        requestIdRef.current += 1;
        setFormData(null);
        setFormLoadError("");
    }, [loadForm, open]);

    const fieldsMeta = useMemo(() => (formData?.structure?.fields || []).map((field) => ({
        ...field,
        type: field.name === "email" ? "email" : field.name === "phone" ? "tel" : field.type,
        required: field.required ?? ["name", "email", "phone"].includes(field.name),
    })), [formData?.structure?.fields]);
    const submitText = formData?.structure?.submitText || "";

    const initialForm = useMemo(() => {
        const obj = {};
        const profile = { name: user?.name || "", email: user?.email || "", phone: user?.phone || user?.phoneNumber || user?.mobile || "" };
        fieldsMeta.forEach((f) => { obj[f.name] = profile[f.name] || f.value || ""; });
        return obj;
    }, [fieldsMeta, user]);

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [msg, setMsg] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setForm(initialForm);
        setErrors({});
        setMsg(null);
    }, [initialForm]);

    const fieldsMap = useMemo(() => {
        const map = {};
        fieldsMeta.forEach((field) => {
            if (field?.name) map[field.name] = field;
        });
        return map;
    }, [fieldsMeta]);

    const tour = (formData?.data && formData.data[0]) ? formData.data[0] : { _id: tourId, title: "" };
    const agency = tour?.agency || (tour?.agencyId && typeof tour.agencyId === "object" ? {
        name: tour.agencyId.agencyName,
        logo: tour.agencyId.logo,
    } : null);
    const operator = tour?.operator || (tour?.ownerAgent && typeof tour.ownerAgent === "object" ? {
        name: tour.ownerAgent.name,
        email: tour.ownerAgent.email,
    } : (tour?.ownerAgentName ? { name: tour.ownerAgentName, email: tour.ownerAgentEmail } : null));
    const priceStr = tour?.price
        ? (typeof tour.price === "object" ? tour.price?.from ?? tour.price?.amount ?? "" : tour.price)
        : tour?.priceInfo?.from ?? "";

    if (!open) return null;

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
            tourId: typeof tour?._id === "string" ? tour._id : tourId,
            tourTitle: tour?.title ?? "title unknown",
            product,
            isAuthenticated: Boolean(user?.id || user?._id),
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
            setMsg({ type: "error", text: err?.response?.data?.message || err.message || "Something went wrong. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ModalShell open={open} label={formData?.title || "Contact Agent"} dialogClassName="ct-modal-card" closeOnOutsideClick={closeOnOutsideClick} onClose={onClose}>
                <Button variant="text" isCircular iconLeft="x" onClick={onClose} aria-label="Close" primaryClassName="ct-modal-close" />

                <div className="ct-modal-card__body">
                    <div className="ct-modal-card__intro">
                        {formData?.brandLogo ? <img className="ct-modal-card__brand" src={formData.brandLogo} alt="" /> : null}
                        <div className="ct-modal-card__header">
                            <h3 className="ct-modal-card__title">{formData?.title || "Contact Agent"}</h3>
                            {formData?.description && <p className="ct-modal-card__desc">{formData.description}</p>}
                        </div>
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
                                {(agency?.name || operator?.name) ? <div className="ct-modal-card__operator">
                                    {agency?.name ? <span><small>{formData?.contextLabels?.operatedBy}</small>{agency.name}</span> : null}
                                    {operator?.name ? <span><small>{formData?.contextLabels?.travelSpecialist}</small>{operator.name}</span> : null}
                                </div> : null}
                            </div>
                        </div>
                    )}

                    {!formData && !formLoadError ? (
                        <Preloader variant="stack" count={4} label="Loading enquiry form" className="ct-modal-card__loader" />
                    ) : formLoadError ? (
                        <ErrorState
                            title="Enquiry form unavailable"
                            description={formLoadError}
                            retry={loadForm}
                            retryText="Try again"
                            className="ct-modal-card__error"
                        />
                    ) : (
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
                    )}

                    {msg && (
                        <div className={`ct-modal-card__msg ct-modal-card__msg--${msg.type}`}>
                            {msg.text}
                        </div>
                    )}
                </div>
        </ModalShell>
    );
};

ContactAgentModal.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
    tourId: PropTypes.string,
    user: PropTypes.object,
    product: PropTypes.oneOf(["trevista", "trevio"]),
    closeOnOutsideClick: PropTypes.bool,
};

export default ContactAgentModal;
