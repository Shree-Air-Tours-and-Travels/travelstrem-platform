// chatbot/state/slotState.js

export function getNextSlotQuestion(session) {
    if (!session.slots.toCity) {
        session.expectedSlot = "toCity";
        return "Which destination would you like to travel to?";
    }

    if (!session.slots.fromCity) {
        session.expectedSlot = "fromCity";
        return "From which city will you start?";
    }

    if (!session.slots.durationDays) {
        session.expectedSlot = "durationDays";
        return "How many days are you planning?";
    }

    session.expectedSlot = null;
    return null;
}
