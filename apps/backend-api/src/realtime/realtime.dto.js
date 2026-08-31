/**
 * Safe realtime DTOs. Sensitive backend documents (raw payments, user
 * records, provider payloads) are never serialized to sockets — only the
 * whitelisted fields below.
 */

const pick = (source = {}, fields) =>
    fields.reduce((acc, field) => {
        if (source[field] !== undefined) acc[field] = source[field];
        return acc;
    }, {});

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
    enquiryId: idOf(lead),
    enquiryRef: lead.enquiryRef || null,
    tourId: lead.tourId || null,
    tourTitle: lead.tourTitle || null,
    product: lead.product || null,
    status: lead.status || "new",
    agencyId: idOf(lead.agencyId),
    ownerAgentId: idOf(lead.ownerAgent),
    claimedUserId: idOf(lead.claimedBy),
    travellerCount: lead.fields?.travellerCount ?? null,
    preferredTravelDate:
        lead.fields?.preferredTravelDate || lead.fields?.preferredStartDate || null,
    packageKey: lead.selection?.packageKey || null,
    packageName: lead.selection?.packageName || null,
    notified: Boolean(lead.notified),
    createdAt: lead.createdAt || new Date().toISOString(),
});

export const bookingQuoteDto = (quote = {}) => ({
    quoteId: idOf(quote),
    enquiryId: idOf(quote.inquiryId),
    bookingId: idOf(quote.bookingId),
    quoteNumber: quote.quoteNumber || null,
    userId: idOf(quote.userId),
    agencyId: idOf(quote.agencyId),
    tourId: idOf(quote.tourId),
    departureId: quote.departureId || null,
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

export const notificationDto = (notification = {}) => ({
    notificationId: idOf(notification),
    userId: idOf(notification.userId),
    agencyId: idOf(notification.agencyId),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    entityType: notification.entityType || "",
    entityId: notification.entityId || "",
    data: notification.data || {},
    createdAt: notification.createdAt || new Date().toISOString(),
});

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
