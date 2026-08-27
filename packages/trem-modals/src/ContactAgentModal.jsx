import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
  ContactForm,
  ErrorState,
  Preloader,
  QuoteComparison,
  TimelineStepper,
} from "@packages/trem-ui";
import { fetchData, notifyDataChanged, validateFields } from "@packages/trem-utils";
import { showRealtimeToast } from "@packages/trem-events";
import ModalShell from "./ModalShell.jsx";
import "./ContactAgentModal.styles.scss";

const normalizeFormData = (component) => {
  const labels = component?.elements?.labels || {};
  const options = component?.dataScope?.options || {};
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
    journeyLabels: {
      ariaLabel: labels.quoteJourneyAriaLabel,
      detailsStep: labels.quoteDetailsStep,
      pricingStep: labels.quotePricingStep,
      reviewStep: labels.quoteReviewStep,
      detailsTitle: labels.quoteDetailsTitle,
      detailsDescription: labels.quoteDetailsDescription,
      pricingTitle: labels.quotePricingTitle,
      pricingDescription: labels.quotePricingDescription,
      reviewTitle: labels.quoteReviewTitle,
      reviewDescription: labels.quoteReviewDescription,
      cancel: labels.cancel,
      continue: labels.continueToPricing,
      continueWithPackage: labels.continueWithPackage,
      continueToReview: labels.continueToReview,
      continueWithoutSuggestion: labels.continueWithoutSuggestion,
      backToDetails: labels.backToDetails,
      backToPricing: labels.backToPricing,
      sending: labels.sendingRequest,
      validationError: labels.formValidationError,
      customJourneyRedirectTitle: labels.customJourneyRedirectTitle,
      customJourneyRedirectDescription: labels.customJourneyRedirectDescription,
      customJourneyRedirectAction: labels.customJourneyRedirectAction,
    },
    quoteLabels: {
      summary: labels.quoteSummary,
      intelligenceTag: labels.intelligenceTag,
      assistantTitle: labels.pricingAssistantTitle,
      assistantDescription: labels.pricingAssistantDescription,
      detailsProgress: labels.pricingDetailsProgress,
      waitingForDetails: labels.pricingWaitingForDetails,
      calculating: labels.calculatingPrice,
      calculatingDescription: labels.calculatingPriceDescription,
      customQuote: labels.customQuote,
      packageQuote: labels.packageQuote,
      travellers: labels.travellers,
      rooms: labels.rooms,
      basePackage: labels.basePackage,
      includedUpgrade: labels.includedUpgrade,
      hotelUpgrade: labels.hotelUpgrade,
      yourPrice: labels.yourPrice,
      customizedPlan: labels.customizedPlan,
      perPerson: labels.perPersonPrice,
      total: labels.totalPrice,
      saveWithPackage: labels.saveWithPackage,
      comparePackage: labels.comparePackage,
      includesHotel: labels.includesHotel,
      saves: labels.saves,
      difference: labels.priceDifference,
      repricing: labels.repricing,
      choosePackage: labels.choosePackage,
      alsoIncludes: labels.alsoIncludes,
      alternativePrice: labels.alternativePrice,
      pricePending: labels.pricePending,
      hotelRequestPending: labels.hotelRequestPending,
      hotelRequest: labels.hotelRequest,
    },
    structure: {
      submitText: labels[widgetProps.submitLabelRef] || "",
      fields: (widgetProps.fields || []).map((field) => ({
        ...field,
        label: labels[field.labelRef] || field.label || field.name,
        placeholder: labels[field.placeholderRef] || "",
        options: (options[field.optionsRef] || field.options || []).map((option) => ({
          ...option,
          label: labels[option.labelRef] || option.label || option.title || option.value,
        })),
      })),
    },
    data: component?.data?.tour ? [component.data.tour] : [],
  };
};

const ContactAgentModal = ({
  open,
  onClose,
  tourId,
  user = null,
  product = "trevista",
  initialSelections = null,
  closeOnOutsideClick = false,
  onCustomizeJourney,
}) => {
  const enquiryFormId = useId();
  const [formData, setFormData] = useState(null);
  const [formLoadError, setFormLoadError] = useState("");
  const [activeStage, setActiveStage] = useState("details");
  const requestIdRef = useRef(0);
  const initializedFormDataRef = useRef(null);
  const bodyRef = useRef(null);

  const loadForm = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setFormData(null);
    setFormLoadError("");
    setActiveStage("details");
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
    initializedFormDataRef.current = null;
    setFormData(null);
    setFormLoadError("");
  }, [loadForm, open]);

  const fieldsMeta = useMemo(
    () =>
      (formData?.structure?.fields || []).map((field) => ({
        ...field,
        type: field.name === "email" ? "email" : field.name === "phone" ? "tel" : field.type,
        required: field.required ?? ["name", "email", "phone"].includes(field.name),
      })),
    [formData?.structure?.fields],
  );
  const submitText = formData?.structure?.submitText || "";
  const selectedPackageKey = initialSelections?.packageKey || "";
  const hotelSelectionsKey = JSON.stringify(initialSelections?.hotelSelections || []);
  const selectedHotelSelections = useMemo(
    () =>
      (JSON.parse(hotelSelectionsKey) || [])
        .filter((item) => item?.stayKey && item?.hotelOptionKey)
        .slice(0, 20),
    [hotelSelectionsKey],
  );
  const selectedHotelOptionKey = initialSelections?.hotelOptionKey || "";
  const selectedRoomOptionKey = initialSelections?.roomOptionKey || "";
  const hotelRequestsKey = JSON.stringify(initialSelections?.hotelRequests || []);
  const selectedHotelRequests = useMemo(
    () => (JSON.parse(hotelRequestsKey) || []).filter((item) => item?.stayKey).slice(0, 12),
    [hotelRequestsKey],
  );

  const initialForm = useMemo(() => {
    const obj = {};
    const profile = {
      name: user?.name || "",
      email: user?.email || "",
      phone: String(user?.phone || user?.phoneNumber || user?.mobile || "")
        .replace(/\D/g, "")
        .slice(-10),
    };
    const selectedHotelRoom = selectedHotelOptionKey
      ? `${selectedHotelOptionKey}|${selectedRoomOptionKey}`
      : "";
    fieldsMeta.forEach((f) => {
      const selectedValue =
        f.name === "hotelRoomKey"
          ? selectedHotelRoom
          : f.name === "packageKey"
            ? selectedPackageKey
            : "";
      obj[f.name] = profile[f.name] || selectedValue || f.value || "";
    });
    return obj;
  }, [
    fieldsMeta,
    selectedHotelOptionKey,
    selectedPackageKey,
    selectedRoomOptionKey,
    user?.email,
    user?.mobile,
    user?.name,
    user?.phone,
    user?.phoneNumber,
  ]);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [quotePreview, setQuotePreview] = useState({
    loading: false,
    data: null,
    error: "",
  });

  useEffect(() => {
    if (!Object.keys(errors).length) return undefined;
    const frame = window.requestAnimationFrame(() => {
      bodyRef.current
        ?.querySelector('[aria-invalid="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeStage, errors]);

  useEffect(() => {
    if (!formData || initializedFormDataRef.current === formData) return;
    initializedFormDataRef.current = formData;
    setForm(initialForm);
    setErrors({});
    setMsg(null);
    setActiveStage("details");
  }, [formData, initialForm]);

  const fieldsMap = useMemo(() => {
    const map = {};
    fieldsMeta.forEach((field) => {
      if (field?.name) map[field.name] = field;
    });
    return map;
  }, [fieldsMeta]);

  const pricingRequirements = useMemo(() => {
    const pricingFieldNames = new Set([
      "travellerCount",
      "packageKey",
      "flightPreference",
      "preferredTravelDate",
      "preferredStartDate",
      "preferredEndDate",
    ]);
    const visiblePricingFields = fieldsMeta.filter((field) => {
      if (!pricingFieldNames.has(field?.name) || !field.required) return false;
      if (!field.visibleWhen?.field) return true;
      return form[field.visibleWhen.field] === field.visibleWhen.equals;
    });
    return visiblePricingFields.map((field) => {
      const value = form[field.name];
      let complete = String(value ?? "").trim().length > 0;
      if (field.name === "travellerCount") {
        const count = Number(value);
        complete = Number.isInteger(count) && count >= Number(field.min || 1) && count <= 50;
      }
      if (field.name === "preferredEndDate" && form.preferredStartDate && value) {
        complete = String(value) >= String(form.preferredStartDate);
      }
      return { id: field.name, label: field.label, complete };
    });
  }, [fieldsMeta, form]);
  const pricingReady =
    Boolean(fieldsMap.packageKey) &&
    pricingRequirements.length > 0 &&
    pricingRequirements.every((item) => item.complete);

  const tour = formData?.data && formData.data[0] ? formData.data[0] : { _id: tourId, title: "" };
  const agency =
    tour?.agency ||
    (tour?.agencyId && typeof tour.agencyId === "object"
      ? {
          name: tour.agencyId.agencyName,
          logo: tour.agencyId.logo,
        }
      : null);
  const operator =
    tour?.operator ||
    (tour?.ownerAgent && typeof tour.ownerAgent === "object"
      ? {
          name: tour.ownerAgent.name,
          email: tour.ownerAgent.email,
        }
      : tour?.ownerAgentName
        ? { name: tour.ownerAgentName, email: tour.ownerAgentEmail }
        : null);
  const priceStr = tour?.price
    ? typeof tour.price === "object"
      ? (tour.price?.from ?? tour.price?.amount ?? "")
      : tour.price
    : (tour?.priceInfo?.from ?? "");

  useEffect(() => {
    const packageKey = String(form.packageKey || "");
    const travellerCount = Number(form.travellerCount);
    const previewTourId = typeof tour?._id === "string" ? tour._id : tourId;
    if (
      !open ||
      activeStage !== "pricing" ||
      product !== "trevista" ||
      !previewTourId ||
      !pricingReady ||
      !packageKey ||
      !Number.isInteger(travellerCount) ||
      travellerCount < 1
    ) {
      setQuotePreview({ loading: false, data: null, error: "" });
      return undefined;
    }
    const [hotelOptionKey = "", roomOptionKey = ""] = String(form.hotelRoomKey || "").split("|");
    const abortController = new AbortController();
    setQuotePreview({ loading: true, data: null, error: "" });
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetchData(
          `/tours.json/${encodeURIComponent(previewTourId)}/customization-preview`,
          {
            method: "POST",
            signal: abortController.signal,
            body: {
              packageKey,
              hotelSelections: selectedHotelSelections,
              hotelRequests: selectedHotelRequests,
              hotelOptionKey,
              roomOptionKey,
              travellerCount,
              flightPreference: form.flightPreference,
              preferredTravelDate: form.preferredTravelDate,
              preferredStartDate: form.preferredStartDate,
              preferredEndDate: form.preferredEndDate,
            },
          },
        );
        if (abortController.signal.aborted) return;
        if (response?.status !== "success" || !response?.data?.preview) {
          throw new Error(response?.message || "Price comparison is unavailable.");
        }
        setQuotePreview({
          loading: false,
          data: response.data.preview,
          error: "",
        });
      } catch (error) {
        if (abortController.signal.aborted) return;
        setQuotePreview({
          loading: false,
          data: null,
          error: error?.message || "Price comparison is unavailable.",
        });
      }
    }, 250);
    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [
    form.hotelRoomKey,
    form.packageKey,
    form.flightPreference,
    form.preferredEndDate,
    form.preferredStartDate,
    form.preferredTravelDate,
    form.travellerCount,
    open,
    activeStage,
    product,
    pricingReady,
    selectedHotelSelections,
    selectedHotelRequests,
    tour?._id,
    tourId,
  ]);

  if (!open) return null;

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const continueToCustomJourney = () => {
    if (!onCustomizeJourney) return;
    onCustomizeJourney({
      tourId: typeof tour?._id === "string" ? tour._id : tourId,
      tour,
    });
  };

  const hasPricingJourney = product === "trevista" && Boolean(fieldsMap.packageKey);
  const journeyLabels = {
    ariaLabel: formData?.journeyLabels?.ariaLabel || "Quote request progress",
    detailsStep: formData?.journeyLabels?.detailsStep || "Trip details",
    pricingStep: formData?.journeyLabels?.pricingStep || "Price options",
    reviewStep: formData?.journeyLabels?.reviewStep || "Review request",
    detailsTitle: formData?.journeyLabels?.detailsTitle || "Tell us about your trip",
    detailsDescription:
      formData?.journeyLabels?.detailsDescription || "Complete the details needed for your quote.",
    pricingTitle: formData?.journeyLabels?.pricingTitle || "Review your intelligent price",
    pricingDescription:
      formData?.journeyLabels?.pricingDescription ||
      "Compare your selected package with a suitable alternative.",
    reviewTitle: formData?.journeyLabels?.reviewTitle || "Review your request",
    reviewDescription:
      formData?.journeyLabels?.reviewDescription ||
      "Check your details before sending them to the travel specialist.",
    cancel: formData?.journeyLabels?.cancel || "Cancel",
    continue: formData?.journeyLabels?.continue || "Continue",
    continueWithPackage: formData?.journeyLabels?.continueWithPackage || "Continue with {package}",
    continueToReview: formData?.journeyLabels?.continueToReview || "Continue to review",
    continueWithoutSuggestion:
      formData?.journeyLabels?.continueWithoutSuggestion || "Continue without suggestion",
    backToDetails: formData?.journeyLabels?.backToDetails || "Back to details",
    backToPricing: formData?.journeyLabels?.backToPricing || "Back to price",
    sending: formData?.journeyLabels?.sending || "Sending…",
    validationError:
      formData?.journeyLabels?.validationError || "Please fix the highlighted fields.",
    customJourneyRedirectTitle:
      formData?.journeyLabels?.customJourneyRedirectTitle ||
      "Build the full journey in the custom tour planner",
    customJourneyRedirectDescription:
      formData?.journeyLabels?.customJourneyRedirectDescription ||
      "We will carry this tour's available details into the planner for you.",
    customJourneyRedirectAction:
      formData?.journeyLabels?.customJourneyRedirectAction || "Continue to custom planner",
  };
  const selectedPackageLabel = fieldsMap.packageKey?.options?.find(
    (option) => String(option.value) === String(form.packageKey || ""),
  )?.label;
  const detailsContinueLabel = selectedPackageLabel
    ? journeyLabels.continueWithPackage.replace("{package}", selectedPackageLabel)
    : journeyLabels.continue;
  const stages = hasPricingJourney
    ? [
        { id: "details", label: journeyLabels.detailsStep },
        { id: "pricing", label: journeyLabels.pricingStep },
        { id: "review", label: journeyLabels.reviewStep },
      ]
    : [
        { id: "details", label: journeyLabels.detailsStep },
        { id: "review", label: journeyLabels.reviewStep },
      ];
  const activeStageIndex = stages.findIndex((stage) => stage.id === activeStage);
  const timelineSteps = stages.map((stage, index) => ({
    id: stage.id,
    label: stage.label,
    status:
      index < activeStageIndex ? "completed" : index === activeStageIndex ? "current" : "pending",
  }));

  const goToStage = (stage) => {
    setMsg(null);
    setActiveStage(stage);
    window.requestAnimationFrame(() => {
      if (typeof bodyRef.current?.scrollTo === "function") {
        bodyRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  const handleDetailsContinue = () => {
    const validation = validateFields(form, fieldsMap);
    if (!validation.ok) {
      setErrors(validation.errors);
      setMsg({ type: "error", text: journeyLabels.validationError });
      return;
    }
    setErrors({});
    goToStage(hasPricingJourney ? "pricing" : "review");
  };

  const handleSubmit = async (ev) => {
    ev?.preventDefault?.();

    // A form submit can also be triggered by Enter while completing details.
    // Only the final review step is allowed to create the enquiry.
    if (activeStage !== "review") {
      if (activeStage === "details") handleDetailsContinue();
      else goToStage("review");
      return;
    }

    const validation = validateFields(form, fieldsMap);
    if (!validation.ok) {
      goToStage("details");
      setErrors(validation.errors);
      setMsg({ type: "error", text: journeyLabels.validationError });
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
      hotelSelections: selectedHotelSelections,
      hotelRequests: selectedHotelRequests,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetchData("/submit.json?form=contact-agent", {
        method: "POST",
        body: payload,
      });
      const { status, message, ui } = response;
      if (status === "success") {
        notifyDataChanged("enquiries");
        // Backend-authored confirmation toast (title/subtitle/status come
        // from the API; the dedupeKey collapses the socket echo on other tabs).
        if (response.notify) showRealtimeToast(response.notify);
        setMsg({ type: ui?.messageType || "success", text: message });
        onClose();
      } else {
        setMsg({ type: ui?.messageType || "error", text: message });
      }
    } catch (err) {
      console.error("submit error", err?.response || err);
      setMsg({
        type: "error",
        text:
          err?.response?.data?.message || err.message || "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      open={open}
      label={formData?.title || "Contact Agent"}
      dialogClassName="ct-modal-card"
      closeOnOutsideClick={closeOnOutsideClick}
      onClose={onClose}
    >
      <Button
        variant="text"
        isCircular
        iconLeft="x"
        onClick={onClose}
        aria-label="Close"
        primaryClassName="ct-modal-close"
      />

      <header className="ct-modal-card__header-bar">
        <div className="ct-modal-card__intro">
          {formData?.brandLogo ? (
            <img className="ct-modal-card__brand" src={formData.brandLogo} alt="" />
          ) : null}
          <div className="ct-modal-card__header">
            <h3 className="ct-modal-card__title">{formData?.title || "Contact Agent"}</h3>
            {formData?.description && <p className="ct-modal-card__desc">{formData.description}</p>}
          </div>
        </div>
      </header>

      <div className="ct-modal-card__body" ref={bodyRef}>
        {!formData && !formLoadError ? (
          <Preloader
            variant="stack"
            count={4}
            label="Loading enquiry form"
            className="ct-modal-card__loader"
          />
        ) : formLoadError ? (
          <ErrorState
            title="Enquiry form unavailable"
            description={formLoadError}
            retry={loadForm}
            retryText="Try again"
            className="ct-modal-card__error"
          />
        ) : (
          <div className="ct-modal-card__workspace" data-stage={activeStage}>
            <TimelineStepper
              className="ct-modal-card__steps"
              steps={timelineSteps}
              ariaLabel={journeyLabels.ariaLabel}
              orientation="horizontal"
              variant="soft"
              markerVariant="number"
              connectorVariant="solid"
              showStepNumbers
              showTime={false}
            />

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
                  {agency?.name || operator?.name ? (
                    <div className="ct-modal-card__operator">
                      {agency?.name ? (
                        <span>
                          <small>{formData?.contextLabels?.operatedBy}</small>
                          {agency.name}
                        </span>
                      ) : null}
                      {operator?.name ? (
                        <span>
                          <small>{formData?.contextLabels?.travelSpecialist}</small>
                          {operator.name}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {activeStage === "pricing" ? (
              <section className="ct-modal-card__stage ct-modal-card__pricing-panel">
                <header className="ct-modal-card__stage-heading">
                  <span>{journeyLabels.pricingStep}</span>
                  <h4>{journeyLabels.pricingTitle}</h4>
                  <p>{journeyLabels.pricingDescription}</p>
                </header>
                <QuoteComparison
                  preview={quotePreview.data}
                  loading={quotePreview.loading}
                  error={quotePreview.error}
                  requirements={pricingRequirements}
                  labels={formData?.quoteLabels}
                  onSelectAlternative={(packageKey) => {
                    handleChange("packageKey", packageKey);
                    goToStage("review");
                  }}
                />
              </section>
            ) : (
              <section className="ct-modal-card__stage ct-modal-card__form-panel">
                <header className="ct-modal-card__stage-heading">
                  <span>
                    {activeStage === "review"
                      ? journeyLabels.reviewStep
                      : journeyLabels.detailsStep}
                  </span>
                  <h4>
                    {activeStage === "review"
                      ? journeyLabels.reviewTitle
                      : journeyLabels.detailsTitle}
                  </h4>
                  <p>
                    {activeStage === "review"
                      ? journeyLabels.reviewDescription
                      : journeyLabels.detailsDescription}
                  </p>
                </header>
                <ContactForm
                  formId={enquiryFormId}
                  showActions={false}
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
                {activeStage === "details" &&
                form.customizationPreference === "customize" &&
                onCustomizeJourney ? (
                  <aside className="ct-modal-card__custom-journey" role="note">
                    <div>
                      <strong>{journeyLabels.customJourneyRedirectTitle}</strong>
                      <p>{journeyLabels.customJourneyRedirectDescription}</p>
                    </div>
                    <Button
                      type="button"
                      variant="text"
                      text={journeyLabels.customJourneyRedirectAction}
                      iconRight="arrowUpRight"
                      onClick={continueToCustomJourney}
                    />
                  </aside>
                ) : null}
              </section>
            )}
          </div>
        )}

        {msg && (
          <div
            className={`ct-modal-card__msg ct-modal-card__msg--${msg.type}`}
            role={msg.type === "error" ? "alert" : "status"}
          >
            {msg.text}
          </div>
        )}
      </div>

      {formData && !formLoadError ? (
        <footer className="ct-modal-card__footer">
          <Button
            type="button"
            text={
              activeStage === "details"
                ? journeyLabels.cancel
                : activeStage === "pricing"
                  ? journeyLabels.backToDetails
                  : hasPricingJourney
                    ? journeyLabels.backToPricing
                    : journeyLabels.backToDetails
            }
            size="medium"
            variant="outline"
            color="primary"
            onClick={
              activeStage === "details"
                ? onClose
                : () =>
                    goToStage(
                      activeStage === "pricing"
                        ? "details"
                        : hasPricingJourney
                          ? "pricing"
                          : "details",
                    )
            }
            disabled={submitting}
          />
          {activeStage === "review" ? (
            <Button
              type="submit"
              form={enquiryFormId}
              text={submitting ? journeyLabels.sending : submitText}
              size="medium"
              variant="solid"
              color="primary"
              disabled={submitting}
            />
          ) : (
            <Button
              type="button"
              text={
                activeStage === "details" &&
                form.customizationPreference === "customize" &&
                onCustomizeJourney
                  ? journeyLabels.customJourneyRedirectAction
                  : activeStage === "pricing"
                    ? quotePreview.data?.recommendedAlternative
                      ? journeyLabels.continueWithoutSuggestion
                      : journeyLabels.continueToReview
                    : detailsContinueLabel
              }
              size="medium"
              variant="solid"
              color="primary"
              onClick={
                activeStage === "details" &&
                form.customizationPreference === "customize" &&
                onCustomizeJourney
                  ? continueToCustomJourney
                  : () =>
                      activeStage === "pricing" ? goToStage("review") : handleDetailsContinue()
              }
              disabled={submitting || (activeStage === "pricing" && quotePreview.loading)}
            />
          )}
        </footer>
      ) : null}
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
  initialSelections: PropTypes.object,
  onCustomizeJourney: PropTypes.func,
};

export default ContactAgentModal;
