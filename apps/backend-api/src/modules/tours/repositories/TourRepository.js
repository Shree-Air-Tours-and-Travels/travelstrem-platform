import Tour from "../models/Tour.js";

const OWNER_POPULATE = { path: "ownerAgent", select: "name email agentRef" };
const AGENCY_POPULATE = {
    path: "agencyId",
    select: "agencyName partnerAgencyRef logo website address status",
};

const TourRepository = {
    find(query = {}, projection) {
        return Tour.find(query, projection).populate(OWNER_POPULATE).populate(AGENCY_POPULATE);
    },
    findLean(query = {}) {
        return Tour.find(query).populate(OWNER_POPULATE).populate(AGENCY_POPULATE).lean();
    },
    findById(id) {
        return Tour.findById(id).populate(OWNER_POPULATE).populate(AGENCY_POPULATE);
    },
    findByIdAndUpdate(id, payload, options) {
        return Tour.findByIdAndUpdate(id, payload, options)
            .populate(OWNER_POPULATE)
            .populate(AGENCY_POPULATE);
    },
    findByIdAndDelete(id) {
        return Tour.findByIdAndDelete(id);
    },
    findOne(query = {}) {
        return Tour.findOne(query).populate(OWNER_POPULATE).populate(AGENCY_POPULATE);
    },
    create(payload) {
        return new Tour(payload);
    },
    deleteMany(query = {}) {
        return Tour.deleteMany(query);
    },
    updateMany(query = {}, update = {}) {
        return Tour.updateMany(query, update);
    },
    hydrate(payload) {
        return Tour.hydrate(payload);
    },
};

export default TourRepository;
