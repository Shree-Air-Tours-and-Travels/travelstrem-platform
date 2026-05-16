// chatbot/flows/entryFlow.js

export function handleEntryFlow(session) {
    session.flow = "ENTRY";

    return {
        type: "choice",
        text: "Hi! How can I help you today?",
        options: [
            { label: "Tours", value: "TOURS" },
            { label: "Reservations", value: "RESERVATIONS" },
            { label: "Experience", value: "EXPERIENCE" },
            { label: "Management", value: "MANAGEMENT" },
        ],
    };
}
