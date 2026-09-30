import mongoose from "mongoose";

export const NON_RESUMABLE_ENQUIRY_STATUSES = ["rejected", "cancelled", "closed"];
let running = false;

export async function archiveClosedEnquiries() {
    if (running) return;
    running = true;
    try {
        const db = mongoose.connection.db;
        const leads = db.collection("contactleads");
        const candidates = await leads.find({ status: { $in: NON_RESUMABLE_ENQUIRY_STATUSES }, bookingId: null }).limit(100).toArray();
        for (const candidate of candidates) {
            const session = await mongoose.startSession();
            try {
                await session.withTransaction(async () => {
                    const lead = await leads.findOne({ _id: candidate._id, status: { $in: NON_RESUMABLE_ENQUIRY_STATUSES }, bookingId: null }, { session });
                    if (!lead) return;
                    for (const collection of ["bookings", "flightbookings", "hotelbookings"]) {
                        if (await db.collection(collection).findOne({ $or: [{ sourceEnquiryId: lead._id }, { sourceEnquiryId: String(lead._id) }] }, { session, projection: { _id: 1 } })) return;
                    }
                    const archivedAt = new Date();
                    await db.collection("enquirytrash").updateOne({ _id: lead._id }, { $setOnInsert: {
                        enquiry: lead, archivedAt, expiresAt: new Date(archivedAt.getTime() + 7 * 86400000),
                    } }, { upsert: true, session });
                    await leads.deleteOne({ _id: lead._id, status: lead.status }, { session });
                });
            } finally { await session.endSession(); }
        }
    } finally { running = false; }
}

export async function startEnquiryTrash() {
    await mongoose.connection.db.collection("enquirytrash").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    const sweep = () => archiveClosedEnquiries().catch((error) => console.error("[EnquiryTrash]", error.message));
    await sweep();
    const timer = setInterval(sweep, 60000);
    timer.unref();
}
