import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  EmptyState,
  InputField,
  SingleSelect,
  Spinner,
  StatusBadge,
  SupportComposer,
  SupportConversation,
} from "@packages/trem-ui";
import { fetchData } from "@packages/trem-utils";
import {
  REALTIME_EVENTS,
  useRealtimeEvent,
  useRealtimeStatus,
  useSupportRealtime,
} from "@packages/trem-events";
import "./SupportDeskPage.scss";

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

export default function SupportDeskPage() {
  const [tickets, setTickets] = useState([]);
  const [detail, setDetail] = useState(null);
  const [ui, setUi] = useState({});
  const [statuses, setStatuses] = useState([]);
  const [status, setStatus] = useState("");
  const [requesterType, setRequesterType] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [sendEmail, setSendEmail] = useState(false);
  const [error, setError] = useState("");
  const { isConnected } = useRealtimeStatus();

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await supportRequest("/desk/tickets", {
        params: {
          status: status || undefined,
          requesterType: requesterType || undefined,
          search: appliedSearch || undefined,
        },
      });
      setTickets(data.tickets || []);
      setStatuses(data.statuses || []);
      setUi(data.ui || {});
    } catch (failure) {
      setError(failure?.message || "Support requests could not be loaded");
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, requesterType, status]);

  const loadDetail = useCallback(async (ticketId, { before = "", prepend = false } = {}) => {
    if (!ticketId) return setDetail(null);
    if (prepend) setLoadingOlder(true);
    setError("");
    try {
      const data = await supportRequest(`/desk/tickets/${ticketId}`, {
        params: before ? { before } : undefined,
      });
      setDetail((current) =>
        prepend && idOf(current?.ticket) === ticketId
          ? { ...data, messages: mergeMessages(data.messages || [], current.messages || []) }
          : data || null,
      );
    } catch (failure) {
      setError(failure?.message || "Support request could not be loaded");
    } finally {
      if (prepend) setLoadingOlder(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

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
  useRealtimeEvent(REALTIME_EVENTS.ADMIN_SUPPORT_REQUEST_CREATED, (envelope) => {
    const ticketUpdate = envelope?.data;
    const ticketId = String(ticketUpdate?.ticketId || "");
    if (!ticketId) return;
    setTickets((current) => {
      const found = current.some((ticket) => idOf(ticket) === ticketId);
      const next = found
        ? current.map((ticket) =>
            idOf(ticket) === ticketId ? { ...ticket, ...ticketUpdate, id: ticketId } : ticket,
          )
        : [{ ...ticketUpdate, id: ticketId }, ...current];
      return next.sort(
        (left, right) => new Date(right.lastActivityAt) - new Date(left.lastActivityAt),
      );
    });
    if (activeTicketId === ticketId)
      setDetail((current) => ({
        ...current,
        ticket: { ...current?.ticket, ...ticketUpdate, id: ticketId },
        canReply: !["RESOLVED", "CLOSED"].includes(ticketUpdate.status),
      }));
  });

  const sendReply = async (event) => {
    event.preventDefault();
    const ticketId = idOf(detail?.ticket);
    const content = reply.trim();
    if (!ticketId || !content) return;
    const clientMessageId =
      globalThis.crypto?.randomUUID?.() || `support-${Date.now()}-${Math.random()}`;
    const shouldSendEmail = sendEmail;
    const optimisticMessage = {
      id: clientMessageId,
      clientMessageId,
      senderType: "support",
      senderName: "You",
      content,
      createdAt: new Date().toISOString(),
    };
    setReply("");
    setSendEmail(false);
    setPendingCount((count) => count + 1);
    setDetail((current) => ({
      ...current,
      messages: mergeMessages(current?.messages || [], optimisticMessage),
    }));
    setError("");
    try {
      const data = await supportRequest(`/desk/tickets/${ticketId}/messages`, {
        method: "POST",
        body: { content, clientMessageId, sendEmail: shouldSendEmail },
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
      setSendEmail(shouldSendEmail);
      setError(failure?.message || "Response could not be sent");
    } finally {
      setPendingCount((count) => Math.max(0, count - 1));
    }
  };

  const updateStatus = async (nextStatus) => {
    const ticketId = idOf(detail?.ticket);
    if (!ticketId) return;
    setError("");
    try {
      const data = await supportRequest(`/desk/tickets/${ticketId}`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      setDetail((current) => ({
        ...current,
        ticket: { ...current?.ticket, ...(data.ticket || {}) },
        canReply: !["RESOLVED", "CLOSED"].includes(data.ticket?.status),
      }));
      setTickets((current) =>
        current.map((ticket) =>
          idOf(ticket) === ticketId ? { ...ticket, ...(data.ticket || {}) } : ticket,
        ),
      );
    } catch (failure) {
      setError(failure?.message || "Status could not be updated");
    }
  };

  const selectedTicket = detail?.ticket;
  return (
    <section className="admin-support-desk">
      <header className="admin-support-desk__header">
        <div>
          <span className="admin-support-desk__eyebrow">TravelsTREM operations</span>
          <h1>{ui.title || "Support desk"}</h1>
          <p>{ui.subtitle || "Review and respond to support requests."}</p>
        </div>
        <Button text="Refresh" variant="secondary" iconLeft="refreshCw" onClick={loadTickets} />
      </header>

      <form
        className="admin-support-desk__filters"
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedSearch(search.trim());
        }}
      >
        <InputField
          label="Search"
          value={search}
          onChange={setSearch}
          placeholder={ui.searchPlaceholder}
        />
        <SingleSelect
          label={ui.requesterLabel || "Requester"}
          value={requesterType}
          onChange={setRequesterType}
          options={[
            { value: "", label: ui.allRequestersLabel || "All requesters" },
            { value: "customer", label: ui.customerLabel || "Customers" },
            { value: "agent", label: ui.agentLabel || "Partners and agents" },
          ]}
        />
        <SingleSelect
          label={ui.statusLabel || "Status"}
          value={status}
          onChange={setStatus}
          options={[
            { value: "", label: "All statuses" },
            ...statuses.map((item) => ({ value: item.id, label: item.label })),
          ]}
        />
      </form>

      {error ? <p className="admin-support-desk__error">{error}</p> : null}
      <div className="admin-support-desk__workspace">
        <aside className="admin-support-desk__queue" aria-label="Support request queue">
          {loading ? (
            <div className="admin-support-desk__queue-loading">
              <Spinner label="Loading support requests" />
            </div>
          ) : null}
          {!loading && !tickets.length ? (
            <EmptyState
              icon="support"
              title={ui.emptyTitle || "No support requests"}
              description={ui.emptyDescription}
            />
          ) : null}
          {!loading ? tickets.map((ticket) => {
            const ticketId = idOf(ticket);
            const requester = ticket.user || {};
            return (
              <button
                type="button"
                key={ticketId}
                className={`admin-support-ticket${idOf(selectedTicket) === ticketId ? " is-active" : ""}`}
                onClick={() => loadDetail(ticketId)}
              >
                <span className="admin-support-ticket__topline">
                  <strong>{ticket.reference}</strong>
                  <StatusBadge value={ticket.status} size="sm" />
                </span>
                <span className="admin-support-ticket__subject">{ticket.subject}</span>
                <span className="admin-support-ticket__meta">
                  {requester.name || requester.email || "Customer"} ·{" "}
                  {ticket.requesterType || "customer"}
                </span>
                <small>{dateTime(ticket.lastActivityAt)}</small>
              </button>
            );
          }) : null}
        </aside>

        <article className="admin-support-desk__detail">
          {!selectedTicket ? (
            <EmptyState
              icon="messageCircle"
              title={ui.selectTitle || "Select a support request"}
              description={ui.selectDescription}
            />
          ) : (
            <>
              <header className="admin-support-detail__header">
                <div>
                  <span>{selectedTicket.reference}</span>
                  <h2>{selectedTicket.subject}</h2>
                  <p>
                    {selectedTicket.user?.name || selectedTicket.user?.email} ·{" "}
                    {detail.category?.label}
                  </p>
                </div>
                <SingleSelect
                  label={ui.statusLabel || "Status"}
                  value={selectedTicket.status}
                  onChange={updateStatus}
                  options={(detail.statuses || []).map((item) => ({
                    value: item.id,
                    label: item.label,
                  }))}
                />
              </header>
              <div className="admin-support-detail__meta">
                <span>
                  <small>{ui.requesterLabel || "Requester"}</small>
                  <strong>{selectedTicket.requesterType || "customer"}</strong>
                </span>
                <span>
                  <small>{ui.assignedLabel || "Assigned admin"}</small>
                  <strong>{selectedTicket.assignedAdmin?.name || "Unassigned"}</strong>
                </span>
                <span>
                  <small>Created</small>
                  <strong>{dateTime(selectedTicket.createdAt)}</strong>
                </span>
              </div>
              <SupportConversation
                className="admin-support-detail__conversation"
                title={ui.conversationTitle || "Support conversation"}
                messages={detail.messages || []}
                ownSenderType="support"
                hasMore={Boolean(detail.messagePagination?.hasMore)}
                loadingOlder={loadingOlder}
                onLoadOlder={() =>
                  loadDetail(idOf(selectedTicket), {
                    before: detail.messagePagination?.nextBefore,
                    prepend: true,
                  })
                }
                live={isConnected}
                composer={
                  <SupportComposer
                    className="admin-support-detail__composer"
                    value={reply}
                    onChange={setReply}
                    onSubmit={sendReply}
                    pendingCount={pendingCount}
                    emailOptionLabel={
                      ui.emailOptionLabel || "Also email this reply to the requester"
                    }
                    sendEmail={sendEmail}
                    onSendEmailChange={setSendEmail}
                    disabled={!detail.canReply}
                    label={ui.replyLabel}
                    placeholder={ui.replyPlaceholder}
                    sendLabel={ui.sendLabel}
                    sendingLabel={ui.sendingLabel}
                    closedMessage="Reopen this request to reply."
                  />
                }
              />
            </>
          )}
        </article>
      </div>
    </section>
  );
}
