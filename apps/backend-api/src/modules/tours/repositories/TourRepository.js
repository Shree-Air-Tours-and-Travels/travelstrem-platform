import Tour from "../models/Tour.js";

const TourRepository = {
  find(query = {}, projection) {
    return Tour.find(query, projection);
  },
  findLean(query = {}) {
    return Tour.find(query).lean();
  },
  findById(id) {
    return Tour.findById(id);
  },
  findByIdAndUpdate(id, payload, options) {
    return Tour.findByIdAndUpdate(id, payload, options);
  },
  findByIdAndDelete(id) {
    return Tour.findByIdAndDelete(id);
  },
  findOne(query = {}) {
    return Tour.findOne(query);
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
