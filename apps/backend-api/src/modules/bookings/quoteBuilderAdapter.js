import User from "../auth/models/User.js";
import PartnerAgency from "../auth/models/PartnerAgency.js";
import ContactLead from "../forms/models/ContactLead.js";
import Booking from "./models/Booking.js";
import BookingQuote from "./models/BookingQuote.js";
import Tour from "../tours/models/Tour.js";
import { DOCUMENT_TYPE } from "../../constants/enums.js";
import FinancialEngine from "../../core/financial-engine/index.js";
import { minorToDecimal } from "../../core/financial-engine/utils/money.js";
import { buildServerQuoteDocumentModel } from "@packages/trem-docengine/server";
import { generateQuoteDocumentPdf, pdfDocumentToBuffer } from "../../services/pdfService.js";
import DocumentService from "./services/DocumentService.js";
import { readQuoteDocument } from "./services/QuoteDocumentStorage.js";
import { createQuoteBuilderService, resolveCustomerQuoteDecision, validateTravellerDetails } from "../../../../booking-engine/server/index.mjs";
import { generateQuoteNarrative } from "../../core/trem-intelligence/quoteNarrative.service.js";
import { sendTransactionalEmail } from "../../services/email.service.js";
import {
    bookingQuoteDto,
    enquiryDto,
    publishFanOut,
    REALTIME_EVENTS,
} from "../../realtime/index.js";
import { enquiryView } from "../forms/mappers/enquiryView.js";
import { bookingView } from "./mappers/bookingView.js";
import {
    ensureBookingFromAcceptedQuote,
    linkEnquiryArtifactsToBooking,
} from "./services/EnquiryBookingConversionService.js";
import { BOOKING_STATUS } from "../../constants/enums.js";

const operatorRoles = new Set(["agent", "admin", "super_admin"]);
const actorId = (actor) => actor?.sub || actor?.id || actor?._id;
const bookingIdentity = (value) => {
    const normalized = String(value || "").trim();
    if (/^BKG-/i.test(normalized)) return { bookingRef: normalized.toUpperCase() };
    return Booking.db.base.Types.ObjectId.isValid(normalized) ? { _id: normalized } : null;
};

const findBookingRecord = async (resourceId) => {
    const identity = bookingIdentity(resourceId);
    return identity ? Booking.findOne(identity) : null;
};
const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

async function findAuthorizedEnquiry(enquiryId, actor) {
    const userId = actorId(actor);
    const role = String(actor?.role || "").toLowerCase();
    if (!userId || !operatorRoles.has(role))
        throw Object.assign(new Error("Only agents and administrators can build quotes."), {
            status: 403,
        });
    const booking = await findBookingRecord(enquiryId);
    const query = { _id: booking?.sourceEnquiryId || enquiryId };
    const master = role === "super_admin" || (role === "admin" && actor?.adminLevel === "master");
    if (!master) {
        const viewer = await User.findById(userId).select("agencyId agencyRole").lean();
        if (viewer?.agencyRole === "partner_admin" && viewer.agencyId)
            query.agencyId = viewer.agencyId;
        else query.ownerAgent = userId;
    }
    const enquiry = await ContactLead.findOne(query);
    if (!enquiry) throw Object.assign(new Error("Enquiry not found."), { status: 404 });
    return enquiry;
}

export async function findAuthorizedBookingJourney(enquiryId, actor) {
    const userId = actorId(actor);
    if (!userId)
        throw Object.assign(new Error("Please sign in to view this booking journey."), {
            status: 401,
        });
    const role = String(actor?.role || "member").toLowerCase();
    const isOperator = operatorRoles.has(role);
    const booking = await findBookingRecord(enquiryId);
    const sourceEnquiryId = booking?.sourceEnquiryId || enquiryId;
    const enquiryDocument = isOperator
        ? await findAuthorizedEnquiry(sourceEnquiryId, actor)
        : await ContactLead.findOne({ _id: sourceEnquiryId, claimedBy: userId });
    if (!enquiryDocument)
        throw Object.assign(new Error("Enquiry not found."), { status: 404 });
    const enquiry = enquiryDocument.toObject();
    const perspective = isOperator ? "received" : "sent";
    const travellerCount = Math.max(
        1,
        Number(enquiry.fields?.travellerCount || enquiry.customizationSnapshot?.travellers || 1),
    );
    return {
        id: String(booking?._id || enquiry._id),
        enquiryId: String(enquiry._id),
        reference: booking?.bookingRef || enquiry.enquiryRef || "Enquiry",
        title: booking?.tourTitle || enquiry.tourTitle || "Tour enquiry",
        status: booking?.status || enquiry.status || "new",
        travellerCount,
        requiresPassport:
            enquiry.fields?.flightPreference === "with_flights" ||
            enquiry.customizationSnapshot?.flightRequest === "ADD",
        travellerDetails: booking?.travellerDetails || enquiry.travellerDetails || null,
        record: booking
            ? bookingView(booking.toObject(), enquiry, perspective)
            : enquiryView(enquiry, perspective),
    };
}

export async function findCurrentBookingJourneyQuote(resourceId) {
    const booking = await findBookingRecord(resourceId);
    const enquiryId = booking?.sourceEnquiryId || resourceId;
    const quote = await BookingQuote.findOne({
        $or: [
            ...(booking ? [{ _id: booking.acceptedQuoteId }, { bookingId: booking._id }] : []),
            { inquiryId: enquiryId },
            { bookingId: enquiryId },
            { contextType: "ENQUIRY", contextId: String(enquiryId) },
        ],
    })
        .sort({ version: -1, createdAt: -1 })
        .lean();
    if (!quote) return null;
    return {
        id: String(quote._id),
        quoteRef: quote.quoteRef || "",
        version: quote.version,
        status: quote.status,
        expirationDate: quote.expirationDate || quote.validity || quote.expiresAt,
        currency: quote.currency || "INR",
        basePrice: quote.basePrice || 0,
        platformFee: quote.platformFee || 0,
        taxes: quote.taxes || 0,
        finalAmount: quote.finalAmount || 0,
        items: quote.items || [],
        notes: quote.notes || "",
        terms: quote.terms || "",
        acceptedAt: quote.acceptedAt || null,
        rejectedAt: quote.rejectedAt || null,
        cancelledAt: quote.cancelledAt || null,
        changeRequest: quote.changeRequest || null,
    };
}

async function saveProcess(enquiry, process) {
    enquiry.quoteBuilder = process;
    if (enquiry.status === "new") enquiry.status = "in_review";
    enquiry.markModified("quoteBuilder");
    await enquiry.save();
}

const asText = (value) => {
    if (value == null || value === "") return "";
    if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(", ");
    if (typeof value === "object")
        return Object.entries(value)
            .map(([key, item]) => `${key}: ${asText(item)}`)
            .filter((item) => !item.endsWith(": "))
            .join("; ");
    return String(value).trim();
};

const flightPreferenceText = (value) => ({
    with_flights: "With flights",
    without_flights: "Without flights",
    agent_recommendation: "Travel specialist recommendation",
}[value] || asText(value));

const toDateInput = (date) => {
    const value = date ? new Date(date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
};

const safeActivity = (activity = {}) => ({
    name: activity.name || "",
    description: activity.description || "",
    duration: activity.duration || "",
    included: activity.included !== false,
});

const safeItinerary = (tour) =>
    (tour?.itinerary || []).map((day) => ({
        day: day.day,
        title: day.title || "",
        summary: day.summary || "",
        activities: [...(day.activities || []), ...(day.structuredActivities || []).map(safeActivity)],
        meals: day.meals || [],
        accommodation: day.accommodation || "",
        location: day.location || "",
        notes: day.notes || "",
    }));

const safeHotels = (tour, enquiry) => {
    const packageHotels = enquiry.customizationSnapshot?.packageBaseline?.hotels || [];
    const source = packageHotels.length ? packageHotels : tour?.includedStays || [];
    return source.map((stay, index) => ({
        sourceKey: String(stay.stayKey || stay.sourceKey || `stay-${index + 1}`),
        stayKey: String(stay.stayKey || stay.sourceKey || `stay-${index + 1}`),
        nights: stay.nights,
        location: stay.location || "",
        propertyName: stay.hotelName || stay.propertyName || "",
        propertyClass: stay.propertyClass || "",
        roomType: stay.roomName || stay.roomType || "",
        meals: stay.meals || [],
        amenities: stay.amenities || [],
        description: stay.description || "",
    }));
};

const safeComponents = (tour, type) =>
    (tour?.commercial?.components || [])
        .filter((component) => component.active !== false && component.type === type)
        .map((component) => ({
            key: component.componentKey,
            name: component.name,
            description: component.description || "",
            status: component.status,
        }));

const selectedDeparture = (tour, enquiry) => {
    const requestedStart = String(enquiry.fields?.preferredTravelDate || "").split("|")[0];
    const departures = tour?.departures || [];
    const match = departures.find((item) => toDateInput(item.departureDate) === requestedStart) || departures[0];
    return match ? {
        id: String(match._id),
        label: match.label || "Selected departure",
        departureDate: match.departureDate,
        returnDate: match.returnDate,
        status: match.status,
        price: {
            min: Number(match.pricing?.min || 0),
            currency: match.pricing?.currency || "INR",
        },
    } : null;
};

const describeItinerary = (item) =>
    `Day ${item.day}: ${item.title || item.location || "Planned itinerary"}${item.summary ? ` — ${item.summary}` : ""}`;
const describeHotel = (item) =>
    [item.propertyName || item.location || "Stay", item.roomType, item.nights ? `${item.nights} night(s)` : ""]
        .filter(Boolean)
        .join(" · ");

async function findSourceTour(enquiry) {
    const reference = String(enquiry.tourId || "").trim();
    if (!reference) return null;
    const query = BookingQuote.db.base.Types.ObjectId.isValid(reference)
        ? { _id: reference }
        : { $or: [{ slug: reference.toLowerCase() }, { agentRef: reference }] };
    return Tour.findOne(query).lean();
}

async function loadQuoteContext(enquiry) {
    const tour = await findSourceTour(enquiry);
    const narrative = generateQuoteNarrative({ enquiry: enquiry.toObject(), tour });
    const itinerarySnapshot = safeItinerary(tour);
    const hotelSnapshot = safeHotels(tour, enquiry);
    const transferSnapshot = safeComponents(tour, "TRANSFER");
    const activitySnapshot = [
        ...(tour?.itinerary || []).flatMap((day) =>
            (day.structuredActivities || []).map((activity) => ({ day: day.day, ...safeActivity(activity) })),
        ),
        ...safeComponents(tour, "ACTIVITY"),
    ];
    const departureSnapshot = selectedDeparture(tour, enquiry);
    const variantOptions = (tour?.commercial?.packages || [])
        .filter((item) => item.enabled !== false)
        .map((item) => ({ value: item.packageKey || item.tier, label: item.name || item.tier }));
    const selectedVariant = enquiry.selection?.packageKey || variantOptions[0]?.value || "CUSTOM";
    const travellerCount = Math.max(1, Number(enquiry.fields?.travellerCount || enquiry.customizationSnapshot?.travellers || 1));
    const roomCount = Math.max(1, Number(enquiry.customizationSnapshot?.rooms || Math.ceil(travellerCount / 2)));
    let commercialPricing = null;
    if (tour?.commercial?.version === "COMPONENTS_V1" && selectedVariant) {
        try {
            const calculated = await FinancialEngine.calculateBookingFinancials({
                tour,
                packageKey: selectedVariant,
                selections: {
                    ...(tour.commercial.defaultBasis || {}),
                    ...(enquiry.customizationSnapshot?.basis || {}),
                    ...(enquiry.customizationSnapshot?.selections || {}),
                    adults: travellerCount,
                    rooms: roomCount,
                },
                context: { agencyId: enquiry.agencyId || tour.agencyId, tourId: tour._id },
            });
            commercialPricing = calculated.commercial || null;
        } catch {
            commercialPricing = null;
        }
    }
    const derivedPackage = (tour?.commercial?.derived?.packages || []).find(
        (item) => item.packageKey === selectedVariant,
    );
    const packageSnapshot = enquiry.customizationSnapshot?.package || {};
    const customizedSnapshot = enquiry.customizationSnapshot?.customized || {};
    let packageMinor = Number(
        packageSnapshot.totalMinor ?? commercialPricing?.sellingTotalMinor ?? derivedPackage?.sellingTotalMinor ?? customizedSnapshot.totalMinor ?? 0,
    );
    const legacyMajor = Number(departureSnapshot?.price?.min || tour?.price?.min || 0);
    if (packageMinor <= 0 && legacyMajor > 0) packageMinor = Math.round(legacyMajor * 100);
    const customizedMinor = Number(customizedSnapshot.totalMinor ?? packageMinor);
    const addonAmount = Math.max(0, customizedMinor - packageMinor);
    const requestedHotelChanges = (enquiry.customizationSnapshot?.hotels || [])
        .filter((hotel) => hotel.included === false)
        .map((hotel) => {
            const quantity = Math.max(1, Number(hotel.supplement?.quantity || roomCount * Math.max(1, Number(hotel.nights || 1))));
            const totalMinor = hotel.supplement?.totalMinor;
            return {
                changeType: "REPLACE",
                sourceRef: String(hotel.stayKey || ""),
                propertyName: hotel.optionName || "",
                location: hotel.location || "",
                propertyClass: "",
                roomType: hotel.roomName || "",
                nights: Math.max(1, Number(hotel.nights || 1)),
                meals: [],
                amenities: [],
                notes: `Traveller requested this in place of ${[hotel.includedOptionName, hotel.includedRoomName].filter(Boolean).join(" — ") || "the included hotel"}.`,
                pricingType: hotel.supplement?.unit || "PER_ROOM_PER_NIGHT",
                unitAmount: totalMinor == null ? "" : minorToDecimal(Math.round(Number(totalMinor) / quantity)),
                priceQuantity: quantity,
            };
        });
    const requestedFlightChanges = enquiry.customizationSnapshot?.flightRequest === "ADD" ? [{
        changeType: "ADD",
        name: "Flights requested by traveller",
        origin: tour?.flights?.departureCity || "",
        destination: tour?.flights?.arrivalCity || "",
        airline: "",
        cabinClass: "Economy",
        notes: "Flights are not included in the selected package and were requested by the traveller.",
        pricingType: "PER_PERSON",
        unitAmount: "",
        priceQuantity: travellerCount,
    }] : [];
    const requestSummary = [
        asText(enquiry.customizationAnswers),
        asText(enquiry.selection?.hotelRequests),
        asText(enquiry.fields?.message || enquiry.fields?.notes),
    ].filter(Boolean).join(". ") || "No additional customer customization has been recorded.";
    const derivedItems = (commercialPricing?.lines || []).map((line) => ({
        name: line.name || `${line.type || "Package"} service`,
        category: line.type || "PACKAGE",
        description: line.selectionType === "OPTIONAL" ? "Customer-selected optional service" : "Included package service",
        pricingType: line.pricingUnit || "FIXED",
        unitAmount: minorToDecimal(Number(line.sellingUnitAmountMinor || line.sellingAmountMinor || 0)),
        quantity: Math.max(1, Number(line.quantity || 1)),
        packageComponent: line.selectionType !== "OPTIONAL",
    })).filter((item) => Number(item.unitAmount) > 0);
    const derivedTotalMinor = derivedItems.reduce(
        (sum, item) => sum + Math.round(Number(item.unitAmount) * 100) * Number(item.quantity),
        0,
    );
    const pricingItems = derivedItems.length ? derivedItems : packageMinor > 0 ? [{
        name: tour?.title || enquiry.selection?.packageName || "Tour package",
        category: "PACKAGE",
        description: enquiry.selection?.packageName || "Selected tour package",
        pricingType: "FIXED",
        unitAmount: minorToDecimal(packageMinor),
        quantity: 1,
        packageComponent: true,
    }] : [];
    if (packageMinor > derivedTotalMinor && derivedItems.length)
        pricingItems.push({
            name: "Package pricing adjustment",
            category: "PACKAGE",
            description: "Package-level commercial adjustment",
            pricingType: "FIXED",
            unitAmount: minorToDecimal(packageMinor - derivedTotalMinor),
            quantity: 1,
            packageComponent: true,
        });
    if (addonAmount > 0 && !requestedHotelChanges.length)
        pricingItems.push({
            name: enquiry.selection?.hotelRoomName || "Customer customization",
            category: enquiry.selection?.hotelSelections?.length ? "HOTEL" : "OTHER",
            description: requestSummary,
            pricingType: "FIXED",
            unitAmount: minorToDecimal(addonAmount),
            quantity: 1,
            packageComponent: false,
        });
    const cancellationPolicy = tour?.cancellationPolicy || tour?.cancellation?.policy ||
        "Cancellation terms will apply as confirmed in this quotation.";
    const source = {
        tourId: tour?._id ? String(tour._id) : null,
        packageType: tour?.packageType || "custom_enquiry",
        title: tour?.title || enquiry.tourTitle || "",
        description: tour?.shortDescription || tour?.desc || "",
        period: tour?.period || null,
        dates: { startDate: tour?.startDate || null, endDate: tour?.endDate || null },
        departureSnapshot,
        itinerarySnapshot,
        hotelSnapshot,
        transferSnapshot,
        activitySnapshot,
        flightSnapshot: {
            includedInPackage: enquiry.customizationSnapshot?.packageBaseline?.includesFlights ?? null,
            includedNames: enquiry.customizationSnapshot?.packageBaseline?.includedFlightNames || [],
        },
        inclusions: tour?.inclusions || [],
        exclusions: tour?.exclusions || [],
        cancellation: tour ? {
            policy: tour.cancellation?.policy || tour.cancellationPolicy || "",
            freeCancellationUntil: tour.cancellation?.freeCancellationUntil || "",
            refundPercent: Number(tour.cancellation?.refundPercent ?? 100),
            depositRequired: Boolean(tour.cancellation?.depositRequired),
            depositPercent: tour.cancellation?.depositPercent ?? null,
            depositNote: tour.cancellation?.depositNote || "",
            note: tour.cancellation?.note || "",
            tiers: (tour.cancellation?.tiers || []).map((tier) => ({
                label: tier.label || "",
                daysBefore: Number(tier.daysBefore || 0),
                refundPercent: Number(tier.refundPercent || 0),
                description: tier.description || "",
            })),
        } : null,
        cancellationPolicy,
        customerDemand: requestSummary,
        pricingItems,
    };
    const requestSections = [
        { id: "demand", titleRef: "customerDemand", items: [requestSummary] },
        {
            id: "request-facts",
            title: "Traveller requirements",
            items: [
                enquiry.fields?.travellerCount ? `${enquiry.fields.travellerCount} traveller(s)` : null,
                enquiry.fields?.preferredTravelDate || enquiry.fields?.preferredStartDate
                    ? `Travel dates: ${enquiry.fields.preferredTravelDate || [enquiry.fields.preferredStartDate, enquiry.fields.preferredEndDate].filter(Boolean).join(" to ")}`
                    : null,
                enquiry.fields?.flightPreference ? `Flights: ${flightPreferenceText(enquiry.fields.flightPreference)}` : null,
                enquiry.selection?.packageName ? `Requested package: ${enquiry.selection.packageName}` : null,
            ].filter(Boolean),
        },
    ].filter((section) => section.items.length);
    const tourSections = [
        tour ? { id: "tour", titleRef: "sourceTour", items: [tour.title, `${tour.packageType || "tour"}${tour.period?.days ? ` · ${tour.period.days} days` : ""}`, `Included quotation: ${variantOptions.find((item) => item.value === selectedVariant)?.label || selectedVariant}`, departureSnapshot ? `${departureSnapshot.label} · ${toDateInput(departureSnapshot.departureDate)} to ${toDateInput(departureSnapshot.returnDate)}` : null].filter(Boolean) } : null,
        itinerarySnapshot.length ? { id: "itinerary", titleRef: "sourceItinerary", items: itinerarySnapshot.map(describeItinerary) } : null,
        hotelSnapshot.length ? { id: "hotels", titleRef: "sourceHotels", items: hotelSnapshot.map(describeHotel) } : null,
        transferSnapshot.length || activitySnapshot.length ? { id: "services", titleRef: "sourceServices", items: [...transferSnapshot, ...activitySnapshot].map((item) => item.name || `Day ${item.day} activity`) } : null,
        (tour?.inclusions || []).length ? { id: "inclusions", titleRef: "sourceInclusions", items: tour.inclusions.map(asText).filter(Boolean) } : null,
        (tour?.exclusions || []).length ? { id: "exclusions", titleRef: "sourceExclusions", items: tour.exclusions.map(asText).filter(Boolean) } : null,
    ].filter(Boolean);
    return {
        schema: "TREM_SMART_QUOTE_CONTEXT_V1",
        hasTour: Boolean(tour),
        mode: tour?.packageType === "fixed_departure" ? "FIXED" :
            tour?.packageType === "flexible" ? "FLEXIBLE" : tour ? "EXISTING_CUSTOM" : "CUSTOM_ENQUIRY",
        variantOptions,
        travellerCount,
        roomCount,
        intelligence: narrative.metadata,
        source,
        requestSections,
        tourSections,
        sourceSections: [...tourSections, ...requestSections],
        defaults: {
            details: { title: narrative.title, summary: narrative.summary },
            composition: {
                variant: selectedVariant,
                requestSummary,
                itinerary: [], hotels: requestedHotelChanges, flights: requestedFlightChanges, transfers: [], activities: [], inclusions: [], exclusions: [],
            },
            pricing: {
                manualItems: [],
                currency: enquiry.customizationSnapshot?.currency || tour?.price?.currency || "INR",
            },
            terms: {
                validUntil: toDateInput(),
                paymentPlan: "Payment milestones will be confirmed with the traveller before booking.",
                cancellationPolicy,
                notes: "",
            },
        },
    };
}

const asMajor = (minor) => Number(minorToDecimal(Number(minor || 0)));

const paymentPlanText = (items = []) => items.map((item) =>
    `${item.milestone}: ${item.amountType === "PERCENTAGE" ? `${item.amount}%` : item.amount} due ${item.dueWhen}`,
).join("\n");

const cancellationPolicyText = (items = [], notes = "") => [
    ...items.map((item) => `${item.label}: ${item.refundPercent}% refund — ${item.description}`),
    notes,
].filter(Boolean).join("\n");

const quoteSnapshots = (context, data) => {
    const source = context.source || {};
    const changes = data.composition || {};
    return {
        itinerarySnapshot: { base: source.itinerarySnapshot || [], customizations: changes.itinerary || [] },
        hotelSnapshot: { base: source.hotelSnapshot || [], customizations: changes.hotels || [] },
        flightSnapshot: { base: source.flightSnapshot || null, customizations: changes.flights || [] },
        transferSnapshot: { base: source.transferSnapshot || [], customizations: changes.transfers || [] },
        activitySnapshot: { base: source.activitySnapshot || [], customizations: changes.activities || [] },
        inclusions: [...(source.inclusions || []), ...(changes.inclusions || [])].map((item) =>
            typeof item === "string" ? item : [item.title, item.details].filter(Boolean).join(" — "),
        ),
        exclusions: [...(source.exclusions || []), ...(changes.exclusions || [])].map((item) =>
            typeof item === "string" ? item : [item.title, item.details].filter(Boolean).join(" — "),
        ),
        variant: changes.variant || "CUSTOM",
        paymentPlan: data.terms.paymentSchedule || [],
        cancellationPolicy: {
            tiers: data.terms.cancellationTiers || [],
            notes: data.terms.policyNotes || "",
        },
        validity: new Date(`${data.terms.validUntil}T23:59:59.999Z`),
    };
};

async function loadQuoteProvider(enquiry) {
    const [ownerAgent, agency] = await Promise.all([
        enquiry.ownerAgent
            ? User.findById(enquiry.ownerAgent).select("name designation email phone mobile").lean()
            : null,
        enquiry.agencyId
            ? PartnerAgency.findById(enquiry.agencyId)
                  .select(
                      "agencyName legalName partnerAgencyRef contactName contactEmail contactPhone website address",
                  )
                  .lean()
            : null,
    ]);
    const agentSnapshot = enquiry.agentSnapshot || {};
    return {
        agent: {
            name: agentSnapshot.name || ownerAgent?.name || "Your travel specialist",
            designation: ownerAgent?.designation || "Travel specialist",
            email: agentSnapshot.email || ownerAgent?.email || "",
            phone:
                agentSnapshot.phone || ownerAgent?.phone || ownerAgent?.mobile || "",
        },
        agency: agency
            ? {
                  name: agency.agencyName || agency.legalName || "",
                  reference: agency.partnerAgencyRef || "",
                  contactName: agency.contactName || "",
                  email: agency.contactEmail || "",
                  phone: agency.contactPhone || "",
                  website: agency.website || "",
                  address: [
                      agency.address?.line1,
                      agency.address?.line2,
                      agency.address?.city,
                      agency.address?.state,
                      agency.address?.postalCode,
                      agency.address?.country,
                  ]
                      .filter(Boolean)
                      .join(", "),
              }
            : null,
    };
}

async function previewQuoteDocument({ enquiry, context, data, input, calculation }) {
    const latest = await BookingQuote.findOne({
        $or: [
            { inquiryId: enquiry._id },
            { contextType: "ENQUIRY", contextId: String(enquiry._id) },
        ],
    })
        .sort({ version: -1 })
        .select("version")
        .lean();
    const version = Number(latest?.version || 0) + 1;
    const quoteRef = `${enquiry.enquiryRef}-Q${version}`;
    const model = buildServerQuoteDocumentModel({
        enquiry: enquiry.toObject(),
        data,
        pricing: calculation.pricing,
        lines: input.lines,
        quoteRef,
        version,
        snapshots: {
            ...quoteSnapshots(context, data),
            provider: await loadQuoteProvider(enquiry),
        },
    });
    return {
        buffer: await pdfDocumentToBuffer(generateQuoteDocumentPdf(model)),
        fileName: `${quoteRef}-preview.pdf`,
    };
}

async function finalizeQuote({ enquiry, actor, context, data, input, calculation, idempotencyKey }) {
    let quote = await BookingQuote.findOne({ idempotencyKey });
    let version;
    let quoteRef;
    let documentSnapshot;
    let pdfBuffer = null;
    const snapshots = {
        ...quoteSnapshots(context, data),
        provider: await loadQuoteProvider(enquiry),
    };
    if (quote) {
        version = quote.version;
        quoteRef = quote.quoteRef;
        documentSnapshot = quote.documentSnapshot;
    } else {
        const latest = await BookingQuote.findOne({
            $or: [
                { inquiryId: enquiry._id },
                { bookingId: enquiry._id },
                { contextType: "ENQUIRY", contextId: String(enquiry._id) },
            ],
        })
            .sort({ version: -1 })
            .select("version")
            .lean();
        version = Number(latest?.version || 0) + 1;
        quoteRef = `${enquiry.enquiryRef}-Q${version}`;
        documentSnapshot = buildServerQuoteDocumentModel({
            enquiry: enquiry.toObject(),
            data,
            pricing: calculation.pricing,
            lines: input.lines,
            quoteRef,
            version,
            snapshots,
        });
    }

    let document = await DocumentService.latest(enquiry._id, DOCUMENT_TYPE.QUOTE);
    if (!document || Number(document.quoteVersion) !== Number(version)) {
        const pdf = generateQuoteDocumentPdf(documentSnapshot);
        const buffer = await pdfDocumentToBuffer(pdf);
        pdfBuffer = buffer;
        document = await DocumentService.uploadGeneratedQuote({
            bookingId: enquiry.bookingId || null,
            enquiryId: enquiry._id,
            agencyId: enquiry.agencyId,
            version,
            buffer,
            fileName: `${quoteRef}.pdf`,
            quoteAmount: asMajor(calculation.pricing.finalPayableMinor),
            currency: calculation.pricing.currency,
            actor: { id: actorId(actor) },
        });
    }

    if (!quote) {
        const platformFeeMinor = calculation.financials.platform.commissionMinor || 0;
        const platformGstMinor = calculation.financials.platform.gstMinor || 0;
        quote = await FinancialEngine.createQuote({
            quoteType: "FINANCIAL",
            contextType: "ENQUIRY",
            contextId: String(enquiry._id),
            bookingId: enquiry.bookingId || null,
            inquiryId: enquiry._id,
            version,
            quoteRef,
            status: "SENT",
            userId: enquiry.claimedBy || null,
            agencyId: enquiry.agencyId || null,
            tourId: BookingQuote.db.base.Types.ObjectId.isValid(context.source?.tourId)
                ? context.source.tourId
                : null,
            createdBy: actorId(actor),
            sentAt: new Date(),
            expirationDate: new Date(`${data.terms.validUntil}T23:59:59.999Z`),
            currency: calculation.pricing.currency,
            basePrice: asMajor(input.baseAmountMinor),
            platformFee: asMajor(platformFeeMinor),
            taxes: asMajor(platformGstMinor),
            finalAmount: asMajor(calculation.pricing.finalPayableMinor),
            items: input.lines.map((line) => ({
                code: line.code,
                label: line.label,
                description: line.description,
                pricingType: line.pricingType,
                detailRows: line.detailRows || [],
                unitAmount: asMajor(line.unitAmountMinor),
                quantity: line.quantity,
                amount: asMajor(line.amountMinor),
                currency: calculation.pricing.currency,
                category: String(line.category || "OTHER").toLowerCase(),
                selected: true,
            })),
            notes: data.terms.notes || "",
            terms: `${paymentPlanText(data.terms.paymentSchedule)}\n\n${cancellationPolicyText(data.terms.cancellationTiers, data.terms.policyNotes)}`,
            ...snapshots,
            idempotencyKey,
            pricingSnapshot: calculation.pricing,
            configSnapshot: calculation.config,
            financialSnapshot: calculation.financials,
            documentSnapshot,
        });
    }
    enquiry.status = "quote_sent";
    await enquiry.save();
    let delivery = { emailStatus: "NOT_SENT", emailSentAt: null };
    const customerEmail = String(enquiry.fields?.email || "").trim();
    if (customerEmail) {
        try {
            const attachment = pdfBuffer || (await readQuoteDocument(document));
            if (!attachment)
                throw new Error("The generated quotation PDF could not be read for delivery.");
            const mail = await sendTransactionalEmail({
                to: customerEmail,
                subject: `${quoteRef} · Your TravelsTREM quotation is ready`,
                text: `Hello ${enquiry.fields?.name || "Traveller"},\n\nYour quotation ${quoteRef} for ${data.details.title} is ready. The PDF is attached. You can also review and respond from My Bookings.`,
                html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172033"><h2 style="color:#173b8f">Your quotation is ready</h2><p>Hello ${escapeHtml(enquiry.fields?.name || "Traveller")},</p><p>Your travel specialist has prepared <strong>${escapeHtml(data.details.title)}</strong>.</p><p>The quotation PDF is attached. Open <strong>My Bookings</strong> to accept, reject, request changes, or cancel.</p><p style="color:#667085">Reference: ${escapeHtml(quoteRef)}</p></div>`,
                attachments: [{ filename: `${quoteRef}.pdf`, content: attachment, contentType: "application/pdf" }],
            });
            delivery = {
                emailStatus: mail.success ? "SENT" : "FAILED",
                emailSentAt: mail.success ? new Date().toISOString() : null,
                emailError: mail.success ? "" : mail.message,
            };
        } catch (error) {
            delivery = { emailStatus: "FAILED", emailSentAt: null, emailError: error?.message || "Email delivery failed." };
        }
    } else {
        delivery = {
            emailStatus: "FAILED",
            emailSentAt: null,
            emailError: "The enquiry does not have a customer email address.",
        };
    }
    try {
        const realtimeData = bookingQuoteDto(quote);
        const enquiryRealtimeData = enquiryDto(enquiry);
        const audience = {
            userId: enquiry.claimedBy || quote.userId,
            agencyId: enquiry.agencyId || quote.agencyId,
        };
        await Promise.all([
            publishFanOut(audience, REALTIME_EVENTS.BOOKING_QUOTE_UPDATED, realtimeData),
            publishFanOut(audience, REALTIME_EVENTS.ENQUIRY_UPDATED, enquiryRealtimeData),
        ]);
        if (!enquiry.agencyId && enquiry.ownerAgent) {
            const ownerAudience = { userId: enquiry.ownerAgent, includeAdmins: false };
            await Promise.all([
                publishFanOut(
                    ownerAudience,
                    REALTIME_EVENTS.BOOKING_QUOTE_UPDATED,
                    realtimeData,
                ),
                publishFanOut(
                    ownerAudience,
                    REALTIME_EVENTS.ENQUIRY_UPDATED,
                    enquiryRealtimeData,
                ),
            ]);
        }
    } catch (error) {
        console.error("[QuoteBuilder] quote delivery realtime publish failed:", error?.message || error);
    }
    return { quote, document, delivery };
}

export async function updateCustomerQuoteDecision({ enquiryId, quoteId, actor, action, notes }) {
    const userId = actorId(actor);
    if (!userId) throw Object.assign(new Error("Please sign in to respond to this quote."), { status: 401 });
    let booking = await findBookingRecord(enquiryId);
    const sourceEnquiryId = booking?.sourceEnquiryId || enquiryId;
    const enquiry = await ContactLead.findOne({ _id: sourceEnquiryId, claimedBy: userId });
    if (!enquiry) throw Object.assign(new Error("Enquiry not found."), { status: 404 });
    if (!booking && enquiry.bookingId) booking = await Booking.findById(enquiry.bookingId);
    const quote = await BookingQuote.findOne({
        _id: quoteId,
        $or: [
            { inquiryId: enquiry._id },
            { bookingId: booking?._id || enquiry._id },
            { contextType: "ENQUIRY", contextId: String(enquiry._id) },
        ],
    });
    if (!quote) throw Object.assign(new Error("Quote not found."), { status: 404 });
    const decision = resolveCustomerQuoteDecision({
        status: quote.status,
        action,
        notes,
        hasChangeRequest: Boolean(quote.changeRequest?.requestedAt),
    });
    const now = new Date();
    quote.status = decision.quoteStatus;
    if (decision.action === "ACCEPT") {
        quote.acceptedAt = now;
        quote.rejectedAt = null;
        quote.changeRequest = null;
        booking = await ensureBookingFromAcceptedQuote(enquiry, quote);
        quote.bookingId = booking._id;
        quote.inquiryId = enquiry._id;
        enquiry.bookingId = booking._id;
    } else if (decision.action === "REJECT") {
        quote.rejectedAt = now;
        quote.acceptedAt = null;
    } else if (decision.action === "REQUEST_CHANGES") {
        quote.changeRequest = { notes: decision.notes, requestedAt: now };
        quote.acceptedAt = null;
        quote.rejectedAt = null;
    } else if (decision.action === "CANCEL") {
        quote.cancelledAt = now;
        if (booking) booking.status = BOOKING_STATUS.CANCELLED;
    }
    enquiry.status = decision.enquiryStatus;
    await Promise.all([quote.save(), enquiry.save(), ...(booking ? [booking.save()] : [])]);
    if (booking) await linkEnquiryArtifactsToBooking(enquiry, booking);
    try {
        const realtimeData = bookingQuoteDto(quote);
        publishFanOut(
            { userId: quote.userId || enquiry.claimedBy, agencyId: quote.agencyId || enquiry.agencyId },
            REALTIME_EVENTS.BOOKING_QUOTE_UPDATED,
            realtimeData,
        );
        if (!enquiry.agencyId && enquiry.ownerAgent)
            publishFanOut(
                { userId: enquiry.ownerAgent, includeAdmins: false },
                REALTIME_EVENTS.BOOKING_QUOTE_UPDATED,
                realtimeData,
            );
    } catch (error) {
        console.error("[QuoteBuilder] quote decision realtime publish failed:", error?.message || error);
    }
    return { quote, enquiry, booking };
}

export async function saveCustomerTravellerDetails({ enquiryId, actor, values }) {
    const userId = actorId(actor);
    if (!userId) throw Object.assign(new Error("Please sign in to add traveller details."), { status: 401 });
    let booking = await findBookingRecord(enquiryId);
    const sourceEnquiryId = booking?.sourceEnquiryId || enquiryId;
    const enquiry = await ContactLead.findOne({ _id: sourceEnquiryId, claimedBy: userId });
    if (!enquiry) throw Object.assign(new Error("Enquiry not found."), { status: 404 });
    if (!booking && enquiry.bookingId) booking = await Booking.findById(enquiry.bookingId);
    const quote = await BookingQuote.findOne({
        status: "ACCEPTED",
        $or: [
            { inquiryId: enquiry._id },
            { bookingId: booking?._id || enquiry._id },
            { contextType: "ENQUIRY", contextId: String(enquiry._id) },
        ],
    }).sort({ version: -1, createdAt: -1 });
    if (!quote) throw Object.assign(new Error("Accept the quotation before adding traveller details."), { status: 409 });
    const count = Math.max(1, Number(enquiry.fields?.travellerCount || enquiry.customizationSnapshot?.travellers || 1));
    const requiresPassport = enquiry.fields?.flightPreference === "with_flights"
        || enquiry.customizationSnapshot?.flightRequest === "ADD"
        || quote.items?.some((item) => String(item.category || "").toUpperCase() === "FLIGHT");
    const validated = validateTravellerDetails({ count, requiresPassport, values });
    if (!validated.valid) return { status: 422, errors: validated.errors, enquiry };
    enquiry.travellerDetails = {
        values: validated.data,
        count,
        requiresPassport,
        completedAt: new Date(),
        updatedAt: new Date(),
    };
    enquiry.markModified("travellerDetails");
    if (booking) {
        booking.travellerDetails = enquiry.travellerDetails;
        booking.markModified("travellerDetails");
    }
    await Promise.all([enquiry.save(), ...(booking ? [booking.save()] : [])]);
    try {
        const realtimeData = bookingQuoteDto(quote);
        publishFanOut(
            { userId: quote.userId || enquiry.claimedBy, agencyId: quote.agencyId || enquiry.agencyId },
            REALTIME_EVENTS.BOOKING_QUOTE_UPDATED,
            realtimeData,
        );
        if (!enquiry.agencyId && enquiry.ownerAgent)
            publishFanOut(
                { userId: enquiry.ownerAgent, includeAdmins: false },
                REALTIME_EVENTS.BOOKING_QUOTE_UPDATED,
                realtimeData,
            );
    } catch (error) {
        console.error("[QuoteBuilder] traveller details realtime publish failed:", error?.message || error);
    }
    return { status: 200, errors: {}, enquiry, booking };
}

export const quoteBuilderService = createQuoteBuilderService({
    findAuthorizedEnquiry,
    loadQuoteContext,
    saveProcess,
    calculateQuote: (input) => FinancialEngine.calculateQuote(input),
    finalizeQuote,
    previewQuoteDocument,
});

export default quoteBuilderService;
