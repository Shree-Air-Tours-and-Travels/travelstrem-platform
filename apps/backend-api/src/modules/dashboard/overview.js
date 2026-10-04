import mongoose from "mongoose";
import Booking from "../bookings/models/Booking.js";
import FlightBooking from "../flights/models/FlightBooking.js";
import ContactLead from "../forms/models/ContactLead.js";
import Favorite from "../tours/models/Favorite.js";
import Tour from "../tours/models/Tour.js";
import Trip from "../trips/models/Trip.js";
import Notification from "../tenancy/models/Notification.js";
import SupportTicket from "../support/models/SupportTicket.js";
import { PaymentSession } from "../payments/models.js";
import { customerScopeQuery } from "../tenancy/customerScope.js";
import { bookingStatusDisplay, statusDisplay } from "../../constants/common.js";
import { minorToDecimal, sumMinor } from "../../core/financial-engine/utils/money.js";
import ApiError from "../../shared/errors/ApiError.js";

const serviceTypes = { tours: "tour", trips: "trip", hotels: "hotel", flights: "flight" };
const tones = { tours: "primary", trips: "success", hotels: "warning", flights: "info" };
const icons = { tours: "travelPackage", trips: "compass", hotels: "hotel", flights: "plane" };
const cancelled = ["CANCELLED", "CANCELED", "FAILED", "SUPPLIER_FAILED"];
const terminal = [...cancelled, "COMPLETED", "REFUNDED"];
const dateLabel = (date, context) =>
    date && Number.isFinite(new Date(date).getTime())
        ? new Intl.DateTimeFormat(context.locale, { dateStyle: "medium", timeZone: "UTC" }).format(
              new Date(date),
          )
        : "";
const money = (minor, currency, context) =>
    new Intl.NumberFormat(context.locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(Number(minorToDecimal(minor)));
const action = (href, label = "View all") => ({ href, label });
const panel = (title, items, href, emptyTitle, description) => ({
    title,
    items,
    action: action(href),
    emptyTitle,
    description,
});
const servicesFor = (navigation) =>
    navigation.filter((page) => page.parentId === "bookings" && serviceTypes[page.id]);

export function overviewManifest(context, navigation, user) {
    const enabled = new Set(navigation.map((page) => page.id));
    const services = servicesFor(navigation);
    const widgets = [];
    if (services.length)
        widgets.push(
            { id: "analytics", title: "Your travel in numbers", layout: "full" },
            { id: "services", title: "Your travel services", layout: "full" },
            { id: "upcoming", title: "Upcoming journeys" },
            { id: "bookings", title: "Recent bookings" },
            { id: "payments", title: "Recent payments" },
            { id: "enquiries", title: "Travel enquiries" },
        );
    for (const id of ["wishlist", "notifications", "support", "profile"]) {
        if (enabled.has(id))
            widgets.push({ id, title: navigation.find((page) => page.id === id).label });
    }
    return {
        title: "Overview",
        eyebrow: "YOUR TRAVEL, AT A GLANCE",
        greeting: user.name
            ? `Welcome back, ${user.name.split(" ")[0]}`
            : "Welcome to your travel dashboard",
        description: "Your journeys, spending and account updates, together in one place.",
        tenantLabel: context.tenantName,
        period: {
            label: "Insights period",
            value: "12",
            options: [
                { value: "6", label: "Last 6 months" },
                { value: "12", label: "Last 12 months" },
            ],
        },
        refreshLabel: "Refresh overview",
        loadingLabel: "Loading your travel overview",
        errorTitle: "This widget could not be loaded",
        retryLabel: "Try again",
        widgets: widgets.map((widget) => ({
            ...widget,
            endpoint: `/dashboard/overview/widgets/${widget.id}`,
        })),
    };
}

// Every query binds the authenticated owner, tenant and enrolled product/service pair.
function queries(context, navigation, ownerField = "userId") {
    const services = servicesFor(navigation).map((page) => page.id);
    const pairs = context.productDefinitions.flatMap((product) =>
        (product.services || [])
            .filter((service) => services.includes(service) && service !== "flights")
            .map((service) => ({ product: product.key, journeyType: serviceTypes[service] })),
    );
    const owner = new mongoose.Types.ObjectId(context.userId);
    return {
        booking: {
            $and: [
                customerScopeQuery(context),
                { [ownerField]: owner },
                pairs.length ? { $or: pairs } : { _id: null },
            ],
        },
        flight: {
            ...customerScopeQuery(context),
            userId: owner,
            ...(services.includes("flights") ? {} : { _id: null }),
        },
    };
}
const projection = (flight) => ({
    bookingRef: 1,
    sourceEnquiryId: 1,
    status: 1,
    paymentStatus: 1,
    createdAt: 1,
    title: flight
        ? {
              $concat: [
                  {
                      $ifNull: [
                          { $arrayElemAt: ["$segmentSnapshot.origin.iataCode", 0] },
                          "Flight",
                      ],
                  },
                  " → ",
                  {
                      $ifNull: [
                          { $arrayElemAt: ["$segmentSnapshot.destination.iataCode", -1] },
                          "destination",
                      ],
                  },
              ],
          }
        : "$tourTitle",
    service: flight ? { $literal: "flights" } : { $concat: ["$journeyType", "s"] },
    amountMinor: flight
        ? {
              $ifNull: [
                  "$priceSnapshot.financials.customer.payableMinor",
                  {
                      $cond: [
                          { $eq: ["$priceSnapshot.unit", "MINOR"] },
                          "$priceSnapshot.total",
                          null,
                      ],
                  },
              ],
          }
        : {
              $ifNull: [
                  "$financialSnapshot.customer.payableMinor",
                  {
                      $cond: [
                          { $eq: ["$pricingSnapshot.moneyUnit", "PAISE"] },
                          "$pricingSnapshot.finalPayableMinor",
                          null,
                      ],
                  },
              ],
          },
    currency: flight
        ? { $ifNull: ["$priceSnapshot.financials.customer.currency", "$priceSnapshot.currency"] }
        : { $ifNull: ["$financialSnapshot.customer.currency", "$pricingSnapshot.currency"] },
    travelDate: {
        $convert: {
            input: flight
                ? { $arrayElemAt: ["$segmentSnapshot.departureDateTime", 0] }
                : {
                      $ifNull: [
                          "$enquirySnapshot.fields.preferredTravelDate",
                          "$customizationSnapshot.searchInput.checkIn",
                      ],
                  },
            to: "date",
            onError: null,
            onNull: null,
        },
    },
});
const target = (record) =>
    `/dashboard/${record.service}?${record.service === "flights" ? "flight" : "booking"}=${encodeURIComponent(record.bookingRef)}`;
function bookingItem(record, context) {
    const display = bookingStatusDisplay(record.status, record.paymentStatus);
    return {
        id: String(record._id),
        label: record.title || record.bookingRef,
        icon: icons[record.service],
        description: [record.bookingRef, dateLabel(record.travelDate || record.createdAt, context)]
            .filter(Boolean)
            .join(" · "),
        target: target(record),
        status: display.label,
        statusTone: display.tone,
        ...(Number.isSafeInteger(record.amountMinor) && record.currency
            ? { value: money(record.amountMinor, record.currency, context) }
            : {}),
    };
}
async function bookingData(context, navigation, stages) {
    const query = queries(context, navigation);
    return Promise.all(
        [
            [Booking, query.booking, false],
            [FlightBooking, query.flight, true],
        ].map(([Model, match, flight]) =>
            Model.aggregate([{ $match: match }, { $project: projection(flight) }, ...stages]),
        ),
    );
}

async function analytics(context, navigation, period) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - period + 1, 1));
    const data = (
        await bookingData(context, navigation, [
            { $match: { createdAt: { $gte: start, $lte: now } } },
            {
                $group: {
                    _id: {
                        month: {
                            $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" },
                        },
                        service: "$service",
                        currency: "$currency",
                        status: "$status",
                    },
                    count: { $sum: 1 },
                    known: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $isNumber: "$amountMinor" },
                                        { $ne: ["$currency", null] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    amount: {
                        $sum: {
                            $cond: [
                                { $in: ["$status", cancelled] },
                                0,
                                { $ifNull: ["$amountMinor", 0] },
                            ],
                        },
                    },
                },
            },
        ])
    ).flat();
    const months = Array.from(
        { length: period },
        (_, index) => new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1)),
    );
    const total = data.reduce((sum, group) => sum + group.count, 0);
    const currencies = [
        ...new Set(
            data
                .filter((group) => group.known && group._id.currency)
                .map((group) => group._id.currency),
        ),
    ].sort();
    const finances = currencies.map((currency) => {
        const groups = data.filter((group) => group._id.currency === currency);
        const amount = sumMinor(groups.map((group) => group.amount));
        return {
            id: currency,
            title: `Booking value · ${currency}`,
            value: money(amount, currency, context),
            description:
                "Booked value by creation month. Excludes cancelled bookings; this is not a payment receipt.",
            labels: months.map((month) =>
                month.toLocaleDateString(context.locale, {
                    month: "short",
                    year: "2-digit",
                    timeZone: "UTC",
                }),
            ),
            series: [
                {
                    id: currency,
                    label: currency,
                    tone: "primary",
                    values: months.map((month) =>
                        Number(
                            minorToDecimal(
                                sumMinor(
                                    groups
                                        .filter(
                                            (group) =>
                                                group._id.month === month.toISOString().slice(0, 7),
                                        )
                                        .map((group) => group.amount),
                                ),
                            ),
                        ),
                    ),
                },
            ],
        };
    });
    const missing = data.reduce((sum, group) => sum + group.count - group.known, 0);
    return {
        kind: "analytics",
        title: "Your travel in numbers",
        periodLabel: `Last ${period} months`,
        metrics: [
            {
                id: "total",
                label: "Total bookings",
                value: total,
                icon: "calendar",
                helper: "Across your enabled services",
            },
            {
                id: "active",
                label: "Active journeys",
                value: data
                    .filter((group) => !terminal.includes(group._id.status))
                    .reduce((sum, group) => sum + group.count, 0),
                icon: "compass",
                helper: "Bookings still in progress",
            },
            {
                id: "completed",
                label: "Completed",
                value: data
                    .filter((group) => group._id.status === "COMPLETED")
                    .reduce((sum, group) => sum + group.count, 0),
                icon: "check",
                helper: "Journeys marked complete",
            },
            {
                id: "value",
                label: "Booking value",
                value:
                    finances.find((item) => item.id === context.currency)?.value ||
                    finances[0]?.value ||
                    "—",
                icon: "wallet",
                helper:
                    currencies.length > 1
                        ? "Currencies shown separately below"
                        : "From saved financial snapshots",
            },
        ],
        finances,
        emptyFinance: {
            title: "Your spending story starts here",
            description: "A monthly chart will appear when a booking has a saved financial value.",
        },
        note: missing
            ? `${missing} booking${missing === 1 ? " has" : "s have"} no verified financial snapshot and ${missing === 1 ? "is" : "are"} excluded from monetary totals.`
            : "",
        distribution: {
            title: "Bookings by service",
            description: "A closer look at how you travel",
            total,
            totalLabel: "bookings",
            emptyLabel: "Your first booking will start your travel mix",
            items: servicesFor(navigation).map((service) => {
                const count = data
                    .filter((group) => group._id.service === service.id)
                    .reduce((sum, group) => sum + group.count, 0);
                return {
                    id: service.id,
                    label: service.label,
                    value: count,
                    share: total ? (count / total) * 100 : 0,
                    tone: tones[service.id],
                    href: service.href,
                };
            }),
        },
    };
}

export async function buildOverviewWidget(context, navigation, user, id, period = "12") {
    if (!overviewManifest(context, navigation, user).widgets.some((widget) => widget.id === id))
        throw new ApiError(403, "This overview widget is not available to your account.");
    if (!["6", "12"].includes(String(period)))
        throw new ApiError(400, "Choose a supported insights period.");
    const scope = customerScopeQuery(context);
    const owner = context.userId;
    if (id === "analytics") return analytics(context, navigation, Number(period));
    if (id === "upcoming") {
        const batches = await bookingData(context, navigation, [
            {
                $match: {
                    travelDate: { $gte: new Date() },
                    status: { $in: ["CONFIRMED", "TICKETED", "TRAVEL_READY"] },
                },
            },
            { $sort: { travelDate: 1 } },
            { $limit: 3 },
        ]);
        const records = batches
            .flat()
            .sort((a, b) => a.travelDate - b.travelDate)
            .slice(0, 3);
        return panel(
            "Upcoming journeys",
            records.map((record) => bookingItem(record, context)),
            "/dashboard/bookings",
            "Your next adventure belongs here",
            "Confirmed journeys, ordered by departure date",
        );
    }
    if (id === "bookings") {
        const batches = await bookingData(context, navigation, [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
        ]);
        const records = batches
            .flat()
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5);
        return panel(
            "Recent bookings",
            records.map((record) => bookingItem(record, context)),
            "/dashboard/bookings",
            "Your next chapter is waiting",
            "Your latest bookings and their current status",
        );
    }
    if (id === "services") {
        const groups = (
            await bookingData(context, navigation, [
                { $group: { _id: "$service", count: { $sum: 1 } } },
            ])
        ).flat();
        return {
            kind: "services",
            title: "Your travel services",
            description: "Explore and manage the services available to you",
            items: servicesFor(navigation).map((service) => ({
                id: service.id,
                label: service.label,
                icon: icons[service.id],
                tone: tones[service.id],
                href: service.href,
                value: groups
                    .filter((group) => group._id === service.id)
                    .reduce((sum, group) => sum + group.count, 0),
                helper: "bookings",
                actionLabel: "View journeys",
            })),
        };
    }
    if (id === "enquiries") {
        const query = queries(context, navigation, "claimedBy").booking;
        // Flight enquiries use ContactLead while confirmed flights use FlightBooking.
        const flightAllowed = servicesFor(navigation).some((service) => service.id === "flights");
        const match = flightAllowed
            ? {
                  $or: [
                      query,
                      {
                          ...scope,
                          claimedBy: new mongoose.Types.ObjectId(owner),
                          product: "trehub",
                          journeyType: "flight",
                      },
                  ],
              }
            : query;
        const records = await ContactLead.find(match)
            .select("enquiryRef tourTitle status journeyType createdAt")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
        return panel(
            "Travel enquiries",
            records.map((record) => {
                const display = statusDisplay(record.status);
                return {
                    id: String(record._id),
                    label: record.tourTitle || record.enquiryRef,
                    description: `${record.enquiryRef || ""} · ${dateLabel(record.createdAt, context)}`,
                    status: display.label,
                    statusTone: display.tone,
                    icon: "messageCircle",
                    target: `/dashboard/${record.journeyType}s?enquiry=${encodeURIComponent(record.enquiryRef || record._id)}`,
                };
            }),
            "/dashboard/bookings",
            "No travel enquiries yet",
            "Follow your requests, quotes and next steps",
        );
    }
    if (id === "payments") {
        const query = queries(context, navigation);
        // Sessions have no tenant field: require an owned, scoped booking before exposing them.
        const records = await PaymentSession.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(owner), portal: "customer" } },
            ...[
                [Booking, query.booking, "booking", "booking"],
                [FlightBooking, query.flight, "flight", "flight"],
            ].map(([Model, match, type, as]) => ({
                $lookup: {
                    from: Model.collection.name,
                    let: { bookingId: "$bookingId", type: "$bookingType" },
                    pipeline: [
                        { $match: match },
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$bookingId"] },
                                        { $eq: ["$$type", type] },
                                    ],
                                },
                            },
                        },
                        { $project: projection(type === "flight") },
                    ],
                    as,
                },
            })),
            {
                $match: {
                    $or: [{ "booking.0": { $exists: true } }, { "flight.0": { $exists: true } }],
                },
            },
            { $sort: { updatedAt: -1 } },
            { $limit: 5 },
            {
                $project: {
                    expectedAmount: 1,
                    currency: 1,
                    status: 1,
                    updatedAt: 1,
                    booking: 1,
                    flight: 1,
                },
            },
        ]);
        return panel(
            "Recent payments",
            records.map((record) => {
                const booking = record.booking[0] || record.flight[0];
                const display = statusDisplay(record.status);
                return {
                    id: String(record._id),
                    label: booking.bookingRef,
                    description: dateLabel(record.updatedAt, context),
                    value: money(record.expectedAmount, record.currency, context),
                    status: display.label,
                    statusTone: display.tone,
                    icon: "wallet",
                    target: target(booking),
                };
            }),
            "/dashboard/bookings",
            "No payment activity yet",
            "Payment amounts and their latest recorded status",
        );
    }
    if (id === "notifications") {
        const query = { ...scope, userId: owner, portal: "customer" };
        const [unread, records] = await Promise.all([
            Notification.countDocuments({ ...query, readAt: null }),
            Notification.find(query)
                .select("title message readAt createdAt")
                .sort({ createdAt: -1 })
                .limit(4)
                .lean(),
        ]);
        return panel(
            "Notifications",
            records.map((record) => ({
                id: String(record._id),
                label: record.title,
                description: record.message,
                meta: dateLabel(record.createdAt, context),
                status: record.readAt ? "Read" : "Unread",
                statusTone: record.readAt ? "neutral" : "info",
                icon: "bell",
                target: "/dashboard/notifications",
            })),
            "/dashboard/notifications",
            "You're all caught up",
            `${unread} unread account updates`,
        );
    }
    if (id === "support") {
        const records = await SupportTicket.find({ ...scope, user: owner })
            .select("reference subject status lastActivityAt")
            .sort({ lastActivityAt: -1 })
            .limit(4)
            .lean();
        return panel(
            "Help & support",
            records.map((record) => ({
                id: String(record._id),
                label: record.subject,
                description: record.reference,
                status: statusDisplay(record.status).label,
                statusTone: statusDisplay(record.status).tone,
                icon: "support",
                target: `/help/requests/${record._id}`,
            })),
            "/dashboard/support",
            "We're here when you need us",
            "Track your conversations with our support team",
        );
    }
    if (id === "wishlist") {
        const products = context.productDefinitions
            .filter((product) =>
                product.services?.some(
                    (service) =>
                        ["tours", "trips"].includes(service) &&
                        product.metadata?.dashboard?.modules?.[service] !== false,
                ),
            )
            .map((product) => product.key);
        const records = await Favorite.find({ ...scope, userId: owner, product: { $in: products } })
            .sort({ createdAt: -1 })
            .limit(4)
            .lean();
        const [tours, trips] = await Promise.all([
            Tour.find({
                _id: {
                    $in: records
                        .filter((record) => record.product !== "trevio")
                        .map((record) => record.tourId),
                },
            })
                .select("title name")
                .lean(),
            Trip.find({
                _id: {
                    $in: records
                        .filter((record) => record.product === "trevio")
                        .map((record) => record.tourId),
                },
            })
                .select("title name")
                .lean(),
        ]);
        return panel(
            "Your wishlist",
            records.map((record) => ({
                id: String(record._id),
                label:
                    [...tours, ...trips].find(
                        (journey) => String(journey._id) === String(record.tourId),
                    )?.title || "Saved journey",
                icon: "heart",
                description: `Saved ${dateLabel(record.createdAt, context)}`,
                target: "/dashboard/wishlist",
            })),
            "/dashboard/wishlist",
            "Make room for your next adventure",
            "The journeys you want to come back to",
        );
    }
    return panel(
        "Your profile",
        [
            {
                id: "name",
                label: user.name || "Your account",
                description: user.email,
                icon: "user",
                target: "/dashboard/profile",
            },
            {
                id: "phone",
                label: "Contact number",
                value: user.phone || user.mobile || "Add a number",
                target: "/dashboard/profile",
                icon: "phoneCall",
            },
        ],
        "/dashboard/profile",
        "Complete your profile",
        "Keep your traveller and contact details up to date",
    );
}
