import React, { useCallback, useEffect, useRef, useState } from "react";
import MessageBubble from "@packages/trem-ui/components/MessageBubble/MessageBubble.jsx";
import { useBookingApi } from "../hooks/useBookingApi.js";

export default function MessagePanel({ bookingId, isOwnRole = "customer" }) {
  const { sendMessage, getMessages } = useBookingApi();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef(null);
  const bottomRef = useRef(null);

  const loadMessages = useCallback(async (reset = true) => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const data = await getMessages(bookingId, { limit: 50, skip: reset ? 0 : messages.length });
      const newMessages = data?.messages || [];
      setMessages((prev) => reset ? newMessages.reverse() : [...newMessages.reverse(), ...prev]);
      setHasMore(data?.hasMore || false);
      if (reset) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  }, [bookingId, getMessages]);

  useEffect(() => { loadMessages(true); }, [bookingId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") loadMessages(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const handleSend = async () => {
    if (!input.trim() || !bookingId) return;
    const text = input.trim();
    setInput("");
    try {
      const sent = await sendMessage(bookingId, text);
      setMessages((prev) => [...prev, {
        _id: sent?.id || Date.now().toString(),
        content: text,
        senderType: "customer",
        senderName: "You",
        messageType: "text",
        createdAt: new Date().toISOString(),
      }]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setInput(text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="be-messages">
      <div className="be-messages__header">
        <h4 className="be-messages__title">Messages</h4>
        {messages.length > 0 && <span className="be-messages__count">{messages.length}</span>}
      </div>

      <div className="be-messages__list" ref={listRef}>
        {hasMore && messages.length > 0 && (
          <button type="button" className="be-messages__load-more" onClick={() => loadMessages(false)} disabled={loading}>
            {loading ? "Loading..." : "Load older messages"}
          </button>
        )}

        {messages.length === 0 && !loading && (
          <div className="be-messages__empty">
            <p>No messages yet. Start a conversation with your travel agent.</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg._id || msg.id || msg.createdAt}
            content={msg.content}
            senderName={msg.senderName}
            senderType={msg.senderType}
            messageType={msg.messageType}
            timestamp={msg.createdAt}
            isOwn={msg.senderType === isOwnRole}
            metadata={msg.metadata}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="be-messages__input-area">
        <textarea
          className="be-messages__input"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          type="button"
          className="be-messages__send"
          onClick={handleSend}
          disabled={!input.trim()}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 9l14-7-7 14v-7H2z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}
