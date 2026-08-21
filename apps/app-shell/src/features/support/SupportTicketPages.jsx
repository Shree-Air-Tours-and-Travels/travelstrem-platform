import React, { useMemo, useState } from "react";
import { Button, EmptyState, InputField, MessageBubble, SingleSelect, SupportTicketCard, TextArea } from "@packages/trem-ui";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { SUPPORT_ANALYTICS_EVENT } from "@packages/trem-support-contracts";
import { supportApi } from "./support.api";
import { useSupportResource } from "./support.hooks";
import { ResourceBoundary, SupportLayout, SupportSection } from "./SupportLayout";
import { formatDateTime, trackSupport } from "./support.utils";

export function NewSupportRequestPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [bookingId, setBookingId] = useState(params.get("bookingId") || "");
  const [categoryId, setCategoryId] = useState(params.get("category") || "");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const bookings = useSupportResource((signal) => supportApi.bookings(signal), []);
  const categories = useSupportResource((signal) => supportApi.categories(bookingId, signal), [bookingId]);
  const bookingOptions = useMemo(() => (bookings.data?.bookings || []).map((booking) => ({ value: booking.id, label: `${booking.title} · ${booking.reference}` })), [bookings.data]);
  const categoryOptions = useMemo(() => (categories.data?.categories || []).map((category) => ({ value: category.id, label: category.label })), [categories.data]);

  const submit = async () => {
    setSubmitting(true); setError("");
    try {
      const result = await supportApi.createTicket({ bookingId: bookingId || null, serviceId: params.get("serviceId") || "", categoryId, subject, description });
      setCreated(result.ticket);
      trackSupport(SUPPORT_ANALYTICS_EVENT.TICKET_CREATED, { ticketId: result.ticket?.id, categoryId, relatedToBooking: Boolean(bookingId) });
    } catch (failure) { setError(failure.message); } finally { setSubmitting(false); }
  };

  if (created) return <SupportLayout title="Request received" subtitle="The support team will respond in your request history."><div className="support-confirmation"><span className="support-confirmation__icon">✓</span><h2>{created.reference}</h2><p>Your support request has been created.</p><Button text="View request" onClick={() => navigate(`/help/requests/${created.id}`)} /><Button variant="text" text="Back to Help & Support" onClick={() => navigate("/help")} /></div></SupportLayout>;

  return <SupportLayout title="Create support request" subtitle={reviewing ? "Review the details before submitting." : "Tell us what you need help with."}><ResourceBoundary loading={bookings.loading || categories.loading} error={bookings.error || categories.error} reload={() => { bookings.reload(); categories.reload(); }}>
    <form className="support-form" onSubmit={(event) => { event.preventDefault(); reviewing ? submit() : setReviewing(true); }}>
      {!reviewing ? <>
        <SingleSelect label="Related booking (optional)" placeholder="No related booking" value={bookingId} onChange={(value) => { setBookingId(value); setCategoryId(""); }} options={bookingOptions} clearable />
        <SingleSelect label="Issue category" placeholder="Choose a category" value={categoryId} onChange={setCategoryId} options={categoryOptions} required />
        <InputField label="Subject" value={subject} onChange={setSubject} maxLength={180} required placeholder="Briefly describe the issue" />
        <TextArea label="Description" value={description} onChange={setDescription} maxLength={5000} required placeholder="Include the details the support team needs to help." />
      </> : <div className="support-review">
        <div><span>Booking</span><strong>{bookingOptions.find((item) => item.value === bookingId)?.label || "Not related to a booking"}</strong></div>
        <div><span>Category</span><strong>{categoryOptions.find((item) => item.value === categoryId)?.label}</strong></div>
        <div><span>Subject</span><strong>{subject}</strong></div>
        <div><span>Description</span><p>{description}</p></div>
      </div>}
      {error ? <p className="support-form__error" role="alert">{error}</p> : null}
      <div className="support-form__actions">{reviewing ? <Button type="button" variant="outline" text="Edit" onClick={() => setReviewing(false)} disabled={submitting} /> : null}<Button type="submit" text={reviewing ? (submitting ? "Submitting…" : "Submit request") : "Review request"} disabled={!categoryId || !subject.trim() || !description.trim() || submitting} /></div>
    </form>
  </ResourceBoundary></SupportLayout>;
}

export function SupportRequestsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const resource = useSupportResource((signal) => supportApi.tickets(status, signal), [status]);
  const statuses = resource.data?.statuses || [];
  const labelByStatus = Object.fromEntries(statuses.map((item) => [item.id, item.label]));
  return <SupportLayout title="My Support Requests" subtitle="Track requests and replies from the support team." actions={<Button text="New request" onClick={() => { trackSupport(SUPPORT_ANALYTICS_EVENT.TICKET_STARTED); navigate("/help/new-request"); }} />}><ResourceBoundary {...resource}>
    <div className="support-filter-row"><button type="button" className={!status ? "is-active" : ""} onClick={() => setStatus("")}>All</button>{statuses.map((item) => <button type="button" key={item.id} className={status === item.id ? "is-active" : ""} onClick={() => setStatus(item.id)}>{item.label.replaceAll("_", " ")}</button>)}</div>
    {resource.data?.tickets?.length ? <div className="support-list">{resource.data.tickets.map((ticket) => <SupportTicketCard key={ticket.id} ticket={{ ...ticket, status: { id: ticket.status, label: labelByStatus[ticket.status] }, bookingLabel: ticket.booking?.bookingRef, updatedLabel: `Updated ${formatDateTime(ticket.lastActivityAt)}` }} onSelect={() => navigate(`/help/requests/${ticket.id}`)} />)}</div> : <EmptyState {...resource.data?.emptyState} />}
  </ResourceBoundary></SupportLayout>;
}

export function SupportTicketDetailPage() {
  const { ticketId } = useParams();
  const resource = useSupportResource((signal) => supportApi.ticket(ticketId, signal), [ticketId]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const send = async (event) => {
    event.preventDefault(); setSending(true); setError("");
    try { await supportApi.reply(ticketId, content); setContent(""); resource.reload(); } catch (failure) { setError(failure.message); } finally { setSending(false); }
  };
  const ticket = resource.data?.ticket;
  return <SupportLayout title={ticket?.subject || "Support request"} subtitle={ticket?.reference}><ResourceBoundary {...resource}>{ticket ? <>
    <div className="support-ticket-summary"><div><span>Status</span><strong>{resource.data?.status?.label}</strong></div><div><span>Category</span><strong>{resource.data?.category?.label}</strong></div><div><span>Created</span><strong>{formatDateTime(ticket.createdAt)}</strong></div>{ticket.booking?.bookingRef ? <div><span>Booking</span><strong>{ticket.booking.bookingRef}</strong></div> : null}</div>
    <SupportSection title="Conversation"><div className="support-conversation">{(resource.data?.messages || []).map((message) => <MessageBubble key={message.id} content={message.content} senderName={message.senderName} senderType={message.senderType} timestamp={message.createdAt} isOwn={message.senderType === "customer"} />)}</div></SupportSection>
    {resource.data?.canReply ? <form className="support-composer" onSubmit={send}><TextArea label="Reply" value={content} onChange={setContent} maxLength={5000} rows={3} placeholder="Write a reply" />{error ? <p className="support-form__error" role="alert">{error}</p> : null}<Button type="submit" text={sending ? "Sending…" : "Send reply"} disabled={!content.trim() || sending} /></form> : <p className="support-closed-note">This request no longer accepts replies.</p>}
  </> : null}</ResourceBoundary></SupportLayout>;
}
