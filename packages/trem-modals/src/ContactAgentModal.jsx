import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
  CardWithSubEntity,
  ContactForm,
  ErrorState,
  Preloader,
  PRODUCT_TYPE,
  QuoteComparison,
  TimelineStepper,
} from "@packages/trem-ui";
import {
  buildGlobalAppShellUrl,
  fetchData,
  notifyDataChanged,
  validateFields,
} from "@packages/trem-utils";
import { showRealtimeToast } from "@packages/trem-events";
import ModalShell from "./ModalShell.jsx";
import "./ContactAgentModal.styles.scss";

const formatAddOnPrice = (addOn) => {
  if (addOn?.priceLabel) return addOn.priceLabel;
  const amount = Number(addOn?.pricing?.amountMinor || 0) / 100;
  const price = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: addOn?.pricing?.currency || "INR",
    maximumFractionDigits: 0,
  }).format(amount);
  const units = {
    PER_PERSON: "per person",
    PER_BOOKING: "per booking",
    PER_ROOM: "per room",
    PER_NIGHT: "per night",
    PER_ROOM_PER_NIGHT: "per room per night",
  };
  return [price, units[addOn?.pricing?.unit]].filter(Boolean).join(" ");
};

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
      changesStep: labels.quoteChangesStep,
      pricingStep: labels.quotePricingStep,
      reviewStep: labels.quoteReviewStep,
      detailsTitle: labels.quoteDetailsTitle,
      detailsDescription: labels.quoteDetailsDescription,
      changesTitle: labels.quoteChangesTitle,
      changesDescription: labels.quoteChangesDescription,
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
      flights: labels.flights,
      flightsIncluded: labels.flightsIncluded,
      flightsAdded: labels.flightsAdded,
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
    quoteConfiguration: component?.data?.quoteConfiguration || {
      packages: [],
      hotelGroups: [],
      hotelReplacementGroups: [],
      optionalAddOns: [],
    },
    data: component?.data?.tour ? [component.data.tour] : [],
  };
};

const ContactAgentModal = ({
  open,
  onClose,
  tourId,
  user = null,
  product = PRODUCT_TYPE.TREVISTA,
  initialSelections = null,
  closeOnOutsideClick = false,
  onCustomizeJourney,
}) => {
  const enquiryFormId = useId();
  const [formData, setFormData] = useState(null);
  const [formLoadError, setFormLoadError] = useState("");
  const [activeStage, setActiveStage] = useState("confirm");
  const requestIdRef = useRef(0);
  const initializedFormDataRef = useRef(null);
  const bodyRef = useRef(null);

  const loadForm = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setFormData(null);
    setFormLoadError("");
    setActiveStage("confirm");
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

  const fieldsMeta = useMemo(() => {
    const baseFields = (formData?.structure?.fields || []).map((field) => ({
      ...field,
      type: field.name === "email" ? "email" : field.name === "phone" ? "tel" : field.type,
      required: field.required ?? ["name", "email", "phone"].includes(field.name),
    }));
    const replacementFields = (formData?.quoteConfiguration?.hotelReplacementGroups || []).map(
      (group, index) => ({
        name: `hotelReplacement_${index}`,
        label:
          group.question ||
          `Would you like to change your hotel in ${group.location || "this destination"}?`,
        placeholder:
          group.keepLabel ||
          `No, keep ${[group.included?.hotelName, group.included?.roomName].filter(Boolean).join(" — ") || "the included hotel"}`,
        type: "select",
        required: false,
        width: "full",
        visibleWhen: { field: "packageKey", equals: group.packageKey },
        replacement: group,
        options: (group.alternatives || []).map((alternative) => ({
          value: `${alternative.hotelOptionKey}|${alternative.roomOptionKey}`,
          label: alternative.selectionLabel || `Yes, change to ${alternative.label}`,
        })),
      }),
    );
    const flightIndex = baseFields.findIndex((field) => field.name === "flightPreference");
    if (flightIndex < 0) return [...baseFields, ...replacementFields];
    return [
      ...baseFields.slice(0, flightIndex + 1),
      ...replacementFields,
      ...baseFields.slice(flightIndex + 1),
    ];
  }, [formData?.quoteConfiguration?.hotelReplacementGroups, formData?.structure?.fields]);
  const submitText = formData?.structure?.submitText || "";
  const selectedPackageKey = initialSelections?.packageKey || "";
  const hotelSelectionsKey = JSON.stringify(initialSelections?.hotelSelections || []);
  const initialHotelSelections = useMemo(
    () =>
      (JSON.parse(hotelSelectionsKey) || [])
        .filter((item) => item?.stayKey && item?.hotelOptionKey)
        .slice(0, 20),
    [hotelSelectionsKey],
  );
  const selectedHotelOptionKey = initialSelections?.hotelOptionKey || "";
  const selectedRoomOptionKey = initialSelections?.roomOptionKey || "";

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
    const selectedPackageConfig = (formData?.quoteConfiguration?.packages || []).find(
      (item) => String(item.value) === String(selectedPackageKey),
    );
    fieldsMeta.forEach((f) => {
      const selectedValue =
        f.name === "hotelRoomKey"
          ? selectedHotelRoom
          : f.name === "packageKey"
            ? selectedPackageKey
            : f.name === "flightPreference" && selectedPackageConfig
              ? selectedPackageConfig.includesFlights
                ? "with_flights"
                : "without_flights"
              : f.replacement
                ? (() => {
                    const selected = initialHotelSelections.find(
                      (item) => item.stayKey === f.replacement.stayKey,
                    );
                    return selected
                      ? `${selected.hotelOptionKey}|${selected.roomOptionKey || ""}`
                      : "";
                  })()
                : "";
      obj[f.name] = profile[f.name] || selectedValue || f.value || "";
    });
    return obj;
  }, [
    fieldsMeta,
    formData?.quoteConfiguration?.packages,
    initialHotelSelections,
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
  const [selectedAddOnIds, setSelectedAddOnIds] = useState([]);

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
    setActiveStage("confirm");
    setSelectedAddOnIds([]);
  }, [formData, initialForm]);

  const selectedPackageConfig = useMemo(
    () =>
      (formData?.quoteConfiguration?.packages || []).find(
        (item) => String(item.value) === String(form.packageKey || ""),
      ) || null,
    [form.packageKey, formData?.quoteConfiguration?.packages],
  );
  const selectedPackageHotelGroups = useMemo(
    () =>
      (formData?.quoteConfiguration?.hotelGroups || []).filter(
        (group) => String(group.packageKey) === String(form.packageKey || ""),
      ),
    [form.packageKey, formData?.quoteConfiguration?.hotelGroups],
  );
  const selectedHotelSelections = useMemo(
    () =>
      fieldsMeta
        .filter(
          (field) =>
            field.replacement && field.visibleWhen?.equals === form.packageKey && form[field.name],
        )
        .map((field) => {
          const [hotelOptionKey = "", roomOptionKey = ""] = String(form[field.name]).split("|");
          return { stayKey: field.replacement.stayKey, hotelOptionKey, roomOptionKey };
        }),
    [fieldsMeta, form],
  );
  const selectedHotelRequests = useMemo(() => [], []);
  const effectiveFieldsMeta = useMemo(
    () =>
      fieldsMeta.map((field) => {
        if (field.name !== "flightPreference" || !selectedPackageConfig) return field;
        return selectedPackageConfig.includesFlights
          ? {
              ...field,
              label: `Flights · included in ${selectedPackageConfig.label}`,
              options: [{ value: "with_flights", label: "Keep the included flights" }],
            }
          : {
              ...field,
              label: `Flights · not included in ${selectedPackageConfig.label}`,
              options: [
                { value: "without_flights", label: "Keep package without flights" },
                { value: "with_flights", label: "Add flights to my quotation" },
              ],
            };
      }),
    [fieldsMeta, selectedPackageConfig],
  );

  const fieldsMap = useMemo(() => {
    const map = {};
    effectiveFieldsMeta.forEach((field) => {
      if (field?.name) map[field.name] = field;
    });
    return map;
  }, [effectiveFieldsMeta]);
  const detailFieldNames = useMemo(
    () =>
      new Set([
        "name",
        "email",
        "phone",
        "travellerCount",
        "adultCount",
        "childCount",
        "infantCount",
        "packageKey",
        "preferredTravelDate",
        "preferredStartDate",
        "preferredEndDate",
        "preferredContact",
      ]),
    [],
  );
  const detailFields = useMemo(
    () => effectiveFieldsMeta.filter((field) => detailFieldNames.has(field.name)),
    [detailFieldNames, effectiveFieldsMeta],
  );
  const changeFields = useMemo(
    () => effectiveFieldsMeta.filter((field) => !detailFieldNames.has(field.name)),
    [detailFieldNames, effectiveFieldsMeta],
  );
  const confirmationFields = useMemo(
    () => effectiveFieldsMeta.filter((field) =>
      ["name", "email", "phone", "preferredContact"].includes(field.name)),
    [effectiveFieldsMeta],
  );
  const mapFields = (fields) => Object.fromEntries(fields.map((field) => [field.name, field]));

  const pricingRequirements = useMemo(() => {
    const pricingFieldNames = new Set([
      "travellerCount",
      "packageKey",
      "flightPreference",
      "preferredTravelDate",
      "preferredStartDate",
      "preferredEndDate",
    ]);
    const visiblePricingFields = effectiveFieldsMeta.filter((field) => {
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
  }, [effectiveFieldsMeta, form]);
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
    if (activeStage === "review") return undefined;
    if (
      !open ||
      activeStage !== "pricing" ||
      product !== PRODUCT_TYPE.TREVISTA ||
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
              addOnIds: selectedAddOnIds,
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
    selectedAddOnIds,
    tour?._id,
    tourId,
  ]);

  if (!open) return null;

  const handleChange = (name, value) => {
    setForm((prev) => {
      if (name !== "packageKey") return { ...prev, [name]: value };
      const packageConfig = (formData?.quoteConfiguration?.packages || []).find(
        (item) => String(item.value) === String(value),
      );
      const next = {
        ...prev,
        packageKey: value,
        flightPreference: packageConfig?.includesFlights ? "with_flights" : "without_flights",
      };
      fieldsMeta.forEach((field) => {
        if (field.replacement) next[field.name] = "";
      });
      return next;
    });
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

  const hasPricingJourney = product === PRODUCT_TYPE.TREVISTA && Boolean(fieldsMap.packageKey);
  const hasPreferenceJourney =
    product === PRODUCT_TYPE.TREVIO &&
    (changeFields.length > 0 || formData?.quoteConfiguration?.optionalAddOns?.length > 0);
  const journeyLabels = {
    ariaLabel: formData?.journeyLabels?.ariaLabel || "Quote request progress",
    detailsStep: formData?.journeyLabels?.detailsStep || "Trip details",
    changesStep: formData?.journeyLabels?.changesStep || "Changes & add-ons",
    pricingStep: formData?.journeyLabels?.pricingStep || "Package price",
    reviewStep: formData?.journeyLabels?.reviewStep || "Review request",
    detailsTitle: formData?.journeyLabels?.detailsTitle || "Tell us about your trip",
    detailsDescription:
      formData?.journeyLabels?.detailsDescription || "Complete the details needed for your quote.",
    changesTitle: formData?.journeyLabels?.changesTitle || "Tailor your selected package",
    changesDescription:
      formData?.journeyLabels?.changesDescription ||
      "Request only the changes and optional services you want the agent to quote.",
    pricingTitle: formData?.journeyLabels?.pricingTitle || "Review your package price",
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
  const stages = [{ id: "confirm", label: "Confirm enquiry" }];
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
    const validation = validateFields(form, mapFields(detailFields));
    if (!validation.ok) {
      setErrors(validation.errors);
      setMsg({ type: "error", text: journeyLabels.validationError });
      return;
    }
    setErrors({});
    goToStage(hasPricingJourney || hasPreferenceJourney ? "changes" : "review");
  };

  const handleChangesContinue = () => {
    const validation = validateFields(form, mapFields(changeFields));
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

    if (activeStage === "confirm") {
      const validation = validateFields(form, mapFields(confirmationFields));
      if (!validation.ok) {
        setErrors(validation.errors);
        setMsg({ type: "error", text: journeyLabels.validationError });
        return;
      }
      setSubmitting(true);
      setMsg(null);
      try {
        const response = await fetchData("/submit.json?form=contact-agent", {
          method: "POST",
          body: {
            tourId: typeof tour?._id === "string" ? tour._id : tourId,
            tourTitle: tour?.title || "Trevio trip",
            product,
            confirmed: true,
            isAuthenticated: Boolean(user?.id || user?._id),
            fields: Object.fromEntries(
              confirmationFields.map((field) => [field.name, form[field.name] || ""]),
            ),
            url: window.location.href,
            createdAt: new Date().toISOString(),
          },
        });
        if (response?.status !== "success") {
          throw new Error(response?.message || "The enquiry could not be created.");
        }
        notifyDataChanged("enquiries");
        if (response.notify) showRealtimeToast(response.notify);
        const enquiryRef =
          response?.component?.data?.lead?.enquiryRef ||
          response?.componentData?.data?.enquiryRef ||
          response?.data?.lead?.enquiryRef;
        if (!enquiryRef) throw new Error("The enquiry was created without a reference.");
        const destination = new URL(buildGlobalAppShellUrl({ product, tab: "bookings" }));
        destination.searchParams.set("enquiry", enquiryRef);
        window.location.assign(destination.toString());
      } catch (error) {
        setMsg({ type: "error", text: error?.message || "The enquiry could not be created." });
        setSubmitting(false);
      }
      return;
    }

    // A form submit can also be triggered by Enter while completing details.
    // Only the final review step is allowed to create the enquiry.
    if (activeStage !== "review") {
      if (activeStage === "details") handleDetailsContinue();
      else if (activeStage === "changes") handleChangesContinue();
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
      addOnIds: selectedAddOnIds,
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
      dialogClassName={`ct-modal-card${activeStage === "confirm" ? " ct-modal-card--confirmation" : ""}`}
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
            {activeStage !== "confirm" ? (
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
            ) : null}

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

            {activeStage === "confirm" ? (
              <section className="ct-modal-card__stage ct-modal-card__review-panel">
                <ContactForm
                  formId={enquiryFormId}
                  showActions={false}
                  fieldsMeta={confirmationFields}
                  formValues={form}
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                  onCancel={onClose}
                  submitting={submitting}
                  errors={errors}
                  Button={Button}
                />
              </section>
            ) : activeStage === "pricing" ? (
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
                    goToStage("changes");
                  }}
                />
              </section>
            ) : activeStage === "review" ? (
              <section className="ct-modal-card__stage ct-modal-card__review-panel">
                <header className="ct-modal-card__stage-heading">
                  <span>{journeyLabels.reviewStep}</span>
                  <h4>{journeyLabels.reviewTitle}</h4>
                  <p>{journeyLabels.reviewDescription}</p>
                </header>
                <CardWithSubEntity
                  title={product === PRODUCT_TYPE.TREVIO ? "Traveller and trip enquiry" : "Traveller and tour request"}
                  subtitle={
                    product === PRODUCT_TYPE.TREVIO
                      ? "Nothing is sent until you select Enquire now below."
                      : "Nothing is sent until you select Request quote below."
                  }
                  items={[
                    { label: "Traveller", value: form.name || "—" },
                    {
                      label: "Travellers",
                      value:
                        product === PRODUCT_TYPE.TREVIO
                          ? `${form.adultCount || 0} adult · ${form.childCount || 0} child · ${form.infantCount || 0} infant`
                          : form.travellerCount || "—",
                    },
                    { label: "Package", value: selectedPackageLabel || "—" },
                    {
                      label: "Travel dates",
                      value:
                        form.preferredTravelDate ||
                        [form.preferredStartDate, form.preferredEndDate]
                          .filter(Boolean)
                          .join(" – ") ||
                        "—",
                    },
                    ...(product === PRODUCT_TYPE.TREVISTA ? [{
                      label: "Flights",
                      value:
                        form.flightPreference === "with_flights"
                          ? selectedPackageConfig?.includesFlights
                            ? "Included in package"
                            : "Request flights from the agent"
                          : "No flights requested",
                    }] : []),
                    ...(product === PRODUCT_TYPE.TREVIO
                      ? [
                          { label: "Room", value: form.roomType || "No preference" },
                          { label: "Meals", value: form.mealPreference || "No preference" },
                          { label: "Drinks", value: form.drinkPreference || "No preference" },
                        ]
                      : []),
                  ]}
                  sections={[
                    selectedHotelSelections.length
                      ? {
                          title: "Requested hotel changes",
                          items: selectedHotelSelections.map((selection) => {
                            const group = selectedPackageHotelGroups.find(
                              (item) => item.stayKey === selection.stayKey,
                            );
                            const replacement = group?.alternatives?.find(
                              (item) =>
                                item.hotelOptionKey === selection.hotelOptionKey &&
                                item.roomOptionKey === selection.roomOptionKey,
                            );
                            return {
                              label: group?.location || selection.stayKey,
                              value: `${[group?.included?.hotelName, group?.included?.roomName]
                                .filter(Boolean)
                                .join(" — ")} → ${replacement?.label || "Selected replacement"}`,
                            };
                          }),
                        }
                      : null,
                    selectedAddOnIds.length
                      ? {
                          title: "Optional add-ons requested",
                          items: (formData?.quoteConfiguration?.optionalAddOns || [])
                            .filter((item) => selectedAddOnIds.includes(item.id))
                            .map((item) => ({ label: item.title, value: formatAddOnPrice(item) })),
                        }
                      : null,
                    form.message ? { title: "Additional request", text: form.message } : null,
                  ].filter(Boolean)}
                />
                {product === PRODUCT_TYPE.TREVISTA ? (
                  <QuoteComparison
                    preview={quotePreview.data}
                    error={quotePreview.error}
                    requirements={pricingRequirements}
                    labels={formData?.quoteLabels}
                  />
                ) : null}
              </section>
            ) : (
              <section className="ct-modal-card__stage ct-modal-card__form-panel">
                <header className="ct-modal-card__stage-heading">
                  <span>
                    {activeStage === "changes"
                      ? journeyLabels.changesStep
                      : journeyLabels.detailsStep}
                  </span>
                  <h4>
                    {activeStage === "changes"
                      ? journeyLabels.changesTitle
                      : journeyLabels.detailsTitle}
                  </h4>
                  <p>
                    {activeStage === "changes"
                      ? journeyLabels.changesDescription
                      : journeyLabels.detailsDescription}
                  </p>
                </header>
                {activeStage === "changes" && selectedPackageConfig ? (
                  <div className="ct-modal-card__package-baseline">
                    <CardWithSubEntity
                      title={`${selectedPackageConfig.label} package baseline`}
                      subtitle={
                        selectedPackageHotelGroups.some((group) => group.alternatives?.length)
                          ? "Only the replacement choices offered below can be changed in this enquiry. Use the additional note for anything else."
                          : "This package has no hotel alternatives. Its included hotels cannot be changed here; use the additional note for an exceptional request."
                      }
                      items={[
                        {
                          id: "flights",
                          label: "Flights",
                          value: selectedPackageConfig.includesFlights
                            ? `Included${selectedPackageConfig.includedFlightNames?.length ? ` · ${selectedPackageConfig.includedFlightNames.join(", ")}` : ""}`
                            : "Not included",
                        },
                        ...selectedPackageHotelGroups.map((group) => ({
                          id: `hotel-${group.stayKey}`,
                          label: `Included hotel · ${group.location || group.stayKey}`,
                          value:
                            [group.included?.hotelName, group.included?.roomName]
                              .filter(Boolean)
                              .join(" — ") || "Package hotel",
                        })),
                      ]}
                    />
                  </div>
                ) : null}
                <ContactForm
                  formId={enquiryFormId}
                  showActions={false}
                  fieldsMeta={activeStage === "changes" ? changeFields : detailFields}
                  formValues={form}
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                  onCancel={onClose}
                  submitting={submitting}
                  submitText={submitText}
                  errors={errors}
                  Button={Button}
                />
                {activeStage === "changes" &&
                formData?.quoteConfiguration?.optionalAddOns?.length ? (
                  <div className="ct-modal-card__addons">
                    <div className="ct-modal-card__addons-heading">
                      <strong>Optional add-ons</strong>
                      <p>
                        These services are not included in the package price. Select only what you
                        want the agent to include.
                      </p>
                    </div>
                    {(formData.quoteConfiguration.optionalAddOns || []).map((addOn) => {
                      const selected = selectedAddOnIds.includes(addOn.id);
                      return (
                        <label
                          className={`ct-modal-card__addon${selected ? " is-selected" : ""}`}
                          key={addOn.id}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              setSelectedAddOnIds((current) =>
                                current.includes(addOn.id)
                                  ? current.filter((id) => id !== addOn.id)
                                  : [...current, addOn.id],
                              )
                            }
                          />
                          <span>
                            <strong>{addOn.title}</strong>
                            {addOn.description ? <small>{addOn.description}</small> : null}
                          </span>
                          <b>{formatAddOnPrice(addOn)}</b>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
                {activeStage === "changes" &&
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
              activeStage === "confirm"
                ? "Cancel"
                : activeStage === "details"
                ? journeyLabels.cancel
                : activeStage === "changes"
                  ? journeyLabels.backToDetails
                  : activeStage === "pricing"
                    ? "Back to changes"
                    : hasPricingJourney
                      ? journeyLabels.backToPricing
                      : hasPreferenceJourney
                        ? "Back to preferences"
                        : journeyLabels.backToDetails
            }
            size="medium"
            variant="outline"
            color="primary"
            onClick={
              activeStage === "confirm"
                ? onClose
                : activeStage === "details"
                ? onClose
                : () =>
                    goToStage(
                      activeStage === "pricing"
                        ? "changes"
                        : activeStage === "changes"
                          ? "details"
                          : hasPricingJourney
                            ? "pricing"
                            : hasPreferenceJourney
                              ? "changes"
                              : "details",
                    )
            }
            disabled={submitting}
          />
          {activeStage === "confirm" ? (
            <Button
              type="button"
              text={submitting ? "Creating enquiry…" : "Confirm and continue"}
              size="medium"
              variant="solid"
              color="primary"
              onClick={handleSubmit}
              disabled={submitting}
            />
          ) : activeStage === "review" ? (
            <Button
              type="button"
              text={submitting ? journeyLabels.sending : submitText}
              size="medium"
              variant="solid"
              color="primary"
              onClick={handleSubmit}
              disabled={submitting}
            />
          ) : (
            <Button
              type="button"
              text={
                activeStage === "changes" &&
                form.customizationPreference === "customize" &&
                onCustomizeJourney
                  ? journeyLabels.customJourneyRedirectAction
                  : activeStage === "pricing"
                    ? journeyLabels.continueToReview
                    : activeStage === "changes"
                      ? hasPricingJourney
                        ? "Continue to package price"
                        : journeyLabels.continueToReview
                      : detailsContinueLabel
              }
              size="medium"
              variant="solid"
              color="primary"
              onClick={
                activeStage === "changes" &&
                form.customizationPreference === "customize" &&
                onCustomizeJourney
                  ? continueToCustomJourney
                  : () =>
                      activeStage === "pricing"
                        ? goToStage("review")
                        : activeStage === "changes"
                          ? handleChangesContinue()
                          : handleDetailsContinue()
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
  product: PropTypes.oneOf(Object.values(PRODUCT_TYPE)),
  closeOnOutsideClick: PropTypes.bool,
  initialSelections: PropTypes.object,
  onCustomizeJourney: PropTypes.func,
};

export default ContactAgentModal;
