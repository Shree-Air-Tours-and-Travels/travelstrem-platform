import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  EmptyState,
  InputField,
  SingleSelect,
  StatusBadge,
  SupportComposer,
  SupportConversation,
  TextArea,
} from "@packages/trem-ui";
import { fetchData } from "@packages/trem-utils";
import {
  REALTIME_EVENTS,
  useRealtimeEvent,
  useRealtimeStatus,
  useSupportRealtime,
} from "@packages/trem-events";
import "./AgentSupportPage.scss";

const idOf = (value) =>
  String(value?.id || value?._id || value?.messageId || value?.ticketId || "");
const messageKey = (value) => String(value?.clientMessageId || idOf(value));
const dateTime = (value) => (value ? new Date(value).toLocaleString() : "—");
const mergeMessages = (...groups) => {
  const byId = new Map();
  groups.flat().forEach((message) => byId.set(messageKey(message), message));
  return [...byId.values()].sort(
    (left, right) => new Date(left.createdAt) - new Date(right.createdAt),
  );
};
const supportRequest = async (path, options) => {
  const response = await fetchData(`/support${path}`, options);
  if (response?.status !== "success")
    throw new Error(response?.message || "Support request could not be completed");
  return response.data || response.componentData?.data || {};
};

export default function AgentSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [listUi, setListUi] = useState({});
  const [formUi, setFormUi] = useState({});
  const [detail, setDetail] = useState(null);
  const [mode, setMode] = useState("list");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const { isConnected } = useRealtimeStatus();

  const categoryOptions = useMemo(
    () => categories.map((item) => ({ value: item.id, label: item.label })),
    [categories],
  );

  const loadTickets = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const data = await supportRequest("/tickets", {
        params: { status: status || undefined },
      });
      setTickets(data.tickets || []);
      setStatuses(data.statuses || []);
      setListUi(data.ui || {});
    } catch (failure) {
      setError(failure?.message || "Support requests could not be loaded");
    } finally {
      setBusy(false);
    }
  }, [status]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await supportRequest("/categories");
      setCategories(data.categories || []);
      setFormUi(data.ui || {});
    } catch (failure) {
      setError(failure?.message || "Support options could not be loaded");
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const activeTicketId = idOf(detail?.ticket);
  useSupportRealtime(activeTicketId);
  useRealtimeEvent(REALTIME_EVENTS.SUPPORT_MESSAGE_CREATED, (envelope) => {
    const message = envelope?.data;
    if (!activeTicketId || String(message?.ticketId || "") !== activeTicketId) return;
    setDetail((current) => ({
      ...current,
      messages: mergeMessages(current?.messages || [], message),
    }));
  });
  useRealtimeEvent(REALTIME_EVENTS.SUPPORT_CONVERSATION_UPDATED, (envelope) => {
    const ticketUpdate = envelope?.data;
    const ticketId = String(ticketUpdate?.ticketId || "");
    if (!ticketId) return;
    setTickets((current) =>
      current.map((item) =>
        idOf(item) === ticketId ? { ...item, ...ticketUpdate, id: ticketId } : item,
      ),
    );
    if (activeTicketId === ticketId)
      setDetail((current) => ({
        ...current,
        ticket: { ...current?.ticket, ...ticketUpdate, id: ticketId },
        canReply: !["RESOLVED", "CLOSED"].includes(ticketUpdate.status),
      }));
  });

  const openTicket = async (ticketId, { before = "", prepend = false } = {}) => {
    if (prepend) setLoadingOlder(true);
    else setBusy(true);
    setError("");
    try {
      const data = await supportRequest(`/tickets/${ticketId}`, {
        params: before ? { before } : undefined,
      });
      setDetail((current) =>
        prepend && idOf(current?.ticket) === ticketId
          ? { ...data, messages: mergeMessages(data.messages || [], current.messages || []) }
          : data || null,
      );
      setMode("detail");
    } catch (failure) {
      setError(failure?.message || "Support request could not be loaded");
    } finally {
      if (prepend) setLoadingOlder(false);
      else setBusy(false);
    }
  };

  const createTicket = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await supportRequest("/tickets", {
        method: "POST",
        body: { categoryId, subject: subject.trim(), description: description.trim() },
      });
      const ticket = data.ticket;
      setCategoryId("");
      setSubject("");
      setDescription("");
      setTickets((current) => [ticket, ...current.filter((item) => idOf(item) !== idOf(ticket))]);
      await openTicket(idOf(ticket));
    } catch (failure) {
      setError(failure?.message || "Support request could not be created");
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    const ticketId = idOf(detail?.ticket);
    const content = reply.trim();
    if (!ticketId || !content) return;
    const clientMessageId =
      globalThis.crypto?.randomUUID?.() || `support-${Date.now()}-${Math.random()}`;
    const optimisticMessage = {
      id: clientMessageId,
      clientMessageId,
      senderType: "customer",
      senderName: "You",
      content,
      createdAt: new Date().toISOString(),
    };
    setReply("");
    setPendingCount((count) => count + 1);
    setDetail((current) => ({
      ...current,
      messages: mergeMessages(current?.messages || [], optimisticMessage),
    }));
    setError("");
    try {
      const data = await supportRequest(`/tickets/${ticketId}/messages`, {
        method: "POST",
        body: { content, clientMessageId },
      });
      setDetail((current) => ({
        ...current,
        ticket: { ...current?.ticket, ...(data.ticket || {}) },
        messages: mergeMessages(current?.messages || [], data.message || []),
      }));
    } catch (failure) {
      setDetail((current) => ({
        ...current,
        messages: (current?.messages || []).filter(
          (message) => message.clientMessageId !== clientMessageId,
        ),
      }));
      setReply((current) => current || content);
      setError(failure?.message || "Reply could not be sent");
    } finally {
      setPendingCount((count) => Math.max(0, count - 1));
    }
  };

  const ticket = detail?.ticket;
  return (
    <section className="agent-support">
      <header className="agent-support__header">
        <div>
          <span>TravelsTREM support</span>
          <h1>{mode === "create" ? formUi.title || "Create support request" : "Help & Support"}</h1>
          <p>
            {mode === "create"
              ? formUi.subtitle
              : "Get help with your agency workspace, products, enquiries, or account."}
          </p>
        </div>
        {mode === "list" ? (
          <Button
            text={listUi.newRequestLabel || "Create request"}
            onClick={() => setMode("create")}
          />
        ) : (
          <Button
            text="Back to requests"
            variant="secondary"
            iconLeft="arrowLeft"
            onClick={() => {
              setMode("list");
              setDetail(null);
            }}
          />
        )}
      </header>

      {error ? <p className="agent-support__error">{error}</p> : null}

      {mode === "create" ? (
        <form className="agent-support__form" onSubmit={createTicket}>
          <SingleSelect
            label={formUi.categoryLabel || "Category"}
            placeholder={formUi.categoryPlaceholder}
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions}
            required
          />
          <InputField
            label={formUi.subjectLabel || "Subject"}
            placeholder={formUi.subjectPlaceholder}
            value={subject}
            onChange={setSubject}
            maxLength={180}
            required
          />
          <TextArea
            label={formUi.descriptionLabel || "What happened?"}
            placeholder={formUi.descriptionPlaceholder}
            value={description}
            onChange={setDescription}
            maxLength={5000}
            rows={6}
            required
          />
          <Button
            type="submit"
            text={busy ? formUi.submittingLabel : formUi.submitLabel}
            disabled={!categoryId || !subject.trim() || !description.trim() || busy}
          />
        </form>
      ) : null}

      {mode === "list" ? (
        <div className="agent-support__requests">
          <div className="agent-support__filter">
            <SingleSelect
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "", label: listUi.allLabel || "All" },
                ...statuses.map((item) => ({ value: item.id, label: item.label })),
              ]}
            />
          </div>
          {!busy && !tickets.length ? (
            <EmptyState
              icon="support"
              title="No support requests"
              description="Create a request whenever you need help from TravelsTREM."
              action={<Button text="Create request" onClick={() => setMode("create")} />}
            />
          ) : null}
          <div className="agent-support__list">
            {tickets.map((item) => (
              <button type="button" key={idOf(item)} onClick={() => openTicket(idOf(item))}>
                <span>
                  <small>{item.reference}</small>
                  <strong>{item.subject}</strong>
                  <em>{dateTime(item.lastActivityAt)}</em>
                </span>
                <StatusBadge value={item.status} size="sm" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {mode === "detail" && ticket ? (
        <article className="agent-support__detail">
          <header>
            <div>
              <small>{ticket.reference}</small>
              <h2>{ticket.subject}</h2>
              <p>{detail.category?.label}</p>
            </div>
            <StatusBadge value={ticket.status} />
          </header>
          <SupportConversation
            className="agent-support__conversation"
            title="Conversation with TravelsTREM"
            messages={detail.messages || []}
            ownSenderType="customer"
            hasMore={Boolean(detail.messagePagination?.hasMore)}
            loadingOlder={loadingOlder}
            onLoadOlder={() =>
              openTicket(idOf(ticket), {
                before: detail.messagePagination?.nextBefore,
                prepend: true,
              })
            }
            live={isConnected}
            composer={
              <SupportComposer
                className="agent-support__reply"
                value={reply}
                onChange={setReply}
                onSubmit={sendReply}
                pendingCount={pendingCount}
                disabled={!detail.canReply}
                label="Reply"
                placeholder="Add more information or reply to support"
                closedMessage="This request is closed."
              />
            }
          />
        </article>
      ) : null}
    </section>
  );
}
