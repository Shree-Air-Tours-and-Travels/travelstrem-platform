import React, { useState } from "react";
import { Button, SingleSelect, TextArea } from "@packages/trem-ui";
import { useNavigate, useParams } from "react-router-dom";
import { SUPPORT_ANALYTICS_EVENT, SUPPORT_REQUEST_TYPE } from "@packages/trem-support-contracts";
import { supportApi } from "./support.api";
import { useSupportResource } from "./support.hooks";
import { ResourceBoundary, SupportLayout } from "./SupportLayout";
import { trackSupport } from "./support.utils";

const COPY = {
  [SUPPORT_REQUEST_TYPE.REFUND]: { title: "Request a refund", event: SUPPORT_ANALYTICS_EVENT.REFUND_STARTED, successEvent: SUPPORT_ANALYTICS_EVENT.REFUND_REQUESTED },
  [SUPPORT_REQUEST_TYPE.CANCELLATION]: { title: "Cancel booking", event: SUPPORT_ANALYTICS_EVENT.CANCELLATION_STARTED },
  [SUPPORT_REQUEST_TYPE.RESCHEDULE]: { title: "Reschedule booking", event: SUPPORT_ANALYTICS_EVENT.RESCHEDULE_STARTED },
};

export default function BookingRequestPage({ type }) {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const resource = useSupportResource((signal) => supportApi.eligibility(bookingId, type, signal), [bookingId, type]);
  const [reasonId, setReasonId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const copy = COPY[type];
  React.useEffect(() => { trackSupport(copy.event, { bookingId }); }, [bookingId, copy.event]);
  const submit = async () => { setSubmitting(true); setError(""); try { const data = await supportApi.submitBookingRequest(bookingId, type, { reasonId, note }); setResult(data.request); if (copy.successEvent) trackSupport(copy.successEvent, { bookingId, requestId: data.request?.id }); } catch (failure) { setError(failure.message); } finally { setSubmitting(false); } };
  const eligibility = resource.data?.eligibility;
  if (result) return <SupportLayout title="Request submitted" subtitle={result.reference}><div className="support-confirmation"><span className="support-confirmation__icon">✓</span><h2>{result.reference}</h2><p>Your request was submitted for review.</p><Button text="Back to booking support" onClick={() => navigate(`/help/booking/${bookingId}`)} /></div></SupportLayout>;
  return <SupportLayout title={copy.title} subtitle={eligibility?.booking?.title}><ResourceBoundary {...resource}>{eligibility ? <div className="support-eligibility">
    <div className={`support-eligibility__notice support-eligibility__notice--${eligibility.eligible ? "eligible" : "ineligible"}`}><strong>{eligibility.status.replaceAll("_", " ")}</strong><p>{eligibility.explanation}</p></div>
    {eligibility.policy?.summary ? <div className="support-policy"><h2>Policy summary</h2><p>{eligibility.policy.summary}</p></div> : null}
    {eligibility.eligible ? <div className="support-form">{eligibility.reasonOptions?.length ? <SingleSelect label="Reason" placeholder="Choose a reason" value={reasonId} onChange={setReasonId} options={eligibility.reasonOptions.map((item) => ({ value: item.id, label: item.label }))} /> : null}<TextArea label="Additional details (optional)" value={note} onChange={setNote} maxLength={3000} />{error ? <p role="alert" className="support-form__error">{error}</p> : null}<Button text={submitting ? "Submitting…" : "Submit request"} onClick={submit} disabled={submitting} /></div> : <Button text="Create a support request" onClick={() => navigate(`/help/new-request?bookingId=${bookingId}`)} />}
  </div> : null}</ResourceBoundary></SupportLayout>;
}
