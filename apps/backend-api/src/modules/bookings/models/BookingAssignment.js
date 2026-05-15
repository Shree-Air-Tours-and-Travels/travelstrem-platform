import mongoose from "mongoose";

const { Schema } = mongoose;

const bookingAssignmentSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
  previousAgent: { type: Schema.Types.ObjectId, ref: "User", default: null },
  newAgent: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  assignedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  reason: { type: String, trim: true, default: "" },
}, { timestamps: { createdAt: true, updatedAt: false } });

bookingAssignmentSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

bookingAssignmentSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { delete ret._id; },
});

bookingAssignmentSchema.index({ bookingId: 1, createdAt: -1 });

const BookingAssignment = mongoose.models?.BookingAssignment || mongoose.model("BookingAssignment", bookingAssignmentSchema);
export default BookingAssignment;
