import crypto from "crypto";
import { processMessage } from "../../aiml/chatbot/aiRouter.js";

export async function handleChat(req, res) {
    const { messages } = req.body;

    let sessionId =
        req.user?.id ||
        req.cookies?.trem_session_id;

    if (!sessionId) {
        sessionId = crypto.randomUUID();
        res.cookie("trem_session_id", sessionId, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 1000 * 60 * 30,
        });
    }

    // --------------------------------------------
    // 🚧 TEMPORARY MODE: TremBot not live yet
    // --------------------------------------------
    // Every user message gets a static response
    // Remove this block once AI is enabled

    const setupMessage =
        "We are currently working on our setup. 🤖✨\nTremBot will be live very soon. Please stay tuned!";

    return res.json({
        status: "success",
        componentData: {
            reply: {
                role: "assistant",
                type: "text",
                text: setupMessage,
            },
        },
    });

    // --------------------------------------------
    // 🤖 ORIGINAL AI LOGIC (COMMENTED)
    // --------------------------------------------

    /*
    const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === "user");

    const reply = await processMessage({
        text: lastUserMessage?.content,
        sessionId,
    });

    // 🔒 Normalize response
    const safeReply =
        typeof reply === "string"
            ? { type: "text", text: reply }
            : reply;

    return res.json({
        status: "success",
        componentData: {
            reply: {
                role: "assistant",
                ...safeReply,
            },
        },
    });
    */
}
