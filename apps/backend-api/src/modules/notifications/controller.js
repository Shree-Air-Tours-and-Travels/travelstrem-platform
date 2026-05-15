import mongoose from "mongoose";
import NotificationService from "./services/NotificationService.js";

function sendSuccess(res, dataPayload = {}, message = "OK", opts = {}) {
  const { title = "", description = "", structure = {}, config = {} } = opts;
  return res.json({ status: "success", message, componentData: { title, description, data: dataPayload, structure, config } });
}

function sendError(res, message = "Something went wrong", statusCode = 500) {
  return res.status(statusCode).json({ status: "error", message, componentData: { title: "", description: "", data: [], structure: {}, config: {} } });
}

function authInfoFromReq(req) {
  if (req.user) {
    return { userId: req.user.sub || req.user.id || req.user._id || req.user.userId || null };
  }
  const bodyUser = req.body?.user;
  if (bodyUser) {
    const parsed = typeof bodyUser === "string" ? JSON.parse(bodyUser) : bodyUser;
    return { userId: parsed.id || parsed._id || parsed.userId || null };
  }
  return { userId: req.query?.userId || req.headers?.["x-user-id"] || null };
}

export async function listNotifications(req, res) {
  try {
    const { userId } = authInfoFromReq(req);
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) return sendError(res, "Authentication required.", 401);
    const limit = Math.max(1, Math.min(100, Number(req.query?.limit || 20)));
    const skip = Math.max(0, Number(req.query?.skip || 0));
    const unreadOnly = String(req.query?.unreadOnly || "false") === "true";
    const data = await NotificationService.listForUser(userId, { limit, skip, unreadOnly });
    return sendSuccess(res, data.items, "Notifications listed.", { title: "Notifications", config: { unreadCount: data.unreadCount, limit, skip } });
  } catch (err) {
    console.error("listNotifications:", err);
    return sendError(res, err.message || "Failed to list notifications.", 500);
  }
}

export async function markNotificationRead(req, res) {
  try {
    const { userId } = authInfoFromReq(req);
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) return sendError(res, "Authentication required.", 401);
    await NotificationService.markRead(userId, req.params.id || "all");
    const data = await NotificationService.listForUser(userId, { limit: 20, skip: 0 });
    return sendSuccess(res, data.items, "Notification updated.", { title: "Notifications", config: { unreadCount: data.unreadCount } });
  } catch (err) {
    console.error("markNotificationRead:", err);
    return sendError(res, err.message || "Failed to update notification.", 500);
  }
}
