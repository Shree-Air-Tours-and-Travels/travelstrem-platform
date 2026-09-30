// chatbot/state/sessionManager.js

const sessionStore = new Map();

export function getSession(sessionId) {
    if (!sessionStore.has(sessionId)) {
        sessionStore.set(sessionId, {
            id: sessionId,
            flow: null, // ENTRY | TOURS | RESERVATIONS | etc.
            slots: {}, // tour slots
            expectedSlot: null, // for slot filling
        });
    }

    return sessionStore.get(sessionId);
}

export function resetSession(sessionId) {
    sessionStore.delete(sessionId);
}
