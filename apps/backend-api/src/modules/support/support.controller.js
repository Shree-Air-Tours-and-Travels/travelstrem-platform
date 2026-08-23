import { SUPPORT_SENDER_TYPE, SUPPORT_TICKET_STATUS_LIST } from "@packages/trem-support-contracts";
import mongoose from "mongoose";
import { ApiError } from "../../shared/errors/index.js";
import asyncHandler from "../../shared/middleware/asyncHandler.js";
import SupportTicket from "./models/SupportTicket.js";
import SupportTicketMessage from "./models/SupportTicketMessage.js";
import {
    PLATFORM_CONTACT_OPTIONS,
    categoryById,
    serviceById,
    SUPPORT_ARTICLES,
    SUPPORT_CATEGORIES,
    SUPPORT_SERVICES,
    SUPPORT_TOPICS,
    SUPPORT_UI,
    topicById,
} from "./support.config.js";
import { createReference, defaultTicketPriority, validCategory } from "./support.service.js";
import {
    REALTIME_EVENTS,
    publishToAdmins,
    publishToSupportTicket,
    publishToUser,
    supportMessageDto,
    supportTicketDto,
} from "../../realtime/index.js";

const userId = (req) => req.user?.sub || req.user?.id;
const ok = (res, data, message = "OK") =>
    res.json({ status: "success", message, componentData: { data } });
const clean = (value, max = 5000) =>
    String(value || "")
        .trim()
        .slice(0, max);
const validId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

export const getHome = asyncHandler(async (_req, res) => {
    return ok(res, {
        ui: SUPPORT_UI,
        services: Object.values(SUPPORT_SERVICES).map(({ categoryIds, ...service }) => service),
        topics: SUPPORT_TOPICS,
        contactOptions: PLATFORM_CONTACT_OPTIONS,
        capabilities: { realtimeChat: false, attachments: false, ticketReplies: true },
    });
});

export const searchSupport = asyncHandler(async (req, res) => {
    const query = clean(req.query.q, 100).toLocaleLowerCase();
    if (query.length < 2) return ok(res, { results: [], minimumQueryLength: 2 });
    const records = [
        ...Object.values(SUPPORT_SERVICES).map((item) => ({
            id: item.id,
            type: "SERVICE",
            title: item.name,
            description: item.description,
            action: { type: "NAVIGATE", target: `/help/service/${item.id}` },
        })),
        ...SUPPORT_TOPICS.map((item) => ({ ...item, title: item.title })),
        ...SUPPORT_ARTICLES.map((item) => ({
            ...item,
            type: "ARTICLE",
            action: { type: "NAVIGATE", target: `/help/articles/${item.id}` },
        })),
    ];
    const results = records
        .filter((item) =>
            `${item.title} ${item.description || ""}`.toLocaleLowerCase().includes(query),
        )
        .slice(0, 20);
    return ok(res, { results, query });
});

export const getServices = asyncHandler(async (_req, res) =>
    ok(res, {
        services: Object.values(SUPPORT_SERVICES).map(({ categoryIds, ...service }) => service),
    }),
);

export const getService = asyncHandler(async (req, res) => {
    const service = serviceById(req.params.serviceId);
    if (!service) throw new ApiError(404, "Support service not found");
    return ok(res, {
        service: {
            ...service,
            categories: service.categoryIds
                .map((id) => SUPPORT_CATEGORIES.find((item) => item.id === id))
                .filter(Boolean),
        },
        topics: SUPPORT_TOPICS.filter((topic) =>
            topic.categoryIds.some((id) => service.categoryIds.includes(id)),
        ),
        articles: SUPPORT_ARTICLES.filter((article) => article.serviceIds?.includes(service.id)),
        contactOptions: PLATFORM_CONTACT_OPTIONS,
        emptyStates: SUPPORT_UI.emptyStates,
    });
});

export const getTopic = asyncHandler(async (req, res) => {
    const topic = topicById(req.params.topicId);
    if (!topic) throw new ApiError(404, "Support topic not found");
    return ok(res, {
        topic,
        categories: topic.categoryIds
            .map((id) => SUPPORT_CATEGORIES.find((item) => item.id === id))
            .filter(Boolean),
        articles: SUPPORT_ARTICLES.filter((article) => article.topicIds?.includes(topic.id)),
        contactOptions: PLATFORM_CONTACT_OPTIONS,
        emptyStates: SUPPORT_UI.emptyStates,
    });
});

export const getArticle = asyncHandler(async (req, res) => {
    const article = SUPPORT_ARTICLES.find((item) => item.id === req.params.articleId);
    if (!article) throw new ApiError(404, "Support article not found");
    return ok(res, { article });
});

export const getCategories = asyncHandler(async (_req, res) =>
    ok(res, { categories: SUPPORT_CATEGORIES }),
);

export const getContacts = asyncHandler(async (_req, res) =>
    ok(res, {
        contactOptions: PLATFORM_CONTACT_OPTIONS,
        emptyState: SUPPORT_UI.emptyStates.contacts,
    }),
);

export const listTickets = asyncHandler(async (req, res) => {
    const query = { user: userId(req) };
    if (req.query.status) {
        if (!SUPPORT_TICKET_STATUS_LIST.includes(req.query.status))
            throw new ApiError(400, "Invalid support ticket status");
        query.status = req.query.status;
    }
    const tickets = await SupportTicket.find(query).sort({ lastActivityAt: -1 }).limit(100);
    return ok(res, {
        tickets,
        statuses: SUPPORT_TICKET_STATUS_LIST.map((id) => ({ id, label: id.replaceAll("_", " ") })),
        emptyState: SUPPORT_UI.emptyStates.tickets,
    });
});

export const getTicket = asyncHandler(async (req, res) => {
    if (!validId(req.params.ticketId)) throw new ApiError(404, "Support request not found");
    const ticket = await SupportTicket.findOne({ _id: req.params.ticketId, user: userId(req) });
    if (!ticket) throw new ApiError(404, "Support request not found");
    const messages = await SupportTicketMessage.find({ ticket: ticket._id }).sort({ createdAt: 1 });
    if (ticket.unreadByCustomer)
        await SupportTicket.updateOne({ _id: ticket._id }, { unreadByCustomer: false });
    const category = categoryById(ticket.categoryId);
    return ok(res, {
        ticket,
        status: { id: ticket.status, label: ticket.status.replaceAll("_", " ") },
        category: category ? { id: category.id, label: category.label } : null,
        messages,
        canReply: !["RESOLVED", "CLOSED"].includes(ticket.status),
    });
});

export const createTicket = asyncHandler(async (req, res) => {
    const categoryId = clean(req.body.categoryId, 80).toLowerCase();
    const subject = clean(req.body.subject, 180);
    const description = clean(req.body.description, 5000);
    if (!validCategory(categoryId)) throw new ApiError(400, "Choose a valid support category");
    if (!subject || !description) throw new ApiError(400, "Subject and description are required");
    const requestedServiceId = clean(req.body.serviceId, 40).toLowerCase();
    if (requestedServiceId && !serviceById(requestedServiceId))
        throw new ApiError(400, "Choose a valid support service");
    const ticket = await SupportTicket.create({
        reference: createReference("TREM-SUP"),
        user: userId(req),
        serviceId: requestedServiceId,
        categoryId,
        subcategoryId: clean(req.body.subcategoryId, 80),
        subject,
        description,
        priority: defaultTicketPriority(categoryId),
        attachments: [],
    });
    await SupportTicketMessage.create({
        ticket: ticket._id,
        sender: userId(req),
        senderType: SUPPORT_SENDER_TYPE.CUSTOMER,
        senderName: clean(req.user?.name, 100),
        content: description,
    });
    // Realtime fan-out: the owner's room, the ticket room, and the admin desk.
    try {
        const ticketDto = supportTicketDto(ticket);
        publishToUser(String(ticket.user), REALTIME_EVENTS.SUPPORT_TICKET_CREATED, ticketDto);
        publishToSupportTicket(
            String(ticket._id),
            REALTIME_EVENTS.SUPPORT_CONVERSATION_UPDATED,
            ticketDto,
        );
        publishToAdmins(REALTIME_EVENTS.ADMIN_SUPPORT_REQUEST_CREATED, ticketDto);
    } catch (error) {
        console.error("[Support] realtime publish failed:", error?.message);
    }
    return ok(res.status(201), { ticket }, "Support request created");
});

export const replyToTicket = asyncHandler(async (req, res) => {
    if (!validId(req.params.ticketId)) throw new ApiError(404, "Support request not found");
    const ticket = await SupportTicket.findOne({ _id: req.params.ticketId, user: userId(req) });
    if (!ticket) throw new ApiError(404, "Support request not found");
    if (["RESOLVED", "CLOSED"].includes(ticket.status))
        throw new ApiError(409, "This support request no longer accepts replies");
    const content = clean(req.body.content, 5000);
    if (!content) throw new ApiError(400, "A message is required");
    const message = await SupportTicketMessage.create({
        ticket: ticket._id,
        sender: userId(req),
        senderType: SUPPORT_SENDER_TYPE.CUSTOMER,
        senderName: clean(req.user?.name, 100),
        content,
    });
    ticket.lastActivityAt = new Date();
    ticket.status = "AWAITING_SUPPORT";
    await ticket.save();
    try {
        publishToSupportTicket(
            String(ticket._id),
            REALTIME_EVENTS.SUPPORT_MESSAGE_CREATED,
            supportMessageDto(message),
        );
        publishToUser(
            String(ticket.user),
            REALTIME_EVENTS.SUPPORT_CONVERSATION_UPDATED,
            supportTicketDto(ticket),
        );
        publishToAdmins(REALTIME_EVENTS.ADMIN_SUPPORT_REQUEST_CREATED, supportTicketDto(ticket));
    } catch (error) {
        console.error("[Support] realtime publish failed:", error?.message);
    }
    return ok(res.status(201), { message, ticket }, "Reply sent");
});
