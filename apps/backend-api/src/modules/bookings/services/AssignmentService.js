import BookingAssignment from "../models/BookingAssignment.js";

export const AssignmentService = {
  async assign({ booking, newAgent, assignedBy, reason = "" }, options = {}) {
    const [entry] = await BookingAssignment.create([{
      bookingId: booking._id,
      previousAgent: booking.assignedAgent || null,
      newAgent,
      assignedBy,
      reason,
    }], options);
    return entry;
  },

  list(bookingId) {
    return BookingAssignment.find({ bookingId }).sort({ createdAt: -1 });
  },
};

export default AssignmentService;
