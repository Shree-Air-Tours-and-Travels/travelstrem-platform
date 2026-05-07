// chatbot/aiRouter.js

import { handleDialogue } from "./dialogueManager.js";
import { getSession } from "./state/sessionManager.js";

export async function processMessage({ text, sessionId }) {
    const session = getSession(sessionId); 
    return handleDialogue({ text, session });
}
