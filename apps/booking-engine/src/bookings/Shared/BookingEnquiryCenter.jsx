import React, { useEffect, useState } from "react";
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
import "./booking-workspace.scss";
import QuoteBuilder from "../../quote-builder/QuoteBuilder.jsx";
import {
  loadBookingJourney,
  openQuoteDocument,
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
  const selectedListRecord = [...(props.enquiries || []), ...(props.bookings || [])].find(
    (item) => item.id === props.selectedId || item.enquiryRef === props.selectedId || item.reference === props.selectedId,
  );
  const activeJourney =
    journey?.data?.bookingId === selectedListRecord?.id ? journey : null;
  const selectedRecord = selectedListRecord
    ? {
        ...selectedListRecord,
        ...(activeJourney?.data?.record || {}),
        ...(activeJourney ? { bookingJourney: activeJourney } : {}),
      }
    : null;
  const selectedTravellerForm = activeJourney?.data?.travellerForm;

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
  }, [selectedTravellerForm?.completedAt, Boolean(selectedTravellerForm)]);

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
      props.onRetry?.();
    } catch (error) {
      setDecisionState({ saving: false, error: error.message });
    }
  };

  const beginDecision = (action, selected, quote) => {
    setDecisionState({ saving: false, error: "" });
    setDecision({ action, enquiryId: selected.id, quoteId: quote.id, notes: "" });
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
    let stageContent = null;
    let actions = [];
    if (activeStepId === "enquiry") {
      stageContent = noticeBlock ? <JourneyNotice journey={journey} block={noticeBlock} /> : null;
      const quoteStep = (timeline.steps || []).find((step) => step.id === "quote");
      if (quoteStep && !quoteStep.disabled) actions = [{ label: referencedLabel(journey, "viewQuote"), variant: "primary", align: "right", iconRight: "chevronRight", onClick: () => setActiveStepId("quote") }];
    } else if (activeStepId === "quote" && quote) {
      stageContent = <div className="booking-engine-customer-quote">
          <QuoteDisplay
            quote={quote}
            status={quote.status}
            allowedActions={quoteActions.map((action) => action.id)}
            showActions={false}
          />
          {decision?.quoteId === quote.id ? (
            <section className="booking-engine-quote-decision" aria-live="polite">
              <h3>{decision.action === "REQUEST_CHANGES" ? "What should we change?" : {
                ACCEPT: "Accept this quotation?",
                REJECT: "Reject this quotation?",
                CANCEL: "Cancel this booking request?",
              }[decision.action]}</h3>
              <p>{decision.action === "REQUEST_CHANGES"
                ? "Describe the exact hotel, room, flight, activity, date, or price change you need."
                : "This response will be shared with your travel specialist immediately."}</p>
              {decision.action === "REQUEST_CHANGES" ? (
                <TextArea
                  label="Changes required"
                  value={decision.notes}
                  onChange={(notes) => setDecision((current) => ({ ...current, notes }))}
                  maxLength={1200}
                  rows={4}
                  required
                  error={decisionState.error}
                />
              ) : decisionState.error ? <p className="is-error">{decisionState.error}</p> : null}
            </section>
          ) : null}
        </div>;
      actions = [
        ...(downloadAction ? [{ label: referencedLabel(journey, downloadAction.labelRef), variant: "outline", iconLeft: downloadAction.icon, onClick: () => runJourneyAction(downloadAction, selected) }] : []),
        ...quoteActions.map((action) => ({
          label: referencedLabel(journey, action.labelRef),
          variant: action.id === "ACCEPT" ? "primary" : action.id === "CANCEL" || action.id === "REJECT" ? "danger" : "outline",
          align: action.id === "ACCEPT" ? "right" : "left",
          onClick: () => beginDecision(action.id, selected, quote),
        })),
        ...(String(quote.status).toUpperCase() === "ACCEPTED" ? [{ label: referencedLabel(journey, "addTravellers"), variant: "primary", align: "right", iconRight: "chevronRight", onClick: () => setActiveStepId("travellers") }] : []),
      ];
      if (decision?.quoteId === quote.id) actions = [
        {
          label: "Keep reviewing",
          variant: "outline",
          onClick: () => { setDecision(null); setDecisionState({ saving: false, error: "" }); },
          disabled: decisionState.saving,
        },
        {
          label: decisionState.saving ? "Saving…" : decision.action === "REQUEST_CHANGES" ? "Send change request" : "Confirm",
          variant: ["REJECT", "CANCEL"].includes(decision.action) ? "danger" : "primary",
          align: "right",
          onClick: submitDecision,
          disabled: decisionState.saving || (decision.action === "REQUEST_CHANGES" && decision.notes.trim().length < 5),
        },
      ];
    } else if (activeStepId === "travellers" && journey.data?.travellerForm) {
      stageContent = <TravellerDetailsForm
        form={journey.data.travellerForm}
        values={travellerValues}
        errors={travellerState.errors}
        onChange={(name, value) => setTravellerValues((current) => ({ ...current, [name]: value }))}
      />;
      actions = [
        { label: referencedLabel(journey, "saveTravellers"), variant: "outline", onClick: () => submitTravellerDetails(selected), disabled: travellerState.saving },
        { label: referencedLabel(journey, "proceedPayment"), variant: "primary", align: "right", disabled: true },
      ];
    } else if (activeStepId === "review") {
      stageContent = noticeBlock ? <JourneyNotice journey={journey} block={noticeBlock} /> : null;
    }
    return <>
      <section className="booking-engine-customer-journey">
        <aside><TimelineStepper steps={timelineItems} markerVariant="number" showStepNumbers showTime={false} ariaLabel="Booking journey" /></aside>
        <div className="booking-engine-customer-journey__stage">{stageContent}</div>
      </section>
      {actions.length ? <FloatingActionBar align="left-right" actions={actions} error={travellerState.error || decisionState.error} /> : null}
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
      showDetailPanels={() => !activeJourney?.structure?.timeline || activeStepId === "enquiry"}
    />
  );
}
