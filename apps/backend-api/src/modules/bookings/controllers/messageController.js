import mongoose from "mongoose";
import asyncHandler from "../../../shared/middleware/asyncHandler.js";
import ApiError from "../../../shared/errors/ApiError.js";
import Booking from "../models/Booking.js";
import MessageService from "../services/MessageService.js";
import BookingTimelineService from "../services/BookingTimelineService.js";

function sendSuccess(res, data, message = "OK") {
  return res.json({ status: "success", message, componentData: { data } });
}

function normalizeObjectId(value) {
  if (!value) return null;
  const raw = typeof value === "object" ? (value._id || value.id) : value;
  return mongoose.Types.ObjectId.isValid(String(raw)) ? String(raw) : null;
}

function authInfoFromReq(req) {
  if (!req?.user) return { userId: null, userRole: null, authUser: null };
  const payload = req.user;
  return {
    userId: payload.sub || payload.id || payload._id || payload.userId || null,
    userRole: payload.role || payload.userRole || null,
    authUser: payload,
  };
}

function isPrivileged(authUser, userRole) {
  const roles = new Set();
  const add = (v) => { if (v) String(v).split(",").map((p) => p.trim().toLowerCase()).filter(Boolean).forEach((p) => roles.add(p)); };
  add(userRole);
  add(authUser?.role);
  if (Array.isArray(authUser?.roles)) authUser.roles.forEach(add);
  return [...roles].some((r) => ["admin", "agent", "super_admin", "support", "operations"].includes(r));
}

export const sendMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, messageType = "text", metadata = {} } = req.body;
  const { userId, userRole, authUser } = authInfoFromReq(req);
  const privileged = isPrivileged(authUser, userRole);

  if (!content || !String(content).trim()) {
    throw new ApiError(400, "Message content is required");
  }

  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, "Booking not found");

  const senderType = privileged ? "agent" : "customer";
  const senderName = authUser?.name || (privileged ? "Agent" : "Customer");

  const message = await MessageService.send({
    bookingId: booking._id,
    senderId: normalizeObjectId(userId),
    senderType,
    senderName,
    content: String(content).trim(),
    messageType,
    metadata,
  });

  await BookingTimelineService.record({
    bookingId: booking._id,
    actor: { id: normalizeObjectId(userId), type: senderType },
    action: "message_sent",
    metadata: { messageId: message._id, messageType, preview: String(content).trim().slice(0, 100) },
  });

  return sendSuccess(res, message, "Message sent");
});

export const getMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 50, skip = 0, before } = req.query;
  const { userRole, authUser } = authInfoFromReq(req);
  const privileged = isPrivileged(authUser, userRole);

  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, "Booking not found");

  const messages = await MessageService.list(id, {
    limit: Math.min(Number(limit), 100),
    skip: Number(skip),
    before,
  });

  const total = await MessageService.count(id);
  const unreadCount = await MessageService.countUnread(id, privileged ? "agent" : "customer");

  if (unreadCount > 0) {
    await MessageService.markRead(id, privileged ? "agent" : "customer");
  }

  return sendSuccess(res, { messages, total, unreadCount, hasMore: Number(skip) + messages.length < total });
});

export default { sendMessage, getMessages };
