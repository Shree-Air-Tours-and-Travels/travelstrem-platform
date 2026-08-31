import mongoose from "mongoose";
import config from "../config/index.js";
import PartnerAgency from "../modules/auth/models/PartnerAgency.js";
import User from "../modules/auth/models/User.js";
import Tour from "../modules/tours/models/Tour.js";
import Trip from "../modules/trips/models/Trip.js";
import AgentDeletionRequest from "../modules/tenancy/models/AgentDeletionRequest.js";

await mongoose.connect(config.MONGO_URI);
const agencies = await PartnerAgency.find({});
for (const agency of agencies) {
    if (agency.status === "approved") agency.status = "active";
    await agency.save();
    const users = await User.find({ partnerAgencyRef: agency.partnerAgencyRef, agencyId: null });
    for (const user of users) {
        user.agencyId = agency._id;
        user.agencyRole = user.agencyRole === "none" ? "partner_agent" : user.agencyRole;
        user.accountStatus = user.accountStatus || "active";
        await user.save();
    }
    const userIds = users.map((user) => user._id);
    await Tour.updateMany(
        {
            agencyId: null,
            $or: [{ partnerAgencyRef: agency.partnerAgencyRef }, { ownerAgent: { $in: userIds } }],
        },
        { $set: { agencyId: agency._id } },
    );
    await Trip.updateMany(
        { agencyId: null, ownerAgent: { $in: userIds } },
        { $set: { agencyId: agency._id } },
    );
}
const duplicateDeletionRequests = await AgentDeletionRequest.aggregate([
    { $match: { status: "pending" } },
    { $sort: { createdAt: -1 } },
    {
        $group: {
            _id: "$agentId",
            keep: { $first: "$_id" },
            duplicates: { $push: "$_id" },
            count: { $sum: 1 },
        },
    },
    { $match: { count: { $gt: 1 } } },
]);
for (const group of duplicateDeletionRequests) {
    await AgentDeletionRequest.updateMany(
        { _id: { $in: group.duplicates.filter((id) => String(id) !== String(group.keep)) } },
        {
            $set: {
                status: "cancelled",
                decisionNotes:
                    "Cancelled by tenancy migration because a newer pending request exists.",
                decisionDate: new Date(),
            },
        },
    );
}
await AgentDeletionRequest.createIndexes();
console.log(`Migrated tenant ownership for ${agencies.length} agencies.`);
await mongoose.disconnect();
