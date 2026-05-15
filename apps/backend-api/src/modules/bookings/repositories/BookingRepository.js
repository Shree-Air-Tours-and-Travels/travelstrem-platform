import Booking from "../models/Booking.js";

const BookingRepository = {
  find(query = {}) {
    return Booking.find(query);
  },
  findById(id) {
    return Booking.findById(id);
  },
  findOne(query = {}) {
    return Booking.findOne(query);
  },
  countDocuments(query = {}) {
    return Booking.countDocuments(query);
  },
  findByIdAndUpdate(id, payload, options) {
    return Booking.findByIdAndUpdate(id, payload, options);
  },
  create(payload) {
    return new Booking(payload);
  },
};

export default BookingRepository;
