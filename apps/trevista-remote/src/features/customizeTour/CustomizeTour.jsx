import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Breadcrumbs,
  Button,
  ContactForm,
  ErrorState,
  NoDataFound,
  PRODUCT_TYPE,
  Preloader,
  TimelineStepper,
} from "@packages/trem-ui";
import {
  fetchData,
  notifyDataChanged,
  useComponentData,
  validateFields,
} from "@packages/trem-utils";
import { showRealtimeToast } from "@packages/trem-events";
import "./CustomizeTour.scss";

export default function CustomizeTour({ userSession = null }) {
  const location = useLocation();
  const sourceTourId = useMemo(
    () => new URLSearchParams(location.search).get("tourId") || "",
    [location.search],
  );
  const { loading, error, elements, resolvedView, refetch } = useComponentData(
    "/customize-tour-page.json",
    { auto: true, params: sourceTourId ? { tourId: sourceTourId } : {} },
  );
  const labels = elements?.labels || {};
  const steps = useMemo(() => resolvedView?.structure?.journey?.steps || [], [resolvedView]);
  const fields = useMemo(() => steps.flatMap((step) => step.fields || []), [steps]);
  const defaultForm = useMemo(() => {
    const profile = userSession?.user || {};
    const prefill = resolvedView?.data?.prefill || {};
    const values = fields.reduce(
      (values, field) => ({
        ...values,
        [field.name]:
          field.name === "name"
            ? profile.name || prefill[field.name] || field.value || ""
            : field.name === "email"
              ? profile.email || prefill[field.name] || field.value || ""
              : field.name === "phone"
                ? String(
                    profile.phone ||
                      profile.phoneNumber ||
                      profile.mobile ||
                      prefill[field.name] ||
                      field.value ||
                      "",
                  )
                    .replace(/\D/g, "")
                    .slice(-10)
                : field.type === "multiselect" || field.multiple
                  ? Array.isArray(prefill[field.name])
                    ? prefill[field.name]
                    : String(prefill[field.name] || "")
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean)
                  : prefill[field.name] || field.value || "",
      }),
      {},
    );
    return {
      ...values,
      sourceTourId: prefill.sourceTourId || "",
      sourceTourTitle: prefill.sourceTourTitle || "",
    };
  }, [fields, resolvedView?.data?.prefill, userSession?.user]);
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState(null);

  useEffect(() => {
    if (!fields.length) return;
    setForm((current) => {
      if (Object.keys(current).length) return current;
      return defaultForm;
    });
  }, [defaultForm, fields.length]);

  useEffect(() => {
    if (!Object.keys(errors).length) return undefined;
    const frame = window.requestAnimationFrame(() => {
      document
        .querySelector('.customize-tour-page [aria-invalid="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeStep, errors]);

  const currentStep = steps[activeStep];
  const isVisible = (field) =>
    !field.visibleWhen?.field || form[field.visibleWhen.field] === field.visibleWhen.equals;
  const currentFields = (currentStep?.fields || []).filter(isVisible);
  const timelineSteps = steps.map((step, index) => ({
    id: step.id,
    label: step.label,
    status: index < activeStep ? "completed" : index === activeStep ? "current" : "pending",
  }));

  const changeField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
    setMessage(null);
  };

  const validateCurrentStep = () => {
    const fieldsMap = Object.fromEntries(currentFields.map((field) => [field.name, field]));
    const validation = validateFields(form, fieldsMap);
    if (!validation.ok) {
      setErrors(validation.errors);
      setMessage({ type: "error", text: labels.validationMessage });
      return false;
    }
    setErrors({});
    setMessage(null);
    return true;
  };

  const goForward = () => {
    if (!validateCurrentStep()) return;
    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const displayValue = (field, value) => {
    if (Array.isArray(value)) {
      return value
        .map(
          (item) =>
            field.options?.find((option) => String(option.value) === String(item))?.label || item,
        )
        .join(", ");
    }
    return field.options?.find((option) => String(option.value) === String(value))?.label || value;
  };

  const reviewGroups = steps
    .filter((step) => step.fields?.length)
    .map((step) => ({
      ...step,
      fields: step.fields
        .filter(isVisible)
        .map((field) => ({ ...field, displayValue: displayValue(field, form[field.name]) }))
        .filter((field) => String(field.displayValue || "").trim()),
    }));

  const submitEnquiry = async () => {
    const visibleFields = fields.filter(isVisible);
    const validation = validateFields(
      form,
      Object.fromEntries(visibleFields.map((field) => [field.name, field])),
    );
    if (!validation.ok) {
      const firstInvalidIndex = steps.findIndex((step) =>
        (step.fields || []).some((field) => validation.errors[field.name]),
      );
      setErrors(validation.errors);
      setActiveStep(Math.max(0, firstInvalidIndex));
      setMessage({ type: "error", text: labels.validationMessage });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetchData("/submit.json?form=custom-tour", {
        method: "POST",
        body: {
          form: "custom-tour",
          tourTitle: "Custom tour enquiry",
          product: PRODUCT_TYPE.TREVISTA,
          isAuthenticated: Boolean(userSession?.user?.id || userSession?.user?._id),
          url: window.location.href,
          fields: form,
          createdAt: new Date().toISOString(),
        },
      });
      if (response?.status !== "success") {
        throw new Error(response?.message || labels.submitErrorTitle);
      }
      notifyDataChanged("enquiries");
      if (response.notify) showRealtimeToast(response.notify);
      setSubmittedLead(response.component?.data?.lead || { enquiryRef: "" });
    } catch (submitError) {
      setMessage({
        type: "error",
        text: submitError?.message || labels.submitErrorTitle,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetJourney = () => {
    setForm(defaultForm);
    setErrors({});
    setMessage(null);
    setActiveStep(0);
    setSubmittedLead(null);
  };

  return (
    <main className="customize-tour-page">
      <div className="customize-tour-page__crumbs">
        <Breadcrumbs
          items={[
            { label: labels.breadcrumbRoot || "Trevista", path: "/trevista" },
            { label: labels.breadcrumbTours || "Tours", path: "/trevista/tours" },
            { label: labels.breadcrumbCurrent || labels.pageTitle || "Customise Tour" },
          ]}
        />
      </div>
      <section className="customize-tour-page__content">
        {loading ? (
          <Preloader variant="stack" count={3} label={labels.loadingLabel} />
        ) : error ? (
          <ErrorState
            title={labels.errorTitle}
            description={labels.errorDescription}
            error={process.env.NODE_ENV === "development" ? String(error) : undefined}
            retry={refetch}
            retryText={labels.retryLabel}
          />
        ) : !steps.length ? (
          <NoDataFound
            icon="route"
            title={labels.emptyTitle}
            description={labels.emptyDescription}
          />
        ) : submittedLead ? (
          <NoDataFound
            icon="check"
            title={labels.successTitle}
            description={`${labels.successDescription}${
              submittedLead.enquiryRef ? ` Reference: ${submittedLead.enquiryRef}.` : ""
            }`}
            actionLabel={labels.newEnquiryLabel}
            onAction={resetJourney}
          />
        ) : (
          <div className="customize-tour-page__journey">
            <header className="customize-tour-page__hero">
              <span>{resolvedView?.structure?.header?.eyebrow}</span>
              <h1>{resolvedView?.structure?.header?.title}</h1>
              <p>{resolvedView?.structure?.header?.description}</p>
              {form.sourceTourTitle ? (
                <strong className="customize-tour-page__source-tour">
                  {(labels.customisingSourceTour || "Starting from {tour}").replace(
                    "{tour}",
                    form.sourceTourTitle,
                  )}
                </strong>
              ) : null}
            </header>

            <TimelineStepper
              steps={timelineSteps}
              orientation="horizontal"
              markerVariant="number"
              showStepNumbers
              showTime={false}
              ariaLabel={labels.pageTitle}
              className="customize-tour-page__steps"
            />

            <section className="customize-tour-page__panel" aria-labelledby="custom-step-title">
              <div className="customize-tour-page__panel-heading">
                <span>
                  {activeStep + 1} / {steps.length}
                </span>
                <h2 id="custom-step-title">
                  {currentStep?.id === "review" ? labels.reviewTitle : currentStep?.label}
                </h2>
                {currentStep?.id === "review" ? <p>{labels.reviewDescription}</p> : null}
              </div>

              {currentStep?.id === "review" ? (
                <div className="customize-tour-page__review">
                  {reviewGroups.map((group, groupIndex) => (
                    <article key={group.id}>
                      <div className="customize-tour-page__review-heading">
                        <h3>{group.label}</h3>
                        <Button
                          text={labels.editLabel}
                          variant="text"
                          size="small"
                          onClick={() => setActiveStep(groupIndex)}
                        />
                      </div>
                      <dl>
                        {group.fields.map((field) => (
                          <div key={field.name}>
                            <dt>{field.label}</dt>
                            <dd>{field.displayValue}</dd>
                          </div>
                        ))}
                      </dl>
                    </article>
                  ))}
                </div>
              ) : (
                <ContactForm
                  fieldsMeta={currentFields}
                  formValues={form}
                  errors={errors}
                  onChange={changeField}
                  onSubmit={(event) => {
                    event.preventDefault();
                    goForward();
                  }}
                  onCancel={() => setActiveStep((current) => Math.max(0, current - 1))}
                  showActions={false}
                />
              )}

              {message ? (
                <p className={`customize-tour-page__message is-${message.type}`} role="alert">
                  {message.text}
                </p>
              ) : null}

              <div className="customize-tour-page__actions">
                {activeStep > 0 ? (
                  <Button
                    text={labels.backLabel}
                    variant="outline"
                    color="primary"
                    onClick={() => {
                      setMessage(null);
                      setActiveStep((current) => current - 1);
                    }}
                    disabled={submitting}
                  />
                ) : null}
                <Button
                  text={
                    submitting
                      ? labels.sendingLabel
                      : currentStep?.id === "review"
                        ? labels.sendLabel
                        : labels.continueLabel
                  }
                  iconRight={currentStep?.id === "review" ? "messageCircle" : "chevronRight"}
                  onClick={currentStep?.id === "review" ? submitEnquiry : goForward}
                  disabled={submitting}
                />
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
