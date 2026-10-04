import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "../Button/Button.jsx";
import MessageBubble from "../MessageBubble/MessageBubble.jsx";
import TextArea from "../TextArea/TextArea.jsx";
import "./SupportConversation.styles.scss";

const idOf = (value) => String(value?.id || value?._id || value?.messageId || "");
const dayKey = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toDateString();
};
const dayLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

export function SupportConversation({
  messages = [],
  ownSenderType = "customer",
  hasMore = false,
  loadingOlder = false,
  onLoadOlder,
  live = true,
  title = "Support conversation",
  emptyMessage = "No messages yet.",
  composer = null,
  className = "",
}) {
  const viewportRef = useRef(null);
  const lastMessageIdRef = useRef("");
  const [nearBottom, setNearBottom] = useState(true);
  const rows = useMemo(() => {
    let previousDay = "";
    return messages.flatMap((message) => {
      const currentDay = dayKey(message.createdAt);
      const output = [];
      if (currentDay && currentDay !== previousDay) {
        output.push({ type: "day", id: `day-${currentDay}`, label: dayLabel(message.createdAt) });
        previousDay = currentDay;
      }
      output.push({ type: "message", id: idOf(message), message });
      return output;
    });
  }, [messages]);

  const scrollToLatest = useCallback((behavior = "smooth") => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    setNearBottom(true);
  }, []);

  useEffect(() => {
    const lastMessageId = idOf(messages[messages.length - 1]);
    if (!lastMessageId) return;
    const isInitial = !lastMessageIdRef.current;
    const receivedNewMessage = lastMessageIdRef.current !== lastMessageId;
    if (isInitial || (receivedNewMessage && nearBottom))
      requestAnimationFrame(() => scrollToLatest(isInitial ? "auto" : "smooth"));
    lastMessageIdRef.current = lastMessageId;
  }, [messages, nearBottom, scrollToLatest]);

  const handleScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setNearBottom(viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 96);
  };

  const loadOlder = async () => {
    const viewport = viewportRef.current;
    const previousHeight = viewport?.scrollHeight || 0;
    const previousTop = viewport?.scrollTop || 0;
    await onLoadOlder?.();
    requestAnimationFrame(() => {
      if (!viewport) return;
      viewport.scrollTop = previousTop + viewport.scrollHeight - previousHeight;
    });
  };

  return (
    <section className={`trem-support-conversation ${className}`} aria-label={title}>
      <header className="trem-support-conversation__header">
        <div>
          <span className={`trem-support-conversation__presence${live ? " is-live" : ""}`} />
          <strong>{title}</strong>
        </div>
        <small>{live ? "Live updates" : "Conversation history"}</small>
      </header>
      <div
        ref={viewportRef}
        className="trem-support-conversation__viewport"
        onScroll={handleScroll}
        aria-live="polite"
        aria-relevant="additions text"
      >
        {hasMore ? (
          <div className="trem-support-conversation__history-action">
            <Button
              type="button"
              variant="text"
              text={loadingOlder ? "Loading earlier messages…" : "Load earlier messages"}
              disabled={loadingOlder}
              onClick={loadOlder}
            />
          </div>
        ) : null}
        {!rows.length ? <p className="trem-support-conversation__empty">{emptyMessage}</p> : null}
        {rows.map((row) =>
          row.type === "day" ? (
            <div className="trem-support-conversation__day" key={row.id}>
              <span>{row.label}</span>
            </div>
          ) : (
            <MessageBubble
              key={row.id}
              content={row.message.content}
              senderName={row.message.senderName}
              senderType={row.message.senderType}
              timestamp={row.message.createdAt}
              isOwn={row.message.senderType === ownSenderType}
              className="trem-support-conversation__message"
            />
          ),
        )}
      </div>
      {!nearBottom ? (
        <Button
          type="button"
          className="trem-support-conversation__latest"
          variant="secondary"
          iconLeft="chevronDown"
          text="Latest"
          onClick={() => scrollToLatest()}
        />
      ) : null}
      {composer ? <div className="trem-support-conversation__composer">{composer}</div> : null}
    </section>
  );
}

export function SupportComposer({
  value,
  onChange,
  onSubmit,
  sending = false,
  disabled = false,
  label = "Reply",
  placeholder = "Write a reply",
  sendLabel = "Send reply",
  sendingLabel = "Sending…",
  pendingCount = 0,
  emailOptionLabel = "",
  sendEmail = false,
  onSendEmailChange,
  closedMessage = "This conversation is closed.",
  maxLength = 5000,
  className = "",
}) {
  if (disabled)
    return <p className={`trem-support-composer__closed ${className}`}>{closedMessage}</p>;
  return (
    <form className={`trem-support-composer ${className}`} onSubmit={onSubmit}>
      <TextArea
        label={label}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        rows={3}
        placeholder={placeholder}
      />
      {emailOptionLabel ? (
        <label className="trem-support-composer__email-option">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(event) => onSendEmailChange?.(event.target.checked)}
          />
          <span>{emailOptionLabel}</span>
        </label>
      ) : null}
      <div className="trem-support-composer__footer">
        <span>
          {pendingCount > 0
            ? `${pendingCount} ${pendingCount === 1 ? "message" : "messages"} sending…`
            : "Replies update this conversation in real time."}
        </span>
        <Button
          type="submit"
          text={sending ? sendingLabel : sendLabel}
          iconLeft="navigation"
          disabled={!String(value || "").trim() || sending}
        />
      </div>
    </form>
  );
}

export default SupportConversation;
