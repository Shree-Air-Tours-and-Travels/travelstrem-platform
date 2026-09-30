import { SUPPORT_TICKET_PRIORITY } from "@packages/trem-support-contracts";
import { categoryById } from "./support.config.js";
import { createReadableReference } from "../../utils/readableReference.js";

export const createReference = (prefix) =>
    createReadableReference(prefix === "TREM-SUP" ? "TREM" : prefix);
export const defaultTicketPriority = (categoryId) =>
    categoryById(categoryId)?.priority || SUPPORT_TICKET_PRIORITY.NORMAL;
export const validCategory = (categoryId) => Boolean(categoryById(categoryId));
