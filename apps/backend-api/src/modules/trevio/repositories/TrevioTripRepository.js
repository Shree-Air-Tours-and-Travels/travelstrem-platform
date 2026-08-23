import TrevioTrip from "../models/TrevioTrip.js";

const TrevioTripRepository = {
  find(query = {}, projection) {
    return TrevioTrip.find(query, projection);
  },
  findLean(query = {}) {
    return TrevioTrip.find(query).lean();
  },
  findOne(query = {}) {
    return TrevioTrip.findOne(query);
  },
  findBySlug(slug) {
    return TrevioTrip.findOne({ slug });
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
