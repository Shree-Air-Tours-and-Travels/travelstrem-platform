// src/components/Chat/ChatWidget.jsx
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "./chat.style.scss";
import { Button } from "@packages/trem-ui";
import { fetchData } from "@packages/trem-utils";

export default function ChatWidget({ user = null, readonly = false, floating = false }) {
    const [open, setOpen] = useState(!floating);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);

    const [messages, setMessages] = useState([
        {
            role: "assistant",
            type: "text",
            text: "Hi! I am your travel assistent, please tell me your query",
        },
    ]);

    const containerRef = useRef(null);

    /* ------------------------------
       Auto scroll
    ------------------------------ */
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages, open]);

    /* ------------------------------
       Send message (text or option)
    ------------------------------ */
    async function sendMessage(forcedText) {
        const messageText = forcedText ?? text;
        if (!messageText.trim() || readonly) return;

        const userMsg = {
            role: "user",
            type: "text",
            text: messageText.trim(),
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setText("");
        setLoading(true);

        try {
            const result = await fetchData("/chat", {
                method: "POST",
                body: { messages: newMessages },
            });

            if (result.status === "success") {
                const reply = result.componentData?.reply;

                if (reply) {
                    setMessages((prev) => [...prev, { role: "assistant", ...reply }]);
                }
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        type: "text",
                        text: result.message || "Something went wrong.",
                    },
                ]);
            }
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    type: "text",
                    text: `Network error: ${err.message || "Unknown"}`,
                },
            ]);
        } finally {
            setLoading(false);
        }
    }

    function handleKey(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    function handleOptionClick(value) {
        sendMessage(value);
    }

    /* ------------------------------
       Render message
    ------------------------------ */
    function renderMessage(m, index) {
        return (
            <div key={index} className={`chat-msg chat-msg--${m.role}`}>
                <div className="chat-msg__content">
                    {/* TEXT MESSAGE */}
                    {m.type === "text" && m.text}

                    {/* CHOICE MESSAGE */}
                    {m.type === "choice" && (
                        <>
                            <div className="chat-msg__text">{m.text}</div>
                            <div className="chat-options">
                                {m.options.map((opt) => (
                                    <button
                                        key={opt.value}
                                        className="chat-option-btn"
                                        onClick={() => handleOptionClick(opt.value)}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            {floating && (
                <Button
                    text={open ? "✕" : "Help"}
                    variant="solid-outline"
                    color="primary"
                    onClick={() => setOpen((prev) => !prev)}
                    secondaryColor="white"
                    primaryClassName={`chat-floating-toggle ${open ? "open" : ""}`}
                />
            )}

            <div
                className={`chat-backdrop ${open ? "visible" : ""}`}
                onClick={() => setOpen(false)}
                role="button"
                aria-hidden={!open}
            />

            <div
                className={`chat-widget ${floating ? "chat-widget--floating" : "chat-widget--inline"} ${open ? "open" : "closed"
                    }`}
                role="region"
                aria-label="Chat widget"
            >
                <div className="chat-widget__header">
                    <div className="chat-widget__title">TravelsTREM — Virtual Assistant</div>
                    <div className="chat-widget__actions">
                        <button
                            className="chat-close-btn"
                            onClick={() => setOpen(false)}
                            aria-label="Close chat"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="chat-widget__messages" ref={containerRef}>
                    {messages.map(renderMessage)}
                    {loading && (
                        <div className="chat-msg chat-msg--assistant">
                            <div className="chat-msg__content">Typing…</div>
                        </div>
                    )}
                </div>

                <div className="chat-widget__input">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Type here…"
                        disabled={readonly || loading}
                        rows={1}
                        aria-label="Type your message"
                    />
                    <Button
                        text={loading ? "Sending…" : "Send"}
                        size="medium"
                        variant="solid"
                        color="primary"
                        onClick={() => sendMessage()}
                    />
                </div>
            </div>
        </>
    );
}

ChatWidget.propTypes = {
    user: PropTypes.object,
    readonly: PropTypes.bool,
    floating: PropTypes.bool,
};
