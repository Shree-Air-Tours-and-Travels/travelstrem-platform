const safeInternalPath = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) return "";
  if (/[\u0000-\u001f\\]/.test(trimmed)) return "";
  return trimmed;
};

const valueOf = (...values) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");

const encode = (value) => encodeURIComponent(String(value || "").trim());

const productOf = (notification = {}) => {
  const data = notification.data || {};
  return String(valueOf(data.product, data.productKey, notification.product, "") || "").toLowerCase();
};

const isTrevio = (notification = {}) => productOf(notification) === "trevio";

const entity = (notification = {}) =>
  String(valueOf(notification.entityType, notification.data?.entityType, "") || "").toLowerCase();

const notificationType = (notification = {}) =>
  String(valueOf(notification.type, notification.data?.type, "") || "").toLowerCase();

export function resolveNotificationLink(notification = {}, { portal = "customer" } = {}) {
  const data = notification.data || {};
  const links = notification.links || data.links || {};
  const portalLink = safeInternalPath(links[portal]);
  if (portalLink) return portalLink;

  const configuredLink = safeInternalPath(
    valueOf(notification.actionUrl, data.actionUrl, data.link, data.url),
  );
  if (configuredLink) return configuredLink;

  const type = notificationType(notification);
  const entityType = entity(notification);
  const entityId = valueOf(notification.entityId, data.entityId, data.ticketId);
  const supportRef = valueOf(data.ticketRef, data.supportRef, data.reference, entityId);
  const enquiryRef = valueOf(data.enquiryRef, data.enquiryReference, data.reference);
  const bookingRef = valueOf(data.bookingRef, data.bookingReference);
  const recordRef = valueOf(bookingRef, enquiryRef);
  const product = productOf(notification);
  const slug = valueOf(data.slug, data.tripSlug, data.tourSlug);

  if (portal === "partner") {
    if (entityType.includes("support") || type.includes("support")) return supportRef ? `/agent/support?ticket=${encode(supportRef)}` : "/agent/support";
    if (type.includes("product") || entityType.includes("productaccess")) return "/agent/agency";
    if (type.includes("agency") || type.includes("invitation") || type.includes("deletion")) {
      return "/agent/agency";
    }
    if (
      entityType.includes("booking") ||
      entityType.includes("quote") ||
      entityType.includes("enquiry") ||
      type.includes("quote") ||
      type.includes("enquiry") ||
      type.includes("booking")
    ) {
      return recordRef ? `/agent/bookings/${encode(recordRef)}` : "/agent/bookings";
    }
    if (entityType.includes("trip") || product === "trevio") return "/agent/trevio/trips";
    if (entityType.includes("tour") || product === "trevista") return "/agent/services/tours";
    return "/agent/notifications";
  }

  if (portal === "admin") {
    if (entityType.includes("support") || type.includes("support")) return supportRef ? `/manage/tours?tab=support&ticket=${encode(supportRef)}` : "/manage/tours?tab=support";
    if (type.includes("product") || entityType.includes("productaccess") || type.includes("agency")) {
      return "/manage/tours?tab=tenancy";
    }
    if (type.includes("deletion") || type.includes("invitation")) {
      return "/manage/tours?tab=internalTeam";
    }
    if (
      entityType.includes("booking") ||
      entityType.includes("quote") ||
      entityType.includes("enquiry") ||
      type.includes("quote") ||
      type.includes("enquiry") ||
      type.includes("booking")
    ) {
      return recordRef ? `/manage/bookings/${encode(recordRef)}` : "/manage/bookings";
    }
    if (entityType.includes("trip") || product === "trevio") return "/manage/tours?tab=services&product=trevio";
    if (entityType.includes("tour") || product === "trevista") return "/manage/tours?tab=services&product=trevista";
    return "/manage/tours?tab=notifications";
  }

  if (entityType.includes("support") || type.includes("support")) {
    return supportRef ? `/help/requests/${encode(supportRef)}` : "/help";
  }
  if (
    entityType.includes("booking") ||
    entityType.includes("quote") ||
    entityType.includes("enquiry") ||
    type.includes("quote") ||
    type.includes("enquiry") ||
    type.includes("booking")
  ) {
    if (bookingRef) return `/?tab=bookings&booking=${encode(bookingRef)}`;
    if (enquiryRef) return `/?tab=bookings&enquiry=${encode(enquiryRef)}`;
    return "/?tab=bookings";
  }
  if (entityType.includes("trip") || product === "trevio" || isTrevio(notification)) {
    return slug ? `/trips/${encode(slug)}` : "/trips";
  }
  if (entityType.includes("tour") || product === "trevista") {
    return slug ? `/trevista/tours/${encode(slug)}` : "/trevista/tours";
  }
  return "/notifications";
}
