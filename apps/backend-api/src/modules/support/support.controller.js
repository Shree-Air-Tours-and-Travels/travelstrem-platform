import { SUPPORT_REQUEST_TYPE, SUPPORT_REQUEST_TYPE_LIST, SUPPORT_SENDER_TYPE, SUPPORT_TICKET_STATUS_LIST } from "@packages/trem-support-contracts";
import mongoose from "mongoose";
import { ApiError } from "../../shared/errors/index.js";
import asyncHandler from "../../shared/middleware/asyncHandler.js";
import SupportBookingRequest from "./models/SupportBookingRequest.js";
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
import {
  buildEligibility,
  categoriesForBooking,
  contactOptionsForBooking,
  createReference,
  defaultTicketPriority,
  findOwnedBooking,
  listSupportBookings,
  serializeSupportBooking,
  validCategory,
} from "./support.service.js";

const userId = (req) => req.user?.sub || req.user?.id;
const ok = (res, data, message = "OK") => res.json({ status: "success", message, componentData: { data } });
const clean = (value, max = 5000) => String(value || "").trim().slice(0, max);
const validId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

export const getHome = asyncHandler(async (req, res) => {
  const bookings = await listSupportBookings(userId(req));
  return ok(res, {
    ui: SUPPORT_UI,
    bookings: bookings.slice(0, 6).map((booking) => serializeSupportBooking(booking)),
    services: Object.values(SUPPORT_SERVICES).map(({ categoryIds, ...service }) => service),
    topics: SUPPORT_TOPICS,
    contactOptions: PLATFORM_CONTACT_OPTIONS,
    capabilities: { realtimeChat: false, attachments: false, ticketReplies: true },
  });
});

export const searchSupport = asyncHandler(async (req, res) => {
  const query = clean(req.query.q, 100).toLocaleLowerCase();
  if (query.length < 2) return ok(res, { results: [], minimumQueryLength: 2 });
  const bookings = await listSupportBookings(userId(req));
  const records = [
    ...Object.values(SUPPORT_SERVICES).map((item) => ({ id: item.id, type: "SERVICE", title: item.name, description: item.description, action: { type: "NAVIGATE", target: `/help/service/${item.id}` } })),
    ...SUPPORT_TOPICS.map((item) => ({ ...item, title: item.title })),
    ...SUPPORT_ARTICLES.map((item) => ({ ...item, type: "ARTICLE", action: { type: "NAVIGATE", target: `/help/articles/${item.id}` } })),
    ...bookings.map((item) => ({ id: String(item.id), type: "BOOKING", title: item.trip?.title || item.tour?.title || item.bookingRef, description: item.bookingRef, action: { type: "NAVIGATE", target: `/help/booking/${item.id}` } })),
  ];
  const results = records.filter((item) => `${item.title} ${item.description || ""}`.toLocaleLowerCase().includes(query)).slice(0, 20);
  return ok(res, { results, query });
});

export const getServices = asyncHandler(async (_req, res) => ok(res, { services: Object.values(SUPPORT_SERVICES).map(({ categoryIds, ...service }) => service) }));

export const getService = asyncHandler(async (req, res) => {
  const service = serviceById(req.params.serviceId);
  if (!service) throw new ApiError(404, "Support service not found");
  return ok(res, {
    service: { ...service, categories: service.categoryIds.map((id) => SUPPORT_CATEGORIES.find((item) => item.id === id)).filter(Boolean) },
    topics: SUPPORT_TOPICS.filter((topic) => topic.categoryIds.some((id) => service.categoryIds.includes(id))),
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
    categories: topic.categoryIds.map((id) => SUPPORT_CATEGORIES.find((item) => item.id === id)).filter(Boolean),
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

export const getBookings = asyncHandler(async (req, res) => {
  const bookings = await listSupportBookings(userId(req));
  return ok(res, { bookings: bookings.map((booking) => serializeSupportBooking(booking)), emptyState: SUPPORT_UI.emptyStates.bookings });
});

export const getBookingSupport = asyncHandler(async (req, res) => {
  const booking = await findOwnedBooking(userId(req), req.params.bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  return ok(res, { booking: serializeSupportBooking(booking), categories: categoriesForBooking(booking), contactOptions: contactOptionsForBooking(booking) });
});

export const getCategories = asyncHandler(async (req, res) => {
  if (!req.query.bookingId) return ok(res, { categories: SUPPORT_CATEGORIES });
  const booking = await findOwnedBooking(userId(req), req.query.bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  return ok(res, { categories: categoriesForBooking(booking), booking: serializeSupportBooking(booking, { includeActions: false }) });
});

export const getContacts = asyncHandler(async (req, res) => {
  if (!req.query.bookingId) return ok(res, { contactOptions: PLATFORM_CONTACT_OPTIONS, emptyState: SUPPORT_UI.emptyStates.contacts });
  const booking = await findOwnedBooking(userId(req), req.query.bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  return ok(res, { contactOptions: contactOptionsForBooking(booking), emptyState: SUPPORT_UI.emptyStates.contacts });
});

export const listTickets = asyncHandler(async (req, res) => {
  const query = { user: userId(req) };
  if (req.query.status) {
    if (!SUPPORT_TICKET_STATUS_LIST.includes(req.query.status)) throw new ApiError(400, "Invalid support ticket status");
    query.status = req.query.status;
  }
  const tickets = await SupportTicket.find(query).populate("booking", "bookingRef product travelWindow").sort({ lastActivityAt: -1 }).limit(100);
  return ok(res, { tickets, statuses: SUPPORT_TICKET_STATUS_LIST.map((id) => ({ id, label: id.replaceAll("_", " ") })), emptyState: SUPPORT_UI.emptyStates.tickets });
});

export const getTicket = asyncHandler(async (req, res) => {
  if (!validId(req.params.ticketId)) throw new ApiError(404, "Support request not found");
  const ticket = await SupportTicket.findOne({ _id: req.params.ticketId, user: userId(req) }).populate("booking", "bookingRef product travelWindow");
  if (!ticket) throw new ApiError(404, "Support request not found");
  const messages = await SupportTicketMessage.find({ ticket: ticket._id }).sort({ createdAt: 1 });
  if (ticket.unreadByCustomer) await SupportTicket.updateOne({ _id: ticket._id }, { unreadByCustomer: false });
  const category = categoryById(ticket.categoryId);
  return ok(res, { ticket, status: { id: ticket.status, label: ticket.status.replaceAll("_", " ") }, category: category ? { id: category.id, label: category.label } : null, messages, canReply: !["RESOLVED", "CLOSED"].includes(ticket.status) });
});

export const createTicket = asyncHandler(async (req, res) => {
  const categoryId = clean(req.body.categoryId, 80).toLowerCase();
  const subject = clean(req.body.subject, 180);
  const description = clean(req.body.description, 5000);
  if (!validCategory(categoryId)) throw new ApiError(400, "Choose a valid support category");
  if (!subject || !description) throw new ApiError(400, "Subject and description are required");
  let booking = null;
  const requestedServiceId = clean(req.body.serviceId, 40).toLowerCase();
  if (requestedServiceId && !serviceById(requestedServiceId)) throw new ApiError(400, "Choose a valid support service");
  if (req.body.bookingId) {
    booking = await findOwnedBooking(userId(req), req.body.bookingId);
    if (!booking) throw new ApiError(404, "Booking not found");
    if (!categoriesForBooking(booking).some((item) => item.id === categoryId)) throw new ApiError(400, "This category is not available for the booking");
  }
  const ticket = await SupportTicket.create({
    reference: createReference("TREM-SUP"),
    user: userId(req), booking: booking?._id || null, serviceId: booking?.product || requestedServiceId,
    categoryId, subcategoryId: clean(req.body.subcategoryId, 80), subject, description,
    priority: defaultTicketPriority(categoryId), attachments: [],
  });
  await SupportTicketMessage.create({ ticket: ticket._id, sender: userId(req), senderType: SUPPORT_SENDER_TYPE.CUSTOMER, senderName: clean(req.user?.name, 100), content: description });
  return ok(res.status(201), { ticket }, "Support request created");
});

export const replyToTicket = asyncHandler(async (req, res) => {
  if (!validId(req.params.ticketId)) throw new ApiError(404, "Support request not found");
  const ticket = await SupportTicket.findOne({ _id: req.params.ticketId, user: userId(req) });
  if (!ticket) throw new ApiError(404, "Support request not found");
  if (["RESOLVED", "CLOSED"].includes(ticket.status)) throw new ApiError(409, "This support request no longer accepts replies");
  const content = clean(req.body.content, 5000);
  if (!content) throw new ApiError(400, "A message is required");
  const message = await SupportTicketMessage.create({ ticket: ticket._id, sender: userId(req), senderType: SUPPORT_SENDER_TYPE.CUSTOMER, senderName: clean(req.user?.name, 100), content });
  ticket.lastActivityAt = new Date();
  ticket.status = "AWAITING_SUPPORT";
  await ticket.save();
  return ok(res.status(201), { message, ticket }, "Reply sent");
});

export const getEligibility = asyncHandler(async (req, res) => {
  const type = clean(req.params.type, 30).toUpperCase();
  if (!SUPPORT_REQUEST_TYPE_LIST.includes(type)) throw new ApiError(404, "Support flow not found");
  const booking = await findOwnedBooking(userId(req), req.params.bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  return ok(res, { eligibility: buildEligibility(booking, type) });
});

export const submitBookingRequest = asyncHandler(async (req, res) => {
  const type = clean(req.params.type, 30).toUpperCase();
  if (!SUPPORT_REQUEST_TYPE_LIST.includes(type)) throw new ApiError(404, "Support flow not found");
  const booking = await findOwnedBooking(userId(req), req.params.bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  const eligibility = buildEligibility(booking, type);
  if (!eligibility.eligible) throw new ApiError(409, eligibility.explanation);
  const request = await SupportBookingRequest.create({
    reference: createReference(`TREM-${type.slice(0, 3)}`), user: userId(req), booking: booking._id, type,
    reasonId: clean(req.body.reasonId, 80), note: clean(req.body.note, 3000), selection: req.body.selection || null,
    eligibilitySnapshot: eligibility,
  });
  return ok(res.status(201), { request }, `${type.toLowerCase()} request submitted`);
});
