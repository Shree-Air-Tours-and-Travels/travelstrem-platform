import React from "react";
import "./MessageBubble.styles.scss";

export default function MessageBubble({
  content,
  senderName = "",
  senderType = "customer",
  messageType = "text",
  timestamp,
  isOwn = false,
  metadata = {},
  className = "",
}) {
  const time = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  const isSystem = messageType === "system" || senderType === "system";
  const isQuoteUpdate = messageType === "quote_update";

  if (isSystem) {
    return (
      <div className={`message-bubble message-bubble--system ${className}`}>
        <div className="message-bubble__system-content">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="message-bubble__system-icon">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7 4v3M7 9.5v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>{content}</span>
        </div>
        {time && <span className="message-bubble__time">{time}</span>}
      </div>
    );
  }

  if (isQuoteUpdate) {
    return (
      <div className={`message-bubble message-bubble--quote ${className}`}>
        <div className="message-bubble__quote-header">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="message-bubble__quote-icon">
            <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="message-bubble__quote-label">Quote Updated</span>
        </div>
        <div className="message-bubble__quote-amount">
          {metadata.finalAmount ? `₹${metadata.finalAmount.toLocaleString()}` : ""}
        </div>
        <p className="message-bubble__text">{content}</p>
        {time && <span className="message-bubble__time">{time}</span>}
      </div>
    );
  }

  return (
    <div className={`message-bubble ${isOwn ? "message-bubble--own" : "message-bubble--other"} ${className}`}>
      {!isOwn && senderName && (
        <span className="message-bubble__sender">{senderName}</span>
      )}
      <div className="message-bubble__bubble">
        <p className="message-bubble__text">{content}</p>
      </div>
      {time && <span className="message-bubble__time">{time}</span>}
    </div>
  );
}
