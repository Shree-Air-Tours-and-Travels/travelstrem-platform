import React, { useEffect, useRef, useState } from "react";
import {
  Breadcrumbs,
  EnquiryCenter,
  FloatingActionBar,
  Icon,
  RealtimeConnectionStatus,
  QuoteDisplay,
  showToast,
  Spinner,
  StatusBadge,
  TextArea,
  TimelineStepper,
  TravellerDetailsForm,
} from "@packages/trem-ui";
import { ConfirmOverlay } from "@packages/trem-modals";
import "./booking-workspace.scss";
import QuoteBuilder from "../../quote-builder/QuoteBuilder.jsx";
import {
  loadBookingJourney,
  openQuoteDocument,
  requestQuotation,
  saveEnquiryDetails,
  saveTravellerDetails,
  updateQuoteDecision,
} from "../../services/bookingJourneyApi.js";

const referencedLabel = (journey, ref) => journey?.labels?.[ref] || "";

function JourneyNotice({ journey, block }) {
  return (
    <article
      className={`booking-engine-journey-notice is-${block.tone || "info"}`}
      role="status"
    >
      <span className="booking-engine-journey-notice__icon" aria-hidden="true">
        <Icon name={block.icon || "itinerary"} size={22} />
      </span>
      <div>
        <div className="booking-engine-journey-notice__heading">
          <h2>{referencedLabel(journey, block.titleRef)}</h2>
          {block.badgeRef ? (
            <StatusBadge
              value={referencedLabel(journey, block.badgeRef)}
              tone={block.badgeTone}
              size="sm"
            />
          ) : null}
        </div>
        <p>{referencedLabel(journey, block.descriptionRef)}</p>
        {block.liveStatus ? (
          <RealtimeConnectionStatus
            labels={Object.fromEntries(
              Object.entries(block.liveStatus.labelRefs || {}).map(([status, ref]) => [
                status,
                referencedLabel(journey, ref),
              ]),
            )}
          />
        ) : null}
      </div>
    </article>
  );
}

export default function BookingEnquiryCenter(props) {
  const [journeyPage, setJourneyPage] = useState(null);
  const [journey, setJourney] = useState(null);
  const [journeyState, setJourneyState] = useState({ loading: false, error: "", revision: 0 });
  const [decision, setDecision] = useState(null);
  const [decisionState, setDecisionState] = useState({ saving: false, error: "" });
  const [activeStepId, setActiveStepId] = useState("enquiry");
  const [travellerValues, setTravellerValues] = useState({});
  const [travellerState, setTravellerState] = useState({ saving: false, error: "", errors: {} });
  const [enquiryValues, setEnquiryValues] = useState({});
  const [enquiryFormState, setEnquiryFormState] = useState({ saving: false, error: "", errors: {} });
  const providerByRecordRef = useRef(new Map());
  const selectedListRecord = [...(props.enquiries || []), ...(props.bookings || [])].find(
    (item) => item.id === props.selectedId || item.enquiryRef === props.selectedId || item.reference === props.selectedId,
  );
  const activeJourney =
    journey?.data?.bookingId === selectedListRecord?.id ? journey : null;
  const providerKey = selectedListRecord?.id || selectedListRecord?.reference;
  const providerSource = activeJourney?.data?.record || selectedListRecord;
  const providerValue = {
    assignedAgent: providerSource?.assignedAgent || null,
    agency: providerSource?.agency || null,
  };
  if (
    providerKey &&
    !providerByRecordRef.current.has(providerKey) &&
    (providerValue.assignedAgent || providerValue.agency)
  ) {
    providerByRecordRef.current.set(providerKey, {
      assignedAgent: providerValue.assignedAgent,
      agency: providerValue.agency,
    });
  }
  const stableProvider = providerKey ? providerByRecordRef.current.get(providerKey) : null;
  const selectedRecord = selectedListRecord
    ? {
        ...selectedListRecord,
        ...(activeJourney?.data?.record || {}),
        ...(stableProvider?.assignedAgent
          ? { assignedAgent: stableProvider.assignedAgent }
          : {}),
        ...(stableProvider?.agency ? { agency: stableProvider.agency } : {}),
        ...(activeJourney ? { bookingJourney: activeJourney } : {}),
      }
    : null;
  const selectedTravellerForm = activeJourney?.data?.travellerForm;
  const selectedEnquiryForm = activeJourney?.data?.enquiryForm;

  useEffect(() => {
    setJourneyPage(null);
    setJourney(null);
    setDecision(null);
    setActiveStepId("enquiry");
  }, [props.selectedId, selectedListRecord?.id]);

  useEffect(() => {
    if (!selectedListRecord?.id) return;
    let active = true;
    setJourneyState((current) => ({ ...current, loading: true, error: "" }));
    loadBookingJourney(selectedListRecord.id, window.location.pathname, activeStepId)
      .then((response) => {
        if (!active) return;
        if (response?.status !== "success" || !response.componentData) {
          throw new Error(response?.message || "This booking step could not be loaded.");
        }
        setJourney(response.componentData);
        setActiveStepId(
          response.componentData.structure?.timeline?.activeStepId || activeStepId,
        );
        setJourneyState((current) => ({ ...current, loading: false, error: "" }));
      })
      .catch((error) => {
        if (active) {
          setJourneyState((current) => ({
            ...current,
            loading: false,
            error: error?.message || "This booking step could not be loaded.",
          }));
        }
      });
    return () => { active = false; };
  }, [activeStepId, journeyState.revision, selectedListRecord?.id, selectedListRecord?.status]);

  useEffect(() => {
    if (!selectedTravellerForm) return;
    setTravellerValues(selectedTravellerForm.values || {});
    setTravellerState({ saving: false, error: "", errors: {} });
  }, [selectedTravellerForm]);

  useEffect(() => {
    if (!selectedEnquiryForm) return;
    setEnquiryValues(selectedEnquiryForm.values || {});
    setEnquiryFormState({ saving: false, error: "", errors: {} });
  }, [selectedEnquiryForm]);

  const submitDecision = async () => {
    if (!decision) return;
    setDecisionState({ saving: true, error: "" });
    try {
      const response = await updateQuoteDecision(
        decision.enquiryId,
        decision.quoteId,
        decision.action,
        decision.notes,
      );
      if (response.status !== "success") throw new Error(response.message || "Your response could not be saved.");
      setDecision(null);
      setDecisionState({ saving: false, error: "" });
      showToast({ title: response.message, status: "success" });
      setJourneyState((current) => ({ ...current, revision: current.revision + 1 }));
      await props.onRetry?.();
      const convertedBooking = response.componentData?.data;
      if (convertedBooking?.bookingId && convertedBooking?.bookingRef) {
        props.onSelect?.({
          id: convertedBooking.bookingId,
          bookingRef: convertedBooking.bookingRef,
          reference: convertedBooking.bookingRef,
          recordType: "booking",
        });
      }
    } catch (error) {
      setDecisionState({ saving: false, error: error.message });
    }
  };

  const beginDecision = (action, selected, quote) => {
    setDecisionState({ saving: false, error: "" });
    setDecision({
      action: action.id,
      modal: action.modal || {},
      enquiryId: selected.id,
      quoteId: quote.id,
      notes: "",
    });
  };

  const submitTravellerDetails = async (selected) => {
    setTravellerState({ saving: true, error: "", errors: {} });
    try {
      const response = await saveTravellerDetails(selected.id, travellerValues);
      if (response.status !== "success") {
        setTravellerState({ saving: false, error: response.message, errors: response.componentData?.data?.errors || {} });
        return;
      }
      setTravellerState({ saving: false, error: "", errors: {} });
      showToast({ title: response.message, status: "success" });
      setJourneyState((current) => ({ ...current, revision: current.revision + 1 }));
      props.onRetry?.();
    } catch (error) {
      setTravellerState({ saving: false, error: error.message, errors: {} });
    }
  };

  const submitEnquiryDetails = async (selected) => {
    setEnquiryFormState({ saving: true, error: "", errors: {} });
    try {
      const response = await saveEnquiryDetails(selected.id, enquiryValues);
      if (response.status !== "success") {
        setEnquiryFormState({ saving: false, error: response.message, errors: response.componentData?.data?.errors || {} });
        return;
      }
      setEnquiryFormState({ saving: false, error: "", errors: {} });
      showToast({ title: response.message, status: "success" });
      setActiveStepId("travellers");
      setJourneyState((current) => ({ ...current, revision: current.revision + 1 }));
      props.onRetry?.();
    } catch (error) {
      setEnquiryFormState({ saving: false, error: error.message, errors: {} });
    }
  };

  const submitQuotationRequest = async (selected) => {
    setTravellerState((current) => ({ ...current, saving: true, error: "" }));
    try {
      const response = await requestQuotation(selected.id);
      if (response.status !== "success") throw new Error(response.message || "The quotation could not be requested.");
      showToast({ title: response.message, status: "success" });
      setTravellerState({ saving: false, error: "", errors: {} });
      setActiveStepId("quote");
      setJourneyState((current) => ({ ...current, revision: current.revision + 1 }));
      props.onRetry?.();
    } catch (error) {
      setTravellerState((current) => ({ ...current, saving: false, error: error.message }));
    }
  };

  const runJourneyAction = (action, selected) => {
    if (action.page) {
      if (props.onOpenJourneyPage) props.onOpenJourneyPage(action.page, selected.id);
      else setJourneyPage(action.page);
    }
    if (action.type === "download" && action.href)
      openQuoteDocument(action.href).catch((error) => showToast({ title: error.message, status: "error" }));
  };

  const renderDetailContent = (selected) => {
    if (journeyState.loading) {
      return <div className="booking-engine-journey-loading"><Spinner size="md" label="Loading booking step…" /></div>;
    }
    if (journeyState.error) {
      return <p className="is-error" role="alert">{journeyState.error}</p>;
    }
    const journey = selected.bookingJourney || {};
    const timeline = journey.structure?.timeline;
    if (!timeline) {
      const actions = journey.structure?.actions || [];
      return <>
        {(journey.structure?.blocks || []).map((block) => block.type === "notice" ? <JourneyNotice key={block.id} journey={journey} block={block} /> : null)}
        {actions.length ? <FloatingActionBar align="left-right" actions={actions.map((action, index) => ({
          label: referencedLabel(journey, action.labelRef),
          iconLeft: action.icon,
          variant: index === actions.length - 1 ? "primary" : "outline",
          align: index === actions.length - 1 ? "right" : "left",
          onClick: () => runJourneyAction(action, selected),
          disabled: action.disabled,
        }))} /> : null}
      </>;
    }
    const quote = journey.data?.quote;
    const quoteBlock = (journey.structure?.blocks || []).find((block) => block.type === "quote");
    const noticeBlock = (journey.structure?.blocks || []).find((block) => block.type === "notice");
    const downloadAction = (journey.structure?.actions || []).find((action) => action.type === "download");
    const quoteActions = quoteBlock?.actions || [];
    const timelineItems = (timeline.steps || []).map((step) => ({
      id: step.id,
      label: referencedLabel(journey, step.labelRef),
      description: referencedLabel(journey, step.descriptionRef),
      status: step.status,
      disabled: step.disabled,
      onClick: step.disabled ? undefined : () => setActiveStepId(step.id),
    }));
    const mapJourneyAction = (action) => {
      const mapped = {
        label: referencedLabel(journey, action.labelRef),
        variant: action.variant || "outline",
        align: action.align,
        iconLeft: action.iconLeft,
        iconRight: action.iconRight,
        disabled: Boolean(action.disabled),
      };
      if (action.type === "navigate-step") {
        mapped.onClick = () => setActiveStepId(action.targetStepId);
      } else if (action.type === "save-travellers") {
        mapped.onClick = () => submitTravellerDetails(selected);
        mapped.disabled = mapped.disabled || travellerState.saving;
      } else if (action.type === "request-quotation") {
        mapped.onClick = () => submitQuotationRequest(selected);
        mapped.disabled = mapped.disabled || travellerState.saving;
      }
      return mapped;
    };
    let stageContent = null;
    let actions = [];
    if (activeStepId === "enquiry") {
      stageContent = journey.data?.enquiryForm ? (
        <TravellerDetailsForm
          form={journey.data.enquiryForm}
          values={enquiryValues}
          errors={enquiryFormState.errors}
          onChange={(name, value) => setEnquiryValues((current) => ({ ...current, [name]: value }))}
        />
      ) : noticeBlock ? <JourneyNotice journey={journey} block={noticeBlock} /> : null;
      const travellerStep = (timeline.steps || []).find((step) => step.id === "travellers");
      const quoteStep = (timeline.steps || []).find((step) => step.id === "quote");
      if (journey.data?.enquiryForm && journey.data?.canEditEnquiry) {
        actions = [{ label: referencedLabel(journey, "saveEnquiryDetails"), variant: "primary", align: "right", iconRight: "chevronRight", onClick: () => submitEnquiryDetails(selected), disabled: enquiryFormState.saving }];
      } else if (journey.data?.enquiryForm && quoteStep && !quoteStep.disabled) {
        actions = [{ label: referencedLabel(journey, "viewQuotationStatus"), variant: "primary", align: "right", iconRight: "chevronRight", onClick: () => setActiveStepId("quote") }];
      } else if (travellerStep && !travellerStep.disabled) {
        actions = [{ label: referencedLabel(journey, "continueTravellerDetails"), variant: "primary", align: "right", iconRight: "chevronRight", onClick: () => setActiveStepId("travellers") }];
      } else if (quoteStep && !quoteStep.disabled) actions = [{ label: referencedLabel(journey, "viewQuote"), variant: "primary", align: "right", iconRight: "chevronRight", onClick: () => setActiveStepId("quote") }];
    } else if (activeStepId === "quote" && !quote) {
      stageContent = (
        <div className="booking-engine-quotation-pending">
          {noticeBlock ? <JourneyNotice journey={journey} block={noticeBlock} /> : null}
          {journey.data?.enquirySummaryForm ? (
            <TravellerDetailsForm
              form={journey.data.enquirySummaryForm}
              values={journey.data.enquirySummaryForm.values || {}}
              errors={{}}
              onChange={() => {}}
            />
          ) : null}
          {journey.data?.travellerSummaryForm ? (
            <TravellerDetailsForm
              form={journey.data.travellerSummaryForm}
              values={journey.data.travellerSummaryForm.values || {}}
              errors={{}}
              onChange={() => {}}
            />
          ) : null}
        </div>
      );
    } else if (activeStepId === "quote" && quote) {
      stageContent = <div className="booking-engine-customer-quote">
          <QuoteDisplay
            quote={quote}
            status={quote.status}
            allowedActions={quoteActions.map((action) => action.id)}
            showActions={false}
          />
        </div>;
      actions = [
        ...(downloadAction ? [{ label: referencedLabel(journey, downloadAction.labelRef), variant: "outline", iconLeft: downloadAction.icon, onClick: () => runJourneyAction(downloadAction, selected) }] : []),
        ...quoteActions.map((action) => ({
          label: referencedLabel(journey, action.labelRef),
          variant: action.id === "ACCEPT" ? "primary" : action.id === "CANCEL" || action.id === "REJECT" ? "danger" : "outline",
          align: "right",
          onClick: () => beginDecision(action, selected, quote),
        })),
        ...(String(quote.status).toUpperCase() === "ACCEPTED" ? [{ label: referencedLabel(journey, "addTravellers"), variant: "primary", align: "right", iconRight: "chevronRight", onClick: () => setActiveStepId("travellers") }] : []),
      ];
    } else if (activeStepId === "travellers" && journey.data?.travellerForm) {
      stageContent = <TravellerDetailsForm
        form={journey.data.travellerForm}
        values={travellerValues}
        errors={travellerState.errors}
        onChange={(name, value) => setTravellerValues((current) => ({ ...current, [name]: value }))}
      />;
      actions = (journey.structure?.stepActions || []).map(mapJourneyAction);
    } else if (activeStepId === "payment") {
      stageContent = noticeBlock ? <JourneyNotice journey={journey} block={noticeBlock} /> : null;
      actions = [{
        label: referencedLabel(journey, journey.data?.paymentEnabled ? "proceedPayment" : "paymentPending"),
        variant: "primary",
        align: "right",
        disabled: !journey.data?.paymentEnabled,
        onClick: journey.data?.paymentUrl ? () => window.location.assign(journey.data.paymentUrl) : undefined,
      }];
    } else if (activeStepId === "review") {
      stageContent = noticeBlock ? <JourneyNotice journey={journey} block={noticeBlock} /> : null;
    }
    const previousAction = journey.structure?.navigation?.previous;
    if (previousAction && !decision) actions = [mapJourneyAction(previousAction), ...actions];
    const decisionField = decision?.modal?.field;
    const closeDecision = () => {
      if (decisionState.saving) return;
      setDecision(null);
      setDecisionState({ saving: false, error: "" });
    };
    return <>
      <section className="booking-engine-customer-journey">
        <aside><TimelineStepper steps={timelineItems} markerVariant="number" showStepNumbers showTime={false} ariaLabel="Booking journey" /></aside>
        <div className="booking-engine-customer-journey__stage">{stageContent}</div>
      </section>
      {actions.length ? <FloatingActionBar align="left-right" actions={actions} error={enquiryFormState.error || travellerState.error || decisionState.error} /> : null}
      <ConfirmOverlay
        open={Boolean(decision?.quoteId && quote?.id && decision.quoteId === quote.id)}
        title={referencedLabel(journey, decision?.modal?.titleRef)}
        note={referencedLabel(journey, decision?.modal?.descriptionRef)}
        cancelLabel={referencedLabel(journey, decision?.modal?.cancelLabelRef)}
        confirmLabel={decisionState.saving
          ? referencedLabel(journey, "savingDecision")
          : referencedLabel(journey, decision?.modal?.confirmLabelRef)}
        confirmColor={decision?.modal?.tone === "danger" ? "danger" : "primary"}
        confirmDisabled={decisionState.saving || (decisionField?.required && decision.notes.trim().length < Number(decisionField.minLength || 1))}
        onClose={closeDecision}
        onConfirm={submitDecision}
      >
        {decisionField?.type === "textarea" ? (
          <TextArea
            label={referencedLabel(journey, decisionField.labelRef)}
            value={decision?.notes || ""}
            onChange={(notes) => setDecision((current) => ({ ...current, notes }))}
            maxLength={decisionField.maxLength}
            rows={decisionField.rows}
            required={decisionField.required}
            error={decisionState.error}
          />
        ) : decisionState.error ? <p className="is-error">{decisionState.error}</p> : null}
      </ConfirmOverlay>
    </>;
  };

  const renderDetailOverride = () => {
    if (!journeyPage) return null;
    const labels = journeyPage.labels || {};
    const structure = journeyPage.structure || {};
    const breadcrumbs = (structure.breadcrumbs || []).map((item, index, items) => ({
      label: labels[item.labelRef] || "",
      onClick: index < items.length - 1 ? () => setJourneyPage(null) : undefined,
    }));

    return (
      <section className="booking-engine-journey-page">
        <Breadcrumbs items={breadcrumbs} />
        {structure.component?.type === "quote-builder" ? (
          <QuoteBuilder enquiryId={structure.component.enquiryId || journeyPage.data?.enquiryId} onExit={() => setJourneyPage(null)} />
        ) : (
          <div
            className="booking-engine-journey-page__empty"
            aria-label={labels[structure.contentLabelRef] || "Quote journey"}
          />
        )}
      </section>
    );
  };

  return (
    <EnquiryCenter
      {...props}
      enquiries={(props.enquiries || []).map((item) =>
        selectedRecord && item.id === selectedListRecord?.id ? selectedRecord : item,
      )}
      bookings={(props.bookings || []).map((item) =>
        selectedRecord && item.id === selectedListRecord?.id ? selectedRecord : item,
      )}
      renderDetailActions={() => null}
      renderDetailContent={renderDetailContent}
      renderDetailOverride={renderDetailOverride}
      showDetailPanels={() => !activeJourney?.structure?.timeline}
    />
  );
}
