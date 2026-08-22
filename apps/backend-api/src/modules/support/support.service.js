import { nanoid } from "nanoid";
import { SUPPORT_TICKET_PRIORITY } from "@packages/trem-support-contracts";
import { categoryById } from "./support.config.js";

export const createReference = (prefix) => `${prefix}-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;
export const defaultTicketPriority = (categoryId) => categoryById(categoryId)?.priority || SUPPORT_TICKET_PRIORITY.NORMAL;
export const validCategory = (categoryId) => Boolean(categoryById(categoryId));
