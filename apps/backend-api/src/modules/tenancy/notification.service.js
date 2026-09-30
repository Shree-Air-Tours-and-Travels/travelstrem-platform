import Notification from "./models/Notification.js";
import {
    REALTIME_EVENTS,
    notificationDto,
    publishToUser,
} from "../../realtime/index.js";

const safeInternalPath = (value) => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) return "";
    if (/[\u0000-\u001f\\]/.test(trimmed)) return "";
    return trimmed;
};

const first = (...values) =>
    values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");

const encode = (value) => encodeURIComponent(String(value || "").trim());

const routeForNotification = (notification = {}) => {
    const data = notification.data || {};
    const type = String(first(notification.type, data.type, "") || "").toLowerCase();
    const entityType = String(first(notification.entityType, data.entityType, "") || "").toLowerCase();
    const product = String(first(data.product, data.productKey, "") || "").toLowerCase();
    const entityId = first(notification.entityId, data.entityId, data.ticketId);
    const supportRef = first(data.ticketRef, data.supportRef, data.reference, entityId);
    const enquiryRef = first(data.enquiryRef, data.enquiryReference, data.reference);
    const bookingRef = first(data.bookingRef, data.bookingReference);
    const recordRef = first(bookingRef, enquiryRef);
    const slug = first(data.slug, data.tripSlug, data.tourSlug);

    const links = {};

    if (entityType.includes("support") || type.includes("support")) {
        links.customer = supportRef ? `/help/requests/${encode(supportRef)}` : "/help";
        links.partner = supportRef ? `/agent/support?ticket=${encode(supportRef)}` : "/agent/support";
        links.admin = supportRef ? `/manage/tours?tab=support&ticket=${encode(supportRef)}` : "/manage/tours?tab=support";
    } else if (
        entityType.includes("booking") ||
        entityType.includes("quote") ||
        entityType.includes("enquiry") ||
        type.includes("booking") ||
        type.includes("quote") ||
        type.includes("enquiry")
    ) {
        links.customer = bookingRef
            ? `/?tab=bookings&booking=${encode(bookingRef)}`
            : enquiryRef
              ? `/?tab=bookings&enquiry=${encode(enquiryRef)}`
              : "/?tab=bookings";
        links.partner = recordRef ? `/agent/bookings/${encode(recordRef)}` : "/agent/bookings";
        links.admin = recordRef ? `/manage/bookings/${encode(recordRef)}` : "/manage/bookings";
    } else if (type.includes("product") || entityType.includes("productaccess") || type.includes("agency")) {
        links.partner = "/agent/agency";
        links.admin = "/manage/tours?tab=tenancy";
    } else if (entityType.includes("trip") || product === "trevio") {
        links.customer = slug ? `/trips/${encode(slug)}` : "/trips";
        links.partner = "/agent/trevio/trips";
        links.admin = "/manage/tours?tab=services&product=trevio";
    } else if (entityType.includes("tour") || product === "trevista") {
        links.customer = slug ? `/trevista/tours/${encode(slug)}` : "/trevista/tours";
        links.partner = "/agent/services/tours";
        links.admin = "/manage/tours?tab=services&product=trevista";
    }

    return links;
};

const normalizeNotificationPayload = (notification = {}) => {
    const data = { ...(notification.data || {}) };
    const portal = ["customer", "partner", "admin"].includes(notification.portal)
        ? notification.portal
        : notification.agencyId
          ? "partner"
          : "customer";
    const generatedLinks = routeForNotification({ ...notification, data });
    const links = { ...generatedLinks, ...(data.links || {}) };
    const actionUrl = safeInternalPath(first(notification.actionUrl, data.actionUrl, links[portal], ""));
    return {
        ...notification,
        portal,
        actionUrl,
        data: {
            ...data,
            actionUrl: data.actionUrl || actionUrl,
            links,
        },
    };
};

export async function createInboxNotification({ userId, agencyId = null, ...notification }) {
    if (!userId) return null;
    const record = await Notification.create(normalizeNotificationPayload({ userId, agencyId, ...notification }));
    try {
        publishToUser(String(userId), REALTIME_EVENTS.NOTIFICATION_CREATED, notificationDto(record));
    } catch (error) {
        console.error("[Notification] realtime publish failed:", error?.message);
    }
    return record;
}

export async function createInboxNotifications(notifications = []) {
    const payloads = notifications
        .filter((item) => item?.userId)
        .map((item) => normalizeNotificationPayload(item));
    if (!payloads.length) return [];
    const records = await Notification.insertMany(payloads);
    records.forEach((record) => {
        try {
            publishToUser(String(record.userId), REALTIME_EVENTS.NOTIFICATION_CREATED, notificationDto(record));
        } catch (error) {
            console.error("[Notification] realtime publish failed:", error?.message);
        }
    });
    return records;
}
