/**
 * Safe realtime DTOs. Sensitive backend documents (raw payments, user
 * records, provider payloads) are never serialized to sockets — only the
 * whitelisted fields below.
 */

const idOf = (value) =>
    value && typeof value === "object"
        ? String(value._id || value.id || "")
        : value
          ? String(value)
          : null;

export const bookingPaymentDto = (payment = {}) => ({
    paymentId: idOf(payment),
    bookingId: idOf(payment.bookingId),
    agencyId: idOf(payment.agencyId),
    createdBy: idOf(payment.createdBy),
    amount: payment.amount,
    amountMinor: payment.amountMinor ?? null,
    currency: payment.currency || "INR",
    type: payment.type,
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    provider: payment.provider,
    paymentDate: payment.paymentDate || null,
    verifiedAt: payment.verifiedAt || null,
});

/**
 * Enquiry (ContactLead) push payload. Deliberately excludes customer PII
 * (name/email/phone/message): operators get the full record by refetching the
 * enquiries endpoint; the socket event is a live "something changed" nudge.
 */
export const enquiryDto = (lead = {}) => ({
    enquiryId: lead.enquiryRef || null,
    enquiryRef: lead.enquiryRef || null,
    tourTitle: lead.tourTitle || null,
    product: lead.product || null,
    status: lead.status || "new",
    travellerCount: lead.fields?.travellerCount ?? null,
    preferredTravelDate:
        lead.fields?.preferredTravelDate || lead.fields?.preferredStartDate || null,
    packageKey: lead.selection?.packageKey || null,
    packageName: lead.selection?.packageName || null,
    notified: Boolean(lead.notified),
    createdAt: lead.createdAt || new Date().toISOString(),
});

export const bookingQuoteDto = (quote = {}) => ({
    quoteId: quote.quoteRef || quote.quoteNumber || "",
    quoteRef: quote.quoteRef || quote.quoteNumber || "",
    quoteNumber: quote.quoteNumber || null,
    status: quote.status,
    currency: quote.currency || "INR",
    finalAmount: quote.finalAmount ?? null,
    payableNow: quote.payableNow ?? quote.amountPayableNow ?? null,
    expiresAt: quote.expiresAt || null,
});

export const tourDto = (tour = {}) => {
    const price = tour.price || {};
    return {
        tourId: idOf(tour),
        slug: tour.slug || null,
        title: tour.title || tour.name || null,
        status: tour.status || null,
        isPublished: tour.status === "published",
        featured: Boolean(tour.featured),
        trending: Boolean(tour.trending),
        tremVerified: Boolean(tour.tremVerified),
        agencyId: idOf(tour.agencyId),
        packageType: tour.packageType || null,
        price: {
            min: price.min ?? null,
            max: price.max ?? null,
            currency: price.currency || "INR",
            isFinal: Boolean(price.isFinal),
        },
        updatedAt: tour.updatedAt || null,
    };
};

export const departureAvailabilityDto = ({ tour, tourId, departure }) => ({
    tourId: idOf(tour) || (tourId ? String(tourId) : null),
    departureId: idOf(departure) || (departure?.id ? String(departure.id) : null),
    startDate: departure?.startDate || null,
    endDate: departure?.endDate || null,
    seatsAvailable: departure?.seatsAvailable ?? null,
    seatsTotal: departure?.seatsTotal ?? null,
    status: departure?.status || null,
});

export const tripDto = (trip = {}) => ({
    tripId: idOf(trip),
    slug: trip.slug || null,
    title: trip.title || null,
    agencyId: idOf(trip.agencyId),
    status: trip.status || null,
    isListed: Boolean(trip.isListed),
    updatedAt: trip.updatedAt || null,
    availability: trip.availability
        ? {
              seatsAvailable: trip.availability.seatsAvailable ?? null,
              status: trip.availability.status || null,
          }
        : null,
});

const notificationRecordMeta = (notification = {}) => {
    const data = notification.data || {};
    const type = `${notification.type || ""} ${notification.entityType || ""}`.toLowerCase();
    const bookingRef = data.bookingRef || data.bookingReference || "";
    const enquiryRef = data.enquiryRef || data.enquiryReference || "";
    const supportRef = data.ticketRef || data.supportRef || data.reference || "";
    const quoteRef = data.quoteRef || data.quoteNumber || "";

    if (type.includes("support") && supportRef) return { label: "Support ticket", value: supportRef };
    if (bookingRef) return { label: "Booking", value: bookingRef };
    if (type.includes("quote") && quoteRef) return { label: "Quotation", value: quoteRef };
    if (enquiryRef) return { label: "Enquiry", value: enquiryRef };
    if (quoteRef) return { label: "Quotation", value: quoteRef };
    return null;
};

const hasInternalIdPathSegment = (value) =>
    /(?:^|[/?#=&])[a-f0-9]{24}(?:$|[/?#=&])/i.test(String(value || ""));

const safePublicPath = (value) => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) return "";
    if (/[\u0000-\u001f\\]/.test(trimmed) || hasInternalIdPathSegment(trimmed)) return "";
    return trimmed;
};

const notificationLinksDto = (links = {}) =>
    ["customer", "partner", "admin"].reduce((acc, key) => {
        const path = safePublicPath(links[key]);
        if (path) acc[key] = path;
        return acc;
    }, {});

const notificationDataDto = (data = {}) => {
    const allowed = [
        "actionUrl",
        "bookingRef",
        "bookingReference",
        "enquiryRef",
        "enquiryReference",
        "links",
        "product",
        "productKey",
        "quoteNumber",
        "quoteRef",
        "reference",
        "slug",
        "status",
        "supportRef",
        "ticketRef",
        "tourSlug",
        "tourTitle",
        "tripSlug",
    ];
    return allowed.reduce((acc, key) => {
        if (data[key] !== undefined && data[key] !== null && data[key] !== "") acc[key] = data[key];
        return acc;
    }, {});
};

export const notificationDto = (notification = {}) => {
    const recordMeta = notificationRecordMeta(notification);
    const safeData = notificationDataDto(notification.data || {});
    const links = notificationLinksDto(safeData.links || {});
    const actionUrl = safePublicPath(notification.actionUrl || safeData.actionUrl || "");
    return {
        notificationId: idOf(notification),
        portal: notification.portal || "",
        type: notification.type,
        title: notification.title,
        message: notification.message,
        entityType: notification.entityType || "",
        entityId: "",
        actionUrl,
        links,
        ...(recordMeta ? { recordMeta } : {}),
        data: { ...safeData, ...(Object.keys(links).length ? { links } : {}) },
        readAt: notification.readAt || null,
        createdAt: notification.createdAt || new Date().toISOString(),
    };
};

export const supportTicketDto = (ticket = {}) => ({
    id: idOf(ticket),
    ticketId: idOf(ticket),
    reference: ticket.reference || null,
    userId: idOf(ticket.user),
    categoryId: ticket.categoryId || null,
    subject: ticket.subject || null,
    status: ticket.status || null,
    priority: ticket.priority || null,
    lastActivityAt: ticket.lastActivityAt || null,
});

export const supportMessageDto = (message = {}) => ({
    id: idOf(message),
    messageId: idOf(message),
    ticketId: idOf(message.ticket),
    senderType: message.senderType || null,
    senderName: message.senderName || null,
    clientMessageId: message.clientMessageId || null,
    content: message.content || "",
    createdAt: message.createdAt || new Date().toISOString(),
});
