import TrevioTrip from "../models/TrevioTrip.js";

const AGENCY_POPULATE = {
  path: "agencyId",
  select: "agencyName partnerAgencyRef logo website address status",
};
const OWNER_POPULATE = { path: "ownerAgent", select: "name agentRef" };

const TrevioTripRepository = {
  find(query = {}, projection) {
    return TrevioTrip.find(query, projection).populate(AGENCY_POPULATE).populate(OWNER_POPULATE);
  },
  findLean(query = {}) {
    return TrevioTrip.find(query).lean();
  },
  findOne(query = {}) {
    return TrevioTrip.findOne(query);
  },
  findBySlug(slug) {
    return TrevioTrip.findOne({ slug }).populate(AGENCY_POPULATE).populate(OWNER_POPULATE);
  },
  upsertBySlug(slug, payload) {
    return TrevioTrip.findOneAndUpdate(
      { slug },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  },
  countDocuments(query = {}) {
    return TrevioTrip.countDocuments(query);
  },
  findOneAndUpdate(query = {}, update = {}, options = {}) {
    return TrevioTrip.findOneAndUpdate(query, update, options);
  },
};

export default TrevioTripRepository;
