// chatbot/dialogueManager.js

import { handleEntryFlow } from "./flows/entryFlow.js";
import { handleTourFlow } from "./flows/tourFlow.js";

export async function handleDialogue({ text, session }) {
    // First-ever interaction OR reset state
    if (!session.flow) {
        return handleEntryFlow(session);
    }

    // ENTRY flow: user clicked a choice
    if (session.flow === "ENTRY") {
        if (text === "TOURS") {
            session.flow = "TOURS";
            session.slots = {};
            session.expectedSlot = null;

            return {
                type: "text",
                text: "Great! Let’s find a tour for you. Which destination would you like to travel to?",
            };
        }

        // Other flows later
        return {
            type: "text",
            text: "Please choose one of the options above.",
        };
    }

    if (session.flow === "TOURS") {
        return handleTourFlow(text, session);
    }

    // 🔒 SAFE FALLBACK (object, not string)
    return {
        type: "text",
        text: "I’m not sure how to help with that yet.",
    };
}
