// chatbot/flows/tourFlow.js

import { parseUserInput } from "../nlu/ruleNLU.js";
import { getNextSlotQuestion } from "../state/slotState.js";

export async function handleTourFlow(text, session) {
    const nlu = await parseUserInput(text, {
        expectedSlot: session.expectedSlot,
        flowIntent: "TOURS",
    });

    Object.entries(nlu.entities).forEach(([key, entity]) => {
        session.slots[key] = entity.value;
    });

    const nextQuestion = getNextSlotQuestion(session);

    if (nextQuestion) return nextQuestion;

    return "Here are the best tours for you…";
}
