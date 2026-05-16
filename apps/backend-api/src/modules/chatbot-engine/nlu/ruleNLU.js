// chatbot/nlu/ruleNLU.js

export async function parseUserInput(text, context = {}) {
    const msg = text.toLowerCase().trim();

    const entities = {};

    if (context.expectedSlot === "toCity") {
        entities.toCity = { value: msg, confidence: 0.6 };
    }

    if (context.expectedSlot === "fromCity") {
        entities.fromCity = { value: msg, confidence: 0.6 };
    }

    return {
        intent: context.flowIntent || "UNKNOWN",
        entities,
    };
}
