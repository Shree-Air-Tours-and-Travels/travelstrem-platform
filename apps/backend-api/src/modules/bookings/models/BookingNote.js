import mongoose from "mongoose";

const { Schema } = mongoose;

const bookingNoteSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
  message: { type: String, trim: true, required: true },
  visibility: { type: String, enum: ["private", "agent_only", "admin_only"], default: "private", index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: { createdAt: true, updatedAt: false } });

bookingNoteSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

bookingNoteSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => { delete ret._id; },
});

bookingNoteSchema.index({ bookingId: 1, createdAt: -1 });

const BookingNote = mongoose.models?.BookingNote || mongoose.model("BookingNote", bookingNoteSchema);
export default BookingNote;
