// chatbot/nlu/nluInterface.js

/**
 * NLU Result Contract
 * -------------------
 * intent: string
 * entities: {
 *   [key]: { value, confidence }
 * }
 */

export async function parseUserInput(text, context = {}) {
    throw new Error("NLU engine not implemented");
}
