import Trip from "../models/Trip.js";

const AGENCY_POPULATE = {
    path: "agencyId",
    select: "agencyName partnerAgencyRef logo website address status",
};
const OWNER_POPULATE = { path: "ownerAgent", select: "name agentRef" };

const TripRepository = {
    find(query = {}, projection) {
        return Trip.find(query, projection)
            .populate(AGENCY_POPULATE)
            .populate(OWNER_POPULATE);
    },
    findLean(query = {}) {
        return Trip.find(query).lean();
    },
    findOne(query = {}) {
        return Trip.findOne(query);
    },
    findBySlug(slug) {
        return Trip.findOne({ slug }).populate(AGENCY_POPULATE).populate(OWNER_POPULATE);
    },
    upsertBySlug(slug, payload) {
        return Trip.findOneAndUpdate(
            { slug },
            { $set: payload },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );
    },
    upsertBySourceTourId(sourceTourId, payload) {
        return Trip.findOneAndUpdate(
            { sourceTourId },
            { $set: payload },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );
    },
    countDocuments(query = {}) {
        return Trip.countDocuments(query);
    },
    findOneAndUpdate(query = {}, update = {}, options = {}) {
        return Trip.findOneAndUpdate(query, update, options);
    },
};

export default TripRepository;
