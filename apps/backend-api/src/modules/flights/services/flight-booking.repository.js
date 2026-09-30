import FlightBooking from "../models/FlightBooking.js";

export default class FlightBookingRepository {
    create(payload) { return FlightBooking.create(payload); }
    findById(id) { return FlightBooking.findOne({ bookingRef: id }).lean(); }
    findByPnr(pnr) { return FlightBooking.findOne({ pnr: String(pnr).toUpperCase() }).lean(); }
    update(id, updates) { return FlightBooking.findOneAndUpdate({ bookingRef: id }, { $set: updates }, { new: true }).lean(); }
}
