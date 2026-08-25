// modules/forms/controller.js
import ContactLeadRepository from "../repositories/ContactLeadRepository.js";
import Tour from "../../tours/models/Tour.js";
import User from "../../auth/models/User.js";
import { sendTransactionalEmail } from "../../../services/email.service.js";
import pageDefinitionService from "../../../services/pageDefinitionService.js";
import config from "../../../config/env.js";
import TrevioTrip from "../../trevio/models/TrevioTrip.js";
import TourDeparture from "../../tours/models/TourDeparture.js";
import masterDataService from "../../masterData/services/masterDataService.js";
import { normalizeMongoId, resolveDepartureOption } from "../services/departureOptionService.js";
import { enquiryView, formatDate } from "../mappers/enquiryView.js";
import FinancialEngine from "../../../core/financial-engine/index.js";
import { getPortalScope } from "../../../core/auth/portalSession.js";
import {
    REALTIME_EVENTS,
    enquiryDto,
    publishToAgency,
    publishToAdmins,
    publishToUser,
    realtimeNotify,
} from "../../../realtime/index.js";
import { recordTourSignal } from "../../tours/services/tourIntelligence.service.js";
import { upsertAgencyCustomerFromLead } from "../../tenancy/customerDirectory.service.js";

const escapeHtml = (value) =>
    String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

/**
 * All form endpoints respond through here so clients receive backend-
 * authored UI directives (message type, auto-close timing) alongside the
 * payload — frontends render, they never decide behavior or copy.
 */
const sendJson = (res, httpStatus, body) =>
    res.status(httpStatus).json({
        ...body,
        ui: {
            messageType:
                body?.ui?.messageType || (body?.status === "success" ? "success" : "error"),
            ...(body?.ui && body.ui.closeAfterMs !== undefined
                ? { closeAfterMs: body.ui.closeAfterMs }
                : {}),
        },
    });

const formatMinorMoney = (amountMinor, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(Number(amountMinor || 0) / 100);

const toIsoDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : "";
};

const makeDateRangeOption = (start, end = null) => {
    const startValue = toIsoDate(start);
    const endValue = toIsoDate(end);
    if (!startValue) return null;
    return {
        value: endValue ? `${startValue}|${endValue}` : startValue,
        label: endValue ? `${formatDate(start)} – ${formatDate(end)}` : formatDate(start),
    };
};

const getTourFormContext = async (tour, product) => {
    const options = [];
    if (product === "trevista" && tour?._id) {
        const departures = await TourDeparture.find({
            tourId: tour._id,
            status: { $in: ["scheduled", "active"] },
        })
            .sort({ departureDate: 1 })
            .select("departureDate returnDate")
            .lean();
        departures.forEach((departure) => {
            const option = makeDateRangeOption(departure.departureDate, departure.returnDate);
            if (option) options.push(option);
        });
    } else {
        (tour?.dates || []).forEach((storedDate) => {
            const raw = String(storedDate || "").trim();
            if (raw) options.push({ value: raw, label: raw });
        });
    }

    if (!options.length) {
        const fallbackRange = makeDateRangeOption(tour?.startDate, tour?.endDate);
        if (fallbackRange) options.push(fallbackRange);
    }

    const uniqueOptions = [...new Map(options.map((option) => [option.value, option])).values()];
    const inclusions = (tour?.inclusions || []).join(" ");
    const exclusions = (tour?.exclusions || []).join(" ");
    const includesFlights =
        product === "trevista"
            ? Boolean(tour?.flights?.included)
            : /\bflights?\b/i.test(inclusions) && !/\bflights?\b/i.test(exclusions);

    const packageOptions =
        tour?.commercial?.version === "COMPONENTS_V1"
            ? (tour.commercial.packages || [])
                  .filter((item) => item?.enabled !== false)
                  .map((item) => ({
                      value: String(item.packageKey || ""),
                      label: String(item.name || item.tier || "Package"),
                  }))
                  .filter((item) => item.value)
            : [];
    const hotelRoomOptions = (tour?.hotelOptions || [])
        .filter((option) => option?.active !== false)
        .flatMap((option, optionIndex) => {
            const optionKey = String(option.optionKey || option._id || `hotel-${optionIndex + 1}`);
            const rooms = (option.rooms || []).filter((room) => room?.available !== false);
            if (!rooms.length)
                return [
                    {
                        value: `${optionKey}|`,
                        label: String(option.title || option.propertyName || "Hotel option"),
                    },
                ];
            return rooms.map((room, roomIndex) => ({
                value: `${optionKey}|${String(room.roomKey || room._id || `room-${roomIndex + 1}`)}`,
                label: [option.propertyName || option.title, room.name].filter(Boolean).join(" — "),
            }));
        });

    return {
        departureOptions: uniqueOptions,
        flightPreference: includesFlights ? "with_flights" : "without_flights",
        packageType: String(tour?.packageType || "fixed_departure"),
        packageOptions,
        hotelRoomOptions,
        allowCustomization:
            tour?.packageType === "custom" &&
            tour?.customConfig?.allowCustomerCustomization === true,
        customizationQuestions:
            tour?.packageType === "custom" &&
            tour?.customConfig?.allowCustomerCustomization === true
                ? (tour.customConfig.questionnaireFields || [])
                      .map(String)
                      .map((label) => label.trim())
                      .filter(Boolean)
                      .slice(0, 20)
                : [],
    };
};

export const getForm = async (req, res) => {
    try {
        const { form, tourId, product: requestedProduct } = req.query;

        // Only supporting contact-agent for now
        if (form !== "contact-agent") {
            return sendJson(res, 400, {
                status: "error",
                message: "Unknown form requested",
            });
        }

        // try fetch tour details if tourId provided (optional)
        let tour = null;
        let product = requestedProduct === "trevio" ? "trevio" : "trevista";
        if (tourId) {
            try {
                if (Tour) {
                    tour = await Tour.findById(tourId)
                        .populate("agencyId", "agencyName logo partnerAgencyRef")
                        .populate("ownerAgent", "name email agentRef")
                        .lean();
                }
                if (!tour)
                    tour = await TrevioTrip.findById(tourId)
                        .populate("agencyId", "agencyName logo partnerAgencyRef")
                        .populate("ownerAgent", "name email agentRef")
                        .lean();
                product = tour?.productKey === "trevio" ? "trevio" : "trevista";
            } catch (e) {
                // ignore and fall back to minimal tour object
                tour = null;
            }
        }

        const formContext = await getTourFormContext(tour, product);
        const serializedTour = tour ? JSON.parse(JSON.stringify(tour)) : null;
        const response = pageDefinitionService.buildWidgetResponse(
            "tours-remote/details",
            "./widgets/contact-agent-form.json",
            {
                injectData: serializedTour ? { tour: serializedTour } : {},
            },
        );
        response.component = await masterDataService.hydrateDataScope(response.component);
        if (!tour) {
            const labels = response.component?.elements?.labels || {};
            labels.contactAgent = "Tour enquiry";
            labels.contactAgentDescription =
                "Tell our TravelsTREM support team what you are looking for and we will help you plan the right tour.";
            labels.message = "What kind of tour are you looking for?";
            labels.messagePlaceholder =
                "Share destinations, dates, preferences, budget, or anything else that will help us plan your tour.";
            labels.sendRequest = "Send tour enquiry";
            const genericFields = response.component?.structure?.widgets?.[0]?.props?.fields || [];
            response.component.structure.widgets[0].props.fields = genericFields.filter(
                (field) =>
                    ![
                        "packageKey",
                        "hotelRoomKey",
                        "preferredTravelDate",
                        "preferredStartDate",
                        "preferredEndDate",
                        "customizationPreference",
                    ].includes(field.name),
            );
        }
        const fields = response.component?.structure?.widgets?.[0]?.props?.fields || [];
        fields.forEach((field) => {
            if (field.name === "preferredTravelDate") {
                field.options = formContext.departureOptions;
                field.required = formContext.departureOptions.length > 0;
            }
            if (field.name === "flightPreference") field.value = formContext.flightPreference;
            if (field.name === "packageKey") {
                field.options = formContext.packageOptions;
                field.required = formContext.packageOptions.length > 0;
            }
            if (field.name === "hotelRoomKey") field.options = formContext.hotelRoomOptions;
        });
        if (tour) {
            const isFixed = formContext.packageType === "fixed_departure";
            response.component.structure.widgets[0].props.fields = fields.filter((field) => {
                if (field.name === "preferredTravelDate") return isFixed;
                if (["preferredStartDate", "preferredEndDate"].includes(field.name))
                    return !isFixed;
                if (field.name === "customizationPreference") return formContext.allowCustomization;
                if (field.name === "packageKey") return formContext.packageOptions.length > 0;
                if (field.name === "hotelRoomKey") return formContext.hotelRoomOptions.length > 0;
                return true;
            });
            if (formContext.allowCustomization && formContext.customizationQuestions.length) {
                response.component.structure.widgets[0].props.fields.push(
                    ...formContext.customizationQuestions.map((label, index) => ({
                        name: `customQuestion_${index}`,
                        label,
                        type: "textarea",
                        required: false,
                        maxLength: 1000,
                        width: "full",
                        visibleWhen: { field: "customizationPreference", equals: "customize" },
                    })),
                );
            }
            if (formContext.allowCustomization) {
                response.component.structure.widgets[0].props.fields =
                    response.component.structure.widgets[0].props.fields.filter(
                        (field) => field.name !== "hotelRoomKey",
                    );
            }
        }
        return sendJson(res, 200, {
            ...response,
            message: "Contact form fetched",
        });
    } catch (err) {
        console.error("getForm error:", err);
        return sendJson(res, 500, {
            status: "error",
            message: "Failed to fetch form",
            error: err?.message,
        });
    }
};

export const submitForm = async (req, res) => {
    try {
        // Expect body: { tourId, tourTitle, url, fields: { name, email, phone }, createdAt? }
        const {
            tourId = null,
            tourTitle = null,
            url = null,
            product: requestedProduct = null,
            fields = {},
            hotelSelections: requestedHotelSelections = [],
            hotelRequests: requestedHotelRequests = [],
        } = req.body || {};

        const createdAt = req.body.createdAt ? new Date(req.body.createdAt) : undefined;
        const validatedCreatedAt =
            createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : undefined;

        const allowedFields = {};
        const knownKeys = [
            "name",
            "email",
            "phone",
            "message",
            "preferredContact",
            "travellerCount",
            "preferredTravelDate",
            "preferredStartDate",
            "preferredEndDate",
            "flightPreference",
            "packageKey",
            "hotelRoomKey",
            "customizationPreference",
        ];
        if (fields && typeof fields === "object") {
            for (const key of knownKeys) {
                if (fields[key] !== undefined && fields[key] !== null) {
                    allowedFields[key] = String(fields[key]).slice(0, 2000);
                }
            }
        }

        const requiredFields = [
            "name",
            "email",
            "phone",
            "message",
            "preferredContact",
            "travellerCount",
            "flightPreference",
        ];
        const missingField = requiredFields.find((key) => !String(allowedFields[key] || "").trim());
        if (missingField)
            return sendJson(res, 400, {
                status: "error",
                message: `Please provide ${missingField}.`,
            });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(allowedFields.email))
            return sendJson(res, 400, {
                status: "error",
                message: "Please provide a valid email address.",
            });
        if (!/^\+?[0-9][0-9\s-]{6,18}$/.test(allowedFields.phone))
            return sendJson(res, 400, {
                status: "error",
                message: "Please provide a valid phone number.",
            });
        const travellerCount = Number(allowedFields.travellerCount);
        if (!Number.isInteger(travellerCount) || travellerCount < 1 || travellerCount > 50)
            return sendJson(res, 400, {
                status: "error",
                message: "Traveller count must be between 1 and 50.",
            });
        if (!["with_flights", "without_flights"].includes(allowedFields.flightPreference))
            return sendJson(res, 400, {
                status: "error",
                message: "Please select whether your quote should include flights.",
            });

        const normalizedTourId = normalizeMongoId(tourId);
        const tour =
            normalizedTourId && Tour.db.base.Types.ObjectId.isValid(normalizedTourId)
                ? (await Tour.findById(normalizedTourId).lean()) ||
                  (await TrevioTrip.findById(normalizedTourId).lean())
                : null;
        const agentId = tour?.ownerAgent || tour?.createdBy || null;
        const agent = agentId
            ? await User.findById(agentId).select("name email phone phoneNumber mobile").lean()
            : null;
        const requestedProductKey = String(requestedProduct || "").toLowerCase();
        const product = tour
            ? tour.productKey === "trevio"
                ? "trevio"
                : "trevista"
            : ["trevio", "trevista"].includes(requestedProductKey)
              ? requestedProductKey
              : "trevista";
        const formContext = await getTourFormContext(tour, product);
        const selectedPackage =
            formContext.packageOptions.find((item) => item.value === allowedFields.packageKey) ||
            null;
        if (formContext.packageOptions.length && !selectedPackage) {
            return sendJson(res, 400, {
                status: "error",
                message: "Please select an available tour package.",
            });
        }
        const selectedHotelRoom = allowedFields.hotelRoomKey
            ? formContext.hotelRoomOptions.find(
                  (item) => item.value === allowedFields.hotelRoomKey,
              ) || null
            : null;
        if (allowedFields.hotelRoomKey && !selectedHotelRoom) {
            return sendJson(res, 400, {
                status: "error",
                message: "That hotel or room is no longer available.",
            });
        }
        const hotelSelections = Array.isArray(requestedHotelSelections)
            ? requestedHotelSelections
                  .slice(0, 20)
                  .map((item) => ({
                      stayKey: String(item?.stayKey || "").slice(0, 100),
                      hotelOptionKey: String(item?.hotelOptionKey || "").slice(0, 100),
                      roomOptionKey: String(item?.roomOptionKey || "").slice(0, 100),
                  }))
                  .filter((item) => item.stayKey && item.hotelOptionKey)
            : [];
        if (
            allowedFields.customizationPreference &&
            !["package", "customize"].includes(allowedFields.customizationPreference)
        ) {
            return sendJson(res, 400, {
                status: "error",
                message: "Please choose a valid tour preference.",
            });
        }
        if (
            allowedFields.customizationPreference === "customize" &&
            !formContext.allowCustomization
        ) {
            return sendJson(res, 400, {
                status: "error",
                message: "This tour is not available for full customisation.",
            });
        }
        const departureOptions = formContext.departureOptions;
        if (
            formContext.packageType === "fixed_departure" &&
            departureOptions.length &&
            !allowedFields.preferredTravelDate
        ) {
            return sendJson(res, 400, {
                status: "error",
                message: "Please select an available departure.",
            });
        }
        const selectedDeparture = resolveDepartureOption(
            departureOptions,
            allowedFields.preferredTravelDate,
        );
        if (allowedFields.preferredTravelDate && !selectedDeparture) {
            return sendJson(res, 400, {
                status: "error",
                message: "That departure is no longer available. Please select another option.",
            });
        }
        if (selectedDeparture) allowedFields.preferredTravelDate = selectedDeparture.value;
        if (formContext.packageType !== "fixed_departure") {
            const start = toIsoDate(allowedFields.preferredStartDate);
            const end = toIsoDate(allowedFields.preferredEndDate);
            if (!start || !end)
                return sendJson(res, 400, {
                    status: "error",
                    message: "Please provide suitable travel dates.",
                });
            if (end < start)
                return sendJson(res, 400, {
                    status: "error",
                    message: "The end date must be after the start date.",
                });
            const earliest = toIsoDate(tour?.flexibleConfig?.earliestDeparture);
            const latest = toIsoDate(tour?.flexibleConfig?.latestReturn);
            if ((earliest && start < earliest) || (latest && end > latest))
                return sendJson(res, 400, {
                    status: "error",
                    message: "Those dates are outside this tour's available travel window.",
                });
            allowedFields.preferredStartDate = start;
            allowedFields.preferredEndDate = end;
        }
        const selectedDepartureLabel =
            selectedDeparture?.label ||
            [allowedFields.preferredStartDate, allowedFields.preferredEndDate]
                .filter(Boolean)
                .join(" – ") ||
            "Flexible";
        const customizationAnswers =
            formContext.allowCustomization && allowedFields.customizationPreference === "customize"
                ? Object.fromEntries(
                      formContext.customizationQuestions
                          .map((question, index) => [
                              question,
                              String(fields?.[`customQuestion_${index}`] || "")
                                  .trim()
                                  .slice(0, 1000),
                          ])
                          .filter(([, answer]) => answer),
                  )
                : {};
        const [hotelOptionKey = "", roomOptionKey = ""] = String(
            selectedHotelRoom?.value || "",
        ).split("|");
        const customizationSnapshot =
            tour?.commercial?.version === "COMPONENTS_V1" && selectedPackage
                ? FinancialEngine.calculateTourCustomizationPreview({
                      tour,
                      packageKey: selectedPackage.value,
                      hotelSelections,
                      hotelRequests: requestedHotelRequests,
                      hotelOptionKey,
                      roomOptionKey,
                      travellerCount,
                  })
                : null;
        const agentSnapshot = agent
            ? {
                  name: agent.name || "Your travel specialist",
                  email: agent.email || "",
                  phone: agent.phone || agent.phoneNumber || agent.mobile || "",
              }
            : {};

        const newLead = ContactLeadRepository.create({
            form: "contact-agent",
            fields: allowedFields,
            tourId: normalizedTourId.slice(0, 100) || null,
            tourTitle: String(tourTitle || "").slice(0, 500) || null,
            product,
            ownerAgent: agentId,
            agencyId: tour?.agencyId || null,
            agentSnapshot,
            selection: {
                packageKey: selectedPackage?.value || "",
                packageName: selectedPackage?.label || "",
                hotelRoomKey: selectedHotelRoom?.value || "",
                hotelRoomName: selectedHotelRoom?.label || "",
                hotelSelections: (customizationSnapshot?.hotels || []).map((item) => ({
                    stayKey: item.stayKey,
                    location: item.location,
                    hotelOptionKey: item.optionKey,
                    hotelName: item.optionName,
                    roomOptionKey: item.roomKey,
                    roomName: item.roomName,
                })),
                hotelRequests: customizationSnapshot?.hotelRequests || [],
                customizationPreference:
                    customizationSnapshot?.quoteMode === "CUSTOMIZED"
                        ? "customize"
                        : allowedFields.customizationPreference || "package",
            },
            customizationSnapshot,
            customizationAnswers,
            claimedBy: req.user?.sub || req.user?.id || req.user?._id || null,
            url: String(url || "").slice(0, 2000) || null,
            createdAt: validatedCreatedAt,
        });

        const savedLead = await newLead.save();
        savedLead.enquiryRef = `ENQ-${String(savedLead._id).slice(-6).toUpperCase()}`;
        await savedLead.save();
        await upsertAgencyCustomerFromLead({ lead: savedLead }).catch((error) =>
            console.error("[CustomerDirectory] enquiry sync failed:", error.message),
        );
        if (product === "trevista" && normalizedTourId) {
            recordTourSignal(normalizedTourId, "enquiry").catch((error) =>
                console.error("[TourIntelligence] enquiry signal failed:", error.message),
            );
        }

        // Backend-authored toast copy, one flavor per audience. The same
        // dedupeKey on the HTTP notify and any socket echo lets clients
        // collapse the duplicate toast on the submitting tab.
        const creatorNotify = realtimeNotify(
            "Enquiry received",
            `${tourTitle ? `${tourTitle} — ` : ""}Your enquiry ID is ${savedLead.enquiryRef}. Save it to track this trip.`,
            "success",
            `enquiry:${savedLead.enquiryRef}`,
        );
        const agencyNotify = realtimeNotify(
            "New enquiry for your agency",
            `${savedLead.enquiryRef}${tourTitle ? ` · ${tourTitle}` : ""} is waiting for a response.`,
            "info",
            `enquiry:${savedLead.enquiryRef}`,
        );
        const adminNotify = realtimeNotify(
            "New platform enquiry",
            `${savedLead.enquiryRef}${tourTitle ? ` · ${tourTitle}` : ""} needs triage by operations.`,
            "info",
            `enquiry:${savedLead.enquiryRef}`,
        );

        // Identity-room pushes. The enquiring user gets a SILENT socket
        // event (no notify): their other tabs/devices refresh the list, but
        // no toast races ahead of this tab's own HTTP response. Only
        // audiences WITHOUT an HTTP response receive toast copy.
        try {
            const dto = enquiryDto(savedLead);
            if (savedLead.claimedBy) {
                await publishToUser(savedLead.claimedBy, REALTIME_EVENTS.ENQUIRY_CREATED, dto);
            }
            if (savedLead.agencyId) {
                await publishToAgency(savedLead.agencyId, REALTIME_EVENTS.ENQUIRY_CREATED, dto, {
                    notify: agencyNotify,
                });
            }
            await publishToAdmins(REALTIME_EVENTS.ENQUIRY_CREATED, dto, { notify: adminNotify });
        } catch (realtimeErr) {
            console.error(
                "[Forms] realtime enquiry publish failed:",
                realtimeErr?.message || realtimeErr,
            );
        }

        // Gmail is the only delivery channel for enquiries. Notify both the
        // tour owner and the configured business contact. Delivery is best-effort
        // and must not delay the HTTP acknowledgement after the enquiry is saved.
        void (async () => {
            try {
            const recipients = new Set();
            if (config.ENQUIRY_EMAIL) recipients.add(config.ENQUIRY_EMAIL);
            if (agent?.email) recipients.add(agent.email);

            if (!recipients.size) {
                console.error(
                    "Enquiry email notification skipped: ENQUIRY_EMAIL or SUPPORT_EMAIL is not configured",
                );
            } else {
                const customerName = allowedFields.name || "Customer";
                const customerEmail = allowedFields.email || "Not provided";
                const customerPhone = allowedFields.phone || "Not provided";
                const customerMessage = allowedFields.message || "No additional message";
                const preferredContact = allowedFields.preferredContact || "Not provided";
                const travellerSummary = allowedFields.travellerCount || "Not provided";
                const preferredTravelDate = selectedDepartureLabel;
                const flightPreference =
                    allowedFields.flightPreference === "with_flights"
                        ? "Quote with flights"
                        : "Quote without flights";
                const requestedTour = tourTitle || "General tour enquiry";
                const enquiryUrl = url || "Not provided";
                const packageSummary = selectedPackage?.label || "To be discussed";
                const hotelSummary = customizationSnapshot?.hotels?.length
                    ? customizationSnapshot.hotels
                          .map(
                              (item) =>
                                  `${item.location || item.stayKey}: ${item.optionName}${item.roomName ? ` — ${item.roomName}` : ""}`,
                          )
                          .join("; ")
                    : selectedHotelRoom?.label || "Included package stays";
                const hotelRequestSummary = customizationSnapshot?.hotelRequests?.length
                    ? customizationSnapshot.hotelRequests
                          .map(
                              (item) =>
                                  `${item.location || item.stayKey}: ${[item.propertyClass, item.roomType].filter(Boolean).join(" · ") || "Agent recommendation"}${item.requirements ? ` — ${item.requirements}` : ""}`,
                          )
                          .join("; ")
                    : "None";
                const quoteMode =
                    customizationSnapshot?.quoteMode === "CUSTOMIZED"
                        ? "Customized package"
                        : "Package";
                const priceSummary =
                    customizationSnapshot?.customized?.totalMinor != null
                        ? `${formatMinorMoney(customizationSnapshot.customized.perPersonMinor, customizationSnapshot.currency)} per person · ${formatMinorMoney(customizationSnapshot.customized.totalMinor, customizationSnapshot.currency)} total`
                        : "Agent confirmation required";
                const alternativeSummary = customizationSnapshot?.recommendedAlternative
                    ? `${customizationSnapshot.recommendedAlternative.packageName}: ${formatMinorMoney(customizationSnapshot.recommendedAlternative.perPersonMinor, customizationSnapshot.currency)} per person · ${formatMinorMoney(customizationSnapshot.recommendedAlternative.totalMinor, customizationSnapshot.currency)} total`
                    : "None";
                const emailResult = await sendTransactionalEmail({
                    to: [...recipients],
                    replyTo: allowedFields.email || undefined,
                    subject: `New TravelsTREM enquiry: ${requestedTour}`,
                    text: `New customer enquiry\n\nName: ${customerName}\nEmail: ${customerEmail}\nPhone: ${customerPhone}\nPreferred contact: ${preferredContact}\nTravellers: ${travellerSummary}\nDeparture: ${preferredTravelDate}\nPackage: ${packageSummary}\nHotel / room: ${hotelSummary}\nRequested hotel preferences: ${hotelRequestSummary}\nRequest type: ${quoteMode}\nCalculated price: ${priceSummary}\nPackage alternative: ${alternativeSummary}\nQuote type: ${flightPreference}\nTour: ${requestedTour}\nRequest: ${customerMessage}\nPage: ${enquiryUrl}`,
                    html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172033"><h2 style="color:#173b8f">New customer enquiry</h2><p>A customer has requested help from TravelsTREM.</p><table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="padding:8px 0;font-weight:700">Name</td><td>${escapeHtml(customerName)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Email</td><td>${escapeHtml(customerEmail)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Phone</td><td>${escapeHtml(customerPhone)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Preferred contact</td><td>${escapeHtml(preferredContact)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Travellers</td><td>${escapeHtml(travellerSummary)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Departure</td><td>${escapeHtml(preferredTravelDate)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Package</td><td>${escapeHtml(packageSummary)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Hotel / room</td><td>${escapeHtml(hotelSummary)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Request type</td><td>${escapeHtml(quoteMode)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Calculated price</td><td>${escapeHtml(priceSummary)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Package alternative</td><td>${escapeHtml(alternativeSummary)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Quote type</td><td>${escapeHtml(flightPreference)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Tour</td><td>${escapeHtml(requestedTour)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Request</td><td>${escapeHtml(customerMessage)}</td></tr><tr><td style="padding:8px 0;font-weight:700">Page</td><td>${escapeHtml(enquiryUrl)}</td></tr></table><p style="margin-top:24px;color:#667085">Reply to this email to contact the customer directly.</p></div>`,
                });
                if (emailResult.success) {
                    savedLead.notified = true;
                    await savedLead.save();
                } else {
                    console.error(
                        "Enquiry email notification failed:",
                        emailResult.message,
                        emailResult.code || "",
                    );
                }
            }

            const specialist =
                agentSnapshot.name || `${config.COMPANY_NAME || "TravelsTREM"} support team`;
            const contactLines = [agentSnapshot.email, agentSnapshot.phone]
                .filter(Boolean)
                .join(" · ");
            const customerDeparture = selectedDepartureLabel;
            const customerQuoteType =
                allowedFields.flightPreference === "with_flights"
                    ? "Quote with flights"
                    : "Quote without flights";
            await sendTransactionalEmail({
                to: allowedFields.email,
                subject: `We received your enquiry${tourTitle ? ` for ${tourTitle}` : ""}`,
                text: `Hi ${allowedFields.name},\n\nYour enquiry has been sent to ${specialist}. Your TravelsTREM enquiry ID is ${savedLead.enquiryRef}.\n\n${tourTitle ? `Trip: ${tourTitle}\n` : ""}Departure: ${customerDeparture}\nQuote type: ${customerQuoteType}\n${contactLines ? `Your travel specialist: ${specialist} (${contactLines})\n` : ""}${req.body.isAuthenticated ? "" : `\nSign in to TravelsTREM to track this enquiry and future bookings. After signing in, enter ${savedLead.enquiryRef} on My Bookings to add it to your account.\n`}\nThank you,\n${config.COMPANY_NAME}`,
                html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172033"><h2 style="color:#173b8f">Your enquiry is on its way</h2><p>Hi ${escapeHtml(allowedFields.name)},</p><p>Your enquiry has been sent to <strong>${escapeHtml(specialist)}</strong>.</p><p><strong>Your TravelsTREM enquiry ID:</strong> ${escapeHtml(savedLead.enquiryRef)}</p>${tourTitle ? `<p><strong>Trip:</strong> ${escapeHtml(tourTitle)}</p>` : ""}<p><strong>Departure:</strong> ${escapeHtml(customerDeparture)}<br/><strong>Quote type:</strong> ${escapeHtml(customerQuoteType)}</p>${contactLines ? `<p><strong>Your travel specialist:</strong> ${escapeHtml(specialist)}<br/>${escapeHtml(contactLines)}</p>` : ""}${req.body.isAuthenticated ? "" : `<p><a href="${escapeHtml(config.SHELL_URL)}">Sign in to TravelsTREM</a> to track this enquiry and future bookings. Once signed in, enter this enquiry ID on <strong>My Bookings</strong> to add it to your account.</p>`}<p>Thank you,<br/>${escapeHtml(config.COMPANY_NAME)}</p></div>`,
            });
            } catch (emailErr) {
                console.error("Enquiry email notification failed:", emailErr?.message || emailErr);
            }
        })();

        // respond with your JSON contract & componentData
        const response = pageDefinitionService.buildWidgetResponse(
            "tours-remote/details",
            "./widgets/contact-agent-form.json",
            {
                injectData: {
                    lead: {
                        id: savedLead._id,
                        enquiryRef: savedLead.enquiryRef,
                        fields: savedLead.fields,
                        tourId: savedLead.tourId,
                        tourTitle: savedLead.tourTitle,
                        url: savedLead.url,
                        createdAt: savedLead.createdAt,
                        notified: Boolean(savedLead.notified),
                        agent: savedLead.agentSnapshot,
                    },
                },
            },
        );
        response.notify = creatorNotify;
        response.component = await masterDataService.hydrateDataScope(response.component);
        return sendJson(res, 200, {
            status: "success",
            message: "Request submitted successfully",
            ...response,
            ui: { closeAfterMs: 0 },
        });
    } catch (err) {
        console.error("submitForm error:", err);
        return sendJson(res, 500, {
            status: "error",
            message: "Failed to submit contact request",
            error: err?.message,
        });
    }
};

export const claimEnquiry = async (req, res) => {
    try {
        const enquiryRef = String(req.body?.enquiryRef || "")
            .trim()
            .toUpperCase();
        if (!/^ENQ-[A-F0-9]{6}$/.test(enquiryRef))
            return sendJson(res, 400, {
                status: "error",
                message: "Enter a valid TravelsTREM enquiry ID.",
            });
        const userId = req.user?.sub || req.user?.id || req.user?._id;
        if (!userId)
            return sendJson(res, 401, {
                status: "error",
                message: "Please sign in to add an enquiry.",
            });
        const lead = await ContactLeadRepository.findOne({ enquiryRef });
        if (!lead)
            return sendJson(res, 404, {
                status: "error",
                message: "That enquiry ID was not found.",
            });
        if (lead.claimedBy && String(lead.claimedBy) !== String(userId))
            return sendJson(res, 409, {
                status: "error",
                message: "This enquiry is already linked to another account.",
            });
        lead.claimedBy = userId;
        await lead.save();

        // Other tabs/devices refresh their list; the toast for THIS tab rides
        // the HTTP response below (same reasoning as enquiry creation).
        try {
            await publishToUser(userId, REALTIME_EVENTS.ENQUIRY_CLAIMED, enquiryDto(lead));
        } catch (realtimeErr) {
            console.error(
                "[Forms] realtime enquiry claim publish failed:",
                realtimeErr?.message || realtimeErr,
            );
        }

        return sendJson(res, 200, {
            status: "success",
            message: "Enquiry linked to your account.",
            notify: realtimeNotify(
                "Enquiry linked",
                `${enquiryRef} was added to My Bookings.`,
                "success",
            ),
            componentData: { data: { enquiryRef } },
        });
    } catch (err) {
        return sendJson(res, err?.status || 500, {
            status: "error",
            message: err?.message || "Could not add the enquiry.",
        });
    }
};

// Optional: admin endpoint to fetch leads
const OPERATOR_ROLES = new Set(["admin", "agent", "super_admin", "support", "operations"]);

const enquiryAccess = async (req) => {
    const userId = req.user?.sub || req.user?.id || req.user?._id;
    if (!userId)
        throw Object.assign(new Error("Please sign in to view enquiries."), { status: 401 });
    const portal = getPortalScope(req);
    const role = String(req.user?.role || "member").toLowerCase();
    if (portal === "customer" || !OPERATOR_ROLES.has(role)) {
        return {
            userId,
            perspective: "sent",
            query: { claimedBy: userId },
        };
    }

    const query = {};
    if (!(role === "admin" && req.user?.adminLevel === "master") && role !== "super_admin") {
        const viewer = await User.findById(userId).select("agencyId agencyRole").lean();
        if (viewer?.agencyRole === "partner_admin" && viewer.agencyId)
            query.agencyId = viewer.agencyId;
        else query.ownerAgent = userId;
    }
    return { userId, perspective: "received", query };
};

export const getLeads = async (req, res) => {
    try {
        const access = await enquiryAccess(req);
        const leads = await ContactLeadRepository.find(access.query)
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();

        return sendJson(res, 200, {
            status: "success",
            message: "Leads fetched",
            componentData: {
                title:
                    access.perspective === "sent"
                        ? "My bookings & enquiries"
                        : "Bookings & enquiries received",
                description:
                    access.perspective === "sent"
                        ? "Requests you have sent and bookings confirmed for your account."
                        : "Requests received from travellers and their confirmed bookings.",
                perspective: access.perspective,
                data: leads.map((lead) => enquiryView(lead, access.perspective)),
                structure: {},
                config: {},
            },
        });
    } catch (err) {
        console.error("getLeads error:", err);
        return sendJson(res, err?.status || 500, {
            status: "error",
            message: "Failed to fetch leads",
            componentData: {
                title: "Leads",
                description: "",
                data: [],
                structure: {},
                config: {},
            },
            error: err?.message,
        });
    }
};

export const getEnquiry = async (req, res) => {
    try {
        const access = await enquiryAccess(req);
        const identifier = String(req.params?.id || "").trim();
        if (!/^ENQ-/i.test(identifier) && !Tour.db.base.Types.ObjectId.isValid(identifier)) {
            return sendJson(res, 400, { status: "error", message: "Enter a valid enquiry ID." });
        }
        const identityQuery = /^ENQ-/i.test(identifier)
            ? { enquiryRef: identifier.toUpperCase() }
            : { _id: identifier };
        const lead = await ContactLeadRepository.findOne({
            ...access.query,
            ...identityQuery,
        }).lean();
        if (!lead) return sendJson(res, 404, { status: "error", message: "Enquiry not found." });
        return sendJson(res, 200, {
            status: "success",
            message: "Enquiry fetched",
            componentData: { data: enquiryView(lead, access.perspective) },
        });
    } catch (err) {
        return sendJson(res, err?.status || 500, {
            status: "error",
            message: err?.message || "Failed to fetch enquiry.",
        });
    }
};
