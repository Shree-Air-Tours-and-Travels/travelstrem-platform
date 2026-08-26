import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  EmptyState,
  InputField,
  SingleSelect,
  Spinner,
  StatusBadge,
  SupportComposer,
  SupportConversation,
  SupportTicketCard,
  TextArea,
} from "@packages/trem-ui";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { SUPPORT_ANALYTICS_EVENT } from "@packages/trem-support-contracts";
import {
  REALTIME_EVENTS,
  useRealtimeEvent,
  useRealtimeStatus,
  useSupportRealtime,
} from "@packages/trem-events";
import { supportApi } from "./support.api";
import { useSupportResource } from "./support.hooks";
import { ResourceBoundary, SupportLayout } from "./SupportLayout";
import { formatDateTime, trackSupport } from "./support.utils";

export function NewSupportRequestPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [categoryId, setCategoryId] = useState(params.get("category") || "");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const categories = useSupportResource((signal) => supportApi.categories(signal), []);
  const categoryOptions = useMemo(
    () =>
      (categories.data?.categories || []).map((category) => ({
        value: category.id,
        label: category.label,
      })),
    [categories.data],
  );
  const ui = categories.data?.ui || {};

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const result = await supportApi.createTicket({
        serviceId: params.get("serviceId") || "",
        categoryId,
        subject,
        description,
      });
      setCreated(result.ticket);
      trackSupport(SUPPORT_ANALYTICS_EVENT.TICKET_CREATED, {
        ticketId: result.ticket?.id,
        categoryId,
      });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (created)
    return (
      <SupportLayout title={ui.successTitle} subtitle={ui.successSubtitle}>
        <div className="support-confirmation">
          <span className="support-confirmation__icon">✓</span>
          <h2>{created.reference}</h2>
          <p>{ui.successMessage}</p>
          <Button
            text={ui.viewRequestLabel}
            onClick={() => navigate(`/help/requests/${created.id}`)}
          />
          <Button variant="text" text={ui.backLabel} onClick={() => navigate("/help")} />
        </div>
      </SupportLayout>
    );

  return (
    <SupportLayout title={ui.title} subtitle={ui.subtitle}>
      <ResourceBoundary {...categories}>
        <form
          className="support-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <SingleSelect
            label={ui.categoryLabel}
            placeholder={ui.categoryPlaceholder}
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions}
            required
          />
          <InputField
            label={ui.subjectLabel}
            value={subject}
            onChange={setSubject}
            maxLength={180}
            required
            placeholder={ui.subjectPlaceholder}
          />
          <TextArea
            label={ui.descriptionLabel}
            value={description}
            onChange={setDescription}
            maxLength={5000}
            required
            placeholder={ui.descriptionPlaceholder}
          />
          {error ? (
            <p className="support-form__error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="support-form__actions">
            <Button
              type="submit"
              text={submitting ? ui.submittingLabel : ui.submitLabel}
              disabled={!categoryId || !subject.trim() || !description.trim() || submitting}
            />
          </div>
        </form>
      </ResourceBoundary>
    </SupportLayout>
  );
}

export function SupportRequestsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const resource = useSupportResource((signal) => supportApi.tickets(status, signal), [status]);
  const statuses = resource.data?.statuses || [];
  const ui = resource.data?.ui || {};
  const labelByStatus = Object.fromEntries(statuses.map((item) => [item.id, item.label]));
  useRealtimeEvent(REALTIME_EVENTS.SUPPORT_CONVERSATION_UPDATED, (envelope) => {
    const update = envelope?.data;
    const ticketId = String(update?.ticketId || update?.id || "");
    if (!ticketId) return;
    resource.updateData((current) => {
      if (!current) return current;
      const tickets = (current.tickets || [])
        .map((ticket) =>
          String(ticket.id || ticket._id) === ticketId
            ? { ...ticket, ...update, id: ticketId }
            : ticket,
        )
        .filter((ticket) => !status || ticket.status === status)
        .sort((left, right) => new Date(right.lastActivityAt) - new Date(left.lastActivityAt));
      return { ...current, tickets };
    });
  });
  return (
    <SupportLayout
      title={ui.title || "My Support Requests"}
      subtitle={ui.subtitle || "Track requests and replies from the support team."}
      actions={
        ui.newRequestLabel ? (
          <Button
            text={ui.newRequestLabel}
            onClick={() => {
              trackSupport(SUPPORT_ANALYTICS_EVENT.TICKET_STARTED);
              navigate("/help/new-request");
            }}
          />
        ) : null
      }
    >
      {statuses.length ? (
        <div className="support-filter-row" aria-label="Filter support requests by status">
          <Button
            size="small"
            variant={!status ? "solid" : "outline"}
            text={ui.allLabel || "All"}
            onClick={() => setStatus("")}
            aria-pressed={!status}
          />
          {statuses.map((item) => (
            <Button
              size="small"
              variant={status === item.id ? "solid" : "outline"}
              key={item.id}
              text={item.label.replaceAll("_", " ")}
              onClick={() => setStatus(item.id)}
              aria-pressed={status === item.id}
            />
          ))}
        </div>
      ) : null}
      {resource.loading && resource.data ? (
        <div className="support-results-loading">
          <Spinner label="Loading requests" />
        </div>
      ) : (
        <ResourceBoundary {...resource}>
          {resource.data?.tickets?.length ? (
            <div className="support-list">
              {resource.data.tickets.map((ticket) => (
                <SupportTicketCard
                  key={ticket.id}
                  ticket={{
                    ...ticket,
                    status: { id: ticket.status, label: labelByStatus[ticket.status] },
                    updatedLabel: `${ui.updatedPrefix} ${formatDateTime(ticket.lastActivityAt)}`,
                  }}
                  onSelect={() => navigate(`/help/requests/${ticket.id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              {...resource.data?.emptyState}
              action={
                ui.newRequestLabel ? (
                  <Button text={ui.newRequestLabel} onClick={() => navigate("/help/new-request")} />
                ) : null
              }
            />
          )}
        </ResourceBoundary>
      )}
    </SupportLayout>
  );
}

export function SupportTicketDetailPage() {
  const { ticketId } = useParams();
  const resource = useSupportResource((signal) => supportApi.ticket(ticketId, signal), [ticketId]);
  const [content, setContent] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [history, setHistory] = useState({ messages: [], pagination: null });
  const [liveMessages, setLiveMessages] = useState([]);
  const [liveTicket, setLiveTicket] = useState(null);
  const [error, setError] = useState("");
  const { isConnected } = useRealtimeStatus();
  useEffect(() => {
    setHistory({ messages: [], pagination: null });
    setLiveMessages([]);
    setLiveTicket(null);
  }, [ticketId]);
  const messages = useMemo(() => {
    const byId = new Map();
    [...history.messages, ...(resource.data?.messages || []), ...liveMessages].forEach(
      (message) => {
        const key = String(
          message.clientMessageId || message.id || message._id || message.messageId,
        );
        byId.set(key, message);
      },
    );
    return [...byId.values()].sort(
      (left, right) => new Date(left.createdAt) - new Date(right.createdAt),
    );
  }, [history.messages, liveMessages, resource.data?.messages]);
  const messagePagination = history.pagination || resource.data?.messagePagination || {};
  const loadOlder = async () => {
    if (!messagePagination.nextBefore || loadingOlder) return;
    setLoadingOlder(true);
    setError("");
    try {
      const data = await supportApi.ticket(ticketId, undefined, messagePagination.nextBefore);
      setHistory((current) => ({
        messages: [...(data.messages || []), ...current.messages],
        pagination: data.messagePagination || null,
      }));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoadingOlder(false);
    }
  };
  const send = async (event) => {
    event.preventDefault();
    const nextContent = content.trim();
    if (!nextContent) return;
    const clientMessageId =
      globalThis.crypto?.randomUUID?.() || `support-${Date.now()}-${Math.random()}`;
    const optimisticMessage = {
      id: clientMessageId,
      clientMessageId,
      senderType: "customer",
      senderName: "You",
      content: nextContent,
      createdAt: new Date().toISOString(),
    };
    setContent("");
    setPendingCount((count) => count + 1);
    setLiveMessages((current) => [...current, optimisticMessage]);
    setError("");
    try {
      const data = await supportApi.reply(ticketId, nextContent, clientMessageId);
      setLiveMessages((current) => [...current, data.message].filter(Boolean));
      setLiveTicket(data.ticket || null);
    } catch (failure) {
      setLiveMessages((current) =>
        current.filter((message) => message.clientMessageId !== clientMessageId),
      );
      setContent((current) => current || nextContent);
      setError(failure.message);
    } finally {
      setPendingCount((count) => Math.max(0, count - 1));
    }
  };
  const ticket = resource.data?.ticket
    ? { ...resource.data.ticket, ...(liveTicket || {}) }
    : resource.data?.ticket;
  const ui = resource.data?.ui || {};
  useSupportRealtime(ticketId);
  useRealtimeEvent(REALTIME_EVENTS.SUPPORT_MESSAGE_CREATED, (envelope) => {
    const message = envelope?.data;
    if (String(message?.ticketId || "") !== String(ticketId || "")) return;
    setLiveMessages((current) => [...current, message]);
  });
  useRealtimeEvent(REALTIME_EVENTS.SUPPORT_CONVERSATION_UPDATED, (envelope) => {
    const nextTicket = envelope?.data;
    if (String(nextTicket?.ticketId || "") !== String(ticketId || "")) return;
    setLiveTicket((current) => ({ ...(current || {}), ...nextTicket }));
  });
  const canReply = !["RESOLVED", "CLOSED"].includes(ticket?.status);
  return (
    <SupportLayout
      title={ticket?.subject || ui.fallbackTitle}
      subtitle={ticket?.reference}
      className="support-page--ticket"
    >
      <ResourceBoundary {...resource}>
        {ticket ? (
          <div className="support-ticket-detail">
            <div className="support-ticket-summary">
              <div>
                <span>{ui.statusLabel}</span>
                <StatusBadge value={String(ticket.status || "").replaceAll("_", " ")} size="sm" />
              </div>
              <div>
                <span>{ui.categoryLabel}</span>
                <strong>{resource.data?.category?.label}</strong>
              </div>
              <div>
                <span>{ui.createdLabel}</span>
                <strong>{formatDateTime(ticket.createdAt)}</strong>
              </div>
            </div>
            <SupportConversation
              title={ui.conversationTitle}
              className="support-ticket-detail__conversation"
              messages={messages}
              ownSenderType="customer"
              hasMore={Boolean(messagePagination.hasMore)}
              loadingOlder={loadingOlder}
              onLoadOlder={loadOlder}
              live={isConnected}
              composer={
                <SupportComposer
                  value={content}
                  onChange={setContent}
                  onSubmit={send}
                  pendingCount={pendingCount}
                  disabled={!canReply}
                  label={ui.replyLabel}
                  placeholder={ui.replyPlaceholder}
                  sendLabel={ui.sendLabel}
                  sendingLabel={ui.sendingLabel}
                  closedMessage={ui.closedMessage}
                />
              }
            />
            {error ? (
              <p className="support-form__error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </ResourceBoundary>
    </SupportLayout>
  );
}
