import BookingTraveller from "../../../models/BookingTraveller.js";
import BookingDocument from "../../../models/BookingDocument.js";

export const TravellerService = {
  async replaceForBooking(bookingId, travellers, options = {}) {
    await BookingTraveller.deleteMany({ bookingId }, options);
    if (!travellers.length) return [];
    const docs = travellers.map((traveller) => ({ ...traveller, bookingId }));
    return BookingTraveller.insertMany(docs, options);
  },

  async add(bookingId, traveller, options = {}) {
    const [doc] = await BookingTraveller.create([{ ...traveller, bookingId }], options);
    return doc;
  },

  async remove(bookingId, travellerId, options = {}) {
    await BookingDocument.deleteMany({ bookingId, travellerId }, options);
    await BookingTraveller.deleteOne({ _id: travellerId, bookingId }, options);
    return this.list(bookingId);
  },

  list(bookingId) {
    return BookingTraveller.find({ bookingId }).sort({ createdAt: 1 });
  },

  count(bookingId) {
    return BookingTraveller.countDocuments({ bookingId });
  },
};

export default TravellerService;
