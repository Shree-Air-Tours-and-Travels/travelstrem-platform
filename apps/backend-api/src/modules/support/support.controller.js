import {
    SUPPORT_ACTION_TYPE,
    SUPPORT_SENDER_TYPE,
    SUPPORT_TICKET_STATUS_LIST,
} from "@packages/trem-support-contracts";
import mongoose from "mongoose";
import config from "../../config/env.js";
import { sendTransactionalEmail } from "../../services/email.service.js";
import { ApiError } from "../../shared/errors/index.js";
import asyncHandler from "../../shared/middleware/asyncHandler.js";
import { escapeHtml, renderEmailLayout } from "../../templates/base.template.js";
import User from "../auth/models/User.js";
import SupportTicket from "./models/SupportTicket.js";
import SupportTicketMessage from "./models/SupportTicketMessage.js";
import {
    AGENT_SUPPORT_CATEGORIES,
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
const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const validId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));
const isSupportAdmin = (req) =>
    req.user?.role === "admin" && ["standard", "master"].includes(req.user?.adminLevel);
const requireSupportAdmin = (req) => {
    if (!isSupportAdmin(req))
        throw new ApiError(403, "Support desk access is restricted to admins");
};
const runNotification = (label, task) => {
    Promise.resolve()
        .then(task)
        .catch((error) => console.error(`[Support] ${label} failed:`, error?.message || error));
};
const createSupportMessage = async ({
    ticket,
    sender,
    senderType,
    senderName,
    content,
    clientMessageId,
}) => {
    const payload = {
        ticket,
        sender,
        senderType,
        senderName,
        content,
        ...(clientMessageId ? { clientMessageId } : {}),
    };
    try {
        return { message: await SupportTicketMessage.create(payload), created: true };
    } catch (error) {
        if (error?.code !== 11000 || !clientMessageId) throw error;
        const message = await SupportTicketMessage.findOne({ ticket, sender, clientMessageId });
        if (!message) throw error;
        return { message, created: false };
    }
};

const getMessagePage = async ({ ticketId, before, requestedLimit }) => {
    const limit = Math.min(100, Math.max(20, Number(requestedLimit) || 50));
    const query = { ticket: ticketId };
    if (before) {
        if (!validId(before)) throw new ApiError(400, "Invalid conversation cursor");
        const cursor = await SupportTicketMessage.findOne({ _id: before, ticket: ticketId })
            .select("createdAt")
            .lean();
        if (!cursor) throw new ApiError(400, "Conversation cursor not found");
        query.$or = [
            { createdAt: { $lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, _id: { $lt: cursor._id } },
        ];
    }
    const rows = await SupportTicketMessage.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1)
        .lean();
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    rows.reverse();
    return {
        messages: rows,
        messagePagination: {
            pageSize: limit,
            hasMore,
            nextBefore: hasMore && rows.length ? String(rows[0]._id) : null,
        },
    };
};

const notifySupportInbox = async ({ req, ticket, content, activity }) => {
    if (!config.SUPPORT_EMAIL) {
        console.warn("[Support] email notification skipped: SUPPORT_EMAIL is not configured");
        return;
    }
    const requesterName = clean(req.user?.name, 100) || "Requester";
    const requesterEmail = clean(req.user?.email, 254);
    const category = categoryById(ticket.categoryId)?.label || ticket.categoryId;
    const subject = `${activity}: ${ticket.reference} - ${ticket.subject}`;
    const details = `<table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="padding:7px 0;font-weight:700">Reference</td><td>${escapeHtml(ticket.reference)}</td></tr><tr><td style="padding:7px 0;font-weight:700">Requester</td><td>${escapeHtml(requesterName)}</td></tr><tr><td style="padding:7px 0;font-weight:700">Email</td><td>${escapeHtml(requesterEmail || "Not available")}</td></tr><tr><td style="padding:7px 0;font-weight:700">Category</td><td>${escapeHtml(category)}</td></tr></table><div style="margin-top:20px;padding:16px;border-radius:10px;background:#f4f6fa;white-space:pre-wrap">${escapeHtml(content)}</div>`;
    try {
        const result = await sendTransactionalEmail({
            to: config.SUPPORT_EMAIL,
            replyTo: requesterEmail || undefined,
            subject,
            text: `${activity}\n\nReference: ${ticket.reference}\nRequester: ${requesterName}\nEmail: ${requesterEmail || "Not available"}\nCategory: ${category}\nSubject: ${ticket.subject}\n\n${content}`,
            html: renderEmailLayout({
                companyName: config.COMPANY_NAME,
                preheader: subject,
                title: activity,
                intro: ticket.subject,
                content: details,
                footerText: `Support request ${ticket.reference}`,
            }),
        });
        if (!result.success)
            console.error(
                "[Support] email notification failed:",
                result.message,
                result.code || "",
            );
    } catch (error) {
        console.error("[Support] email notification failed:", error?.message || error);
    }
};

const notifyRequester = async ({ ticket, content, responderName }) => {
    const requester = await User.findById(ticket.user).select("name email").lean();
    if (!requester?.email) return;
    const subject = `TravelsTREM support replied: ${ticket.reference}`;
    const result = await sendTransactionalEmail({
        to: requester.email,
        replyTo: config.SUPPORT_EMAIL || undefined,
        subject,
        text: `Hi ${requester.name || "there"},\n\n${responderName} replied to support request ${ticket.reference}:\n\n${content}\n\nSign in to view and continue the conversation.`,
        html: renderEmailLayout({
            companyName: config.COMPANY_NAME,
            preheader: subject,
            title: "Your support request has a new reply",
            intro: `Hi ${requester.name || "there"}, ${responderName} replied to ${ticket.reference}.`,
            content: `<div style="padding:16px;border-radius:10px;background:#f4f6fa;white-space:pre-wrap">${escapeHtml(content)}</div>`,
            footerText: `Support request ${ticket.reference}`,
        }),
    });
    if (!result.success)
        console.error("[Support] requester email failed:", result.message, result.code || "");
};

export const getHome = asyncHandler(async (_req, res) => {
    return ok(res, {
        ui: SUPPORT_UI,
        categories: SUPPORT_CATEGORIES,
        contactOptions: PLATFORM_CONTACT_OPTIONS.filter(
            (option) => option.action?.type === SUPPORT_ACTION_TYPE.CONTACT,
        ),
        capabilities: { realtimeChat: true, attachments: false, ticketReplies: true },
    });
});

export const searchSupport = asyncHandler(async (req, res) => {
    const query = clean(req.query.q, 100).toLocaleLowerCase();
    if (query.length < 2) return ok(res, { results: [], minimumQueryLength: 2 });
    const records = [
        ...SUPPORT_CATEGORIES.map((item) => ({
            id: item.id,
            type: "CATEGORY",
            title: item.label,
            description: item.description,
            action: {
                type: SUPPORT_ACTION_TYPE.NAVIGATE,
                target: `/help/new-request?category=${encodeURIComponent(item.id)}`,
            },
        })),
        ...PLATFORM_CONTACT_OPTIONS.filter(
            (item) => item.action?.type === SUPPORT_ACTION_TYPE.CONTACT,
        ).map((item) => ({
            ...item,
            title: item.label,
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

export const getCategories = asyncHandler(async (req, res) =>
    ok(res, {
        categories: req.user?.role === "agent" ? AGENT_SUPPORT_CATEGORIES : SUPPORT_CATEGORIES,
        ui: SUPPORT_UI.requestForm,
    }),
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
        ui: SUPPORT_UI.requestList,
    });
});

export const getTicket = asyncHandler(async (req, res) => {
    if (!validId(req.params.ticketId)) throw new ApiError(404, "Support request not found");
    const ticket = await SupportTicket.findOne({ _id: req.params.ticketId, user: userId(req) });
    if (!ticket) throw new ApiError(404, "Support request not found");
    const messagePage = await getMessagePage({
        ticketId: ticket._id,
        before: req.query.before,
        requestedLimit: req.query.limit,
    });
    if (ticket.unreadByCustomer)
        await SupportTicket.updateOne({ _id: ticket._id }, { unreadByCustomer: false });
    const category = categoryById(ticket.categoryId);
    return ok(res, {
        ticket,
        status: { id: ticket.status, label: ticket.status.replaceAll("_", " ") },
        category: category ? { id: category.id, label: category.label } : null,
        ...messagePage,
        canReply: !["RESOLVED", "CLOSED"].includes(ticket.status),
        ui: SUPPORT_UI.ticketDetail,
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
        requesterType: req.user?.role === "agent" ? "agent" : "customer",
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
    runNotification("new request email", () =>
        notifySupportInbox({
            req,
            ticket,
            content: description,
            activity: "New support request",
        }),
    );
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
    const clientMessageId = clean(req.body.clientMessageId, 100);
    const { message, created } = await createSupportMessage({
        ticket: ticket._id,
        sender: userId(req),
        senderType: SUPPORT_SENDER_TYPE.CUSTOMER,
        senderName: clean(req.user?.name, 100),
        content,
        clientMessageId,
    });
    if (created) {
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
            publishToAdmins(
                REALTIME_EVENTS.ADMIN_SUPPORT_REQUEST_CREATED,
                supportTicketDto(ticket),
            );
        } catch (error) {
            console.error("[Support] realtime publish failed:", error?.message);
        }
    }
    return ok(res.status(201), { message, ticket }, "Reply sent");
});

export const listSupportDeskTickets = asyncHandler(async (req, res) => {
    requireSupportAdmin(req);
    const query = {};
    if (req.query.status) {
        if (!SUPPORT_TICKET_STATUS_LIST.includes(req.query.status))
            throw new ApiError(400, "Invalid support ticket status");
        query.status = req.query.status;
    }
    if (req.query.requesterType === "agent") query.requesterType = "agent";
    if (req.query.requesterType === "customer") query.requesterType = { $in: ["customer", null] };
    const search = clean(req.query.search, 120);
    if (search) {
        const pattern = new RegExp(escapeRegExp(search), "i");
        query.$or = [{ reference: pattern }, { subject: pattern }];
    }
    const tickets = await SupportTicket.find(query)
        .populate("user", "name email role agencyRole agencyId")
        .populate("assignedAdmin", "name email adminLevel")
        .sort({ lastActivityAt: -1 })
        .limit(200)
        .lean();
    return ok(res, {
        tickets,
        statuses: SUPPORT_TICKET_STATUS_LIST.map((id) => ({
            id,
            label: id.replaceAll("_", " "),
        })),
        ui: SUPPORT_UI.supportDesk,
    });
});

export const getSupportDeskTicket = asyncHandler(async (req, res) => {
    requireSupportAdmin(req);
    if (!validId(req.params.ticketId)) throw new ApiError(404, "Support request not found");
    const ticket = await SupportTicket.findById(req.params.ticketId)
        .populate("user", "name email role agencyRole agencyId")
        .populate("assignedAdmin", "name email adminLevel");
    if (!ticket) throw new ApiError(404, "Support request not found");
    const messagePage = await getMessagePage({
        ticketId: ticket._id,
        before: req.query.before,
        requestedLimit: req.query.limit,
    });
    return ok(res, {
        ticket,
        ...messagePage,
        category: categoryById(ticket.categoryId),
        statuses: SUPPORT_TICKET_STATUS_LIST.map((id) => ({
            id,
            label: id.replaceAll("_", " "),
        })),
        canReply: !["RESOLVED", "CLOSED"].includes(ticket.status),
        ui: SUPPORT_UI.supportDesk,
    });
});

export const replyFromSupportDesk = asyncHandler(async (req, res) => {
    requireSupportAdmin(req);
    if (!validId(req.params.ticketId)) throw new ApiError(404, "Support request not found");
    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) throw new ApiError(404, "Support request not found");
    if (["RESOLVED", "CLOSED"].includes(ticket.status))
        throw new ApiError(409, "Reopen this request before replying");
    const content = clean(req.body.content, 5000);
    if (!content) throw new ApiError(400, "A message is required");
    const clientMessageId = clean(req.body.clientMessageId, 100);
    const sendEmail = req.body.sendEmail === true;
    const responderName = clean(req.user?.name, 100) || "TravelsTREM Support";
    const { message, created } = await createSupportMessage({
        ticket: ticket._id,
        sender: userId(req),
        senderType: SUPPORT_SENDER_TYPE.SUPPORT,
        senderName: responderName,
        content,
        clientMessageId,
    });
    if (created) {
        ticket.assignedAdmin ||= userId(req);
        ticket.status = "AWAITING_CUSTOMER";
        ticket.unreadByCustomer = true;
        ticket.lastActivityAt = new Date();
        await ticket.save();
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
        if (sendEmail)
            runNotification("requester email", () =>
                notifyRequester({ ticket, content, responderName }),
            );
    }
    return ok(
        res.status(201),
        { message, ticket, emailQueued: created && sendEmail },
        "Support response sent",
    );
});

export const updateSupportDeskTicket = asyncHandler(async (req, res) => {
    requireSupportAdmin(req);
    if (!validId(req.params.ticketId)) throw new ApiError(404, "Support request not found");
    const status = clean(req.body.status, 40).toUpperCase();
    if (!SUPPORT_TICKET_STATUS_LIST.includes(status))
        throw new ApiError(400, "Choose a valid support ticket status");
    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) throw new ApiError(404, "Support request not found");
    ticket.status = status;
    ticket.assignedAdmin ||= userId(req);
    ticket.resolvedAt = status === "RESOLVED" ? new Date() : null;
    ticket.closedAt = status === "CLOSED" ? new Date() : null;
    ticket.lastActivityAt = new Date();
    await ticket.save();
    publishToUser(
        String(ticket.user),
        REALTIME_EVENTS.SUPPORT_CONVERSATION_UPDATED,
        supportTicketDto(ticket),
    );
    publishToAdmins(REALTIME_EVENTS.ADMIN_SUPPORT_REQUEST_CREATED, supportTicketDto(ticket));
    return ok(res, { ticket }, "Support request updated");
});
