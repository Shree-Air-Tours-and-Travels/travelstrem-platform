import Tour from "../models/Tour.js";

const OWNER_POPULATE = { path: "ownerAgent", select: "name email agentRef" };

const TourRepository = {
  find(query = {}, projection) {
    return Tour.find(query, projection).populate(OWNER_POPULATE);
  },
  findLean(query = {}) {
    return Tour.find(query).populate(OWNER_POPULATE).lean();
  },
  findById(id) {
    return Tour.findById(id).populate(OWNER_POPULATE);
  },
  findByIdAndUpdate(id, payload, options) {
    return Tour.findByIdAndUpdate(id, payload, options).populate(OWNER_POPULATE);
  },
  findByIdAndDelete(id) {
    return Tour.findByIdAndDelete(id);
  },
  findOne(query = {}) {
    return Tour.findOne(query).populate(OWNER_POPULATE);
  },
  create(payload) {
    return new Tour(payload);
  },
  deleteMany(query = {}) {
    return Tour.deleteMany(query);
  },
  hydrate(payload) {
    return Tour.hydrate(payload);
  },
};

export default TourRepository;
