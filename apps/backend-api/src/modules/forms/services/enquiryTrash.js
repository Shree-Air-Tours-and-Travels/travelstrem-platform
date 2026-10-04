import { runWithCapturedTenantIntegrationContext } from "../../integrations/runtime.js";
import logger from "../../../shared/logger/index.js";
import mongoose from "mongoose";
import Client from "../../clients/models/Client.js";

export const NON_RESUMABLE_ENQUIRY_STATUSES = ["rejected", "cancelled", "closed"];
let running = false;

export async function archiveClosedEnquiries() {
    if (running) return;
    running = true;
    try {
        const db = mongoose.connection.db;
        let bookingCollections = ["bookings", "flightbookings", "hotelbookings"];
        let journeyFilter = {};
        if (process.env.TENANT_CLIENT_ID) {
            const client = await Client.findOne({
                _id: process.env.TENANT_CLIENT_ID,
                status: "active",
            }).lean();
            if (!client) return;
            const enabled = (product, service) =>
                client.productAccess?.includes(product) &&
                client.modules?.[product]?.includes(service);
            const journeys = [
                ["trevista", "tours", "tour"],
                ["trevio", "trips", "trip"],
                ["trehub", "flights", "flight"],
                ["trehub", "hotels", "hotel"],
            ]
                .filter(([product, service]) => enabled(product, service))
                .map(([, , journey]) => journey);
            if (!journeys.length) return;
            journeyFilter = { journeyType: { $in: journeys } };
            bookingCollections = [
                "bookings",
                ...(journeys.includes("flight") ? ["flightbookings"] : []),
                ...(journeys.includes("hotel") ? ["hotelbookings"] : []),
            ];
        }
        const leads = db.collection("contactleads");
        const candidates = await leads
            .find({
                ...journeyFilter,
                status: { $in: NON_RESUMABLE_ENQUIRY_STATUSES },
                bookingId: null,
            })
            .limit(100)
            .toArray();
        for (const candidate of candidates) {
            const session = await mongoose.startSession();
            try {
                await session.withTransaction(async () => {
                    const lead = await leads.findOne(
                        {
                            _id: candidate._id,
                            status: { $in: NON_RESUMABLE_ENQUIRY_STATUSES },
                            bookingId: null,
                        },
                        { session },
                    );
                    if (!lead) return;
                    for (const collection of bookingCollections) {
                        if (
                            await db.collection(collection).findOne(
                                {
                                    $or: [
                                        { sourceEnquiryId: lead._id },
                                        { sourceEnquiryId: String(lead._id) },
                                    ],
                                },
                                { session, projection: { _id: 1 } },
                            )
                        )
                            return;
                    }
                    const archivedAt = new Date();
                    await db.collection("enquirytrash").updateOne(
                        { _id: lead._id },
                        {
                            $setOnInsert: {
                                enquiry: lead,
                                archivedAt,
                                expiresAt: new Date(archivedAt.getTime() + 7 * 86400000),
                            },
                        },
                        { upsert: true, session },
                    );
                    await leads.deleteOne({ _id: lead._id, status: lead.status }, { session });
                });
            } finally {
                await session.endSession();
            }
        }
    } finally {
        running = false;
    }
}

export async function startEnquiryTrash() {
    if (process.env.TENANT_CLIENT_ID) {
        const client = await Client.findById(process.env.TENANT_CLIENT_ID).lean();
        if (!client?.productAccess?.length) return;
    }
    await mongoose.connection.db
        .collection("enquirytrash")
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    const sweep = () =>
        runWithCapturedTenantIntegrationContext(
            { tenantId: process.env.TENANT_CLIENT_ID || "travelstrem" },
            archiveClosedEnquiries,
        ).catch((error) => logger.error("[EnquiryTrash]", error));
    await sweep();
    const timer = setInterval(sweep, 60000);
    timer.unref();
}
