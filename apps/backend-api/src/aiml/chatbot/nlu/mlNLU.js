// chatbot/nlu/mlNLU.js

export async function parseUserInput(text, context = {}) {
    // Call OpenAI / spaCy / custom model
    return {
        intent: "TOUR_RECOMMENDATION",
        entities: {
            toCity: { value: "jaipur", confidence: 0.91 },
            durationDays: { value: 5, confidence: 0.78 },
        },
    };
}
