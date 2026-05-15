import mongoose from "mongoose";
import { encryptedStringField, maskSecret } from "../../../utils/secureFields.js";

const { Schema } = mongoose;

const bookingTravellerSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
  travellerType: { type: String, enum: ["adult", "child", "infant"], default: "adult" },
  title: { type: String, trim: true, default: "" },
  firstName: { type: String, required: true, trim: true },
  middleName: { type: String, trim: true, default: "" },
  lastName: { type: String, trim: true, default: "" },
  gender: { type: String, enum: ["male", "female", "other", "prefer_not_say", ""], default: "" },
  dob: { type: Date, default: null },
  age: { type: Number, min: 0 },
  nationality: { type: String, trim: true, default: "" },
  countryOfResidence: { type: String, trim: true, default: "" },
  passportNumber: encryptedStringField(""),
  passportIssueCountry: { type: String, trim: true, default: "" },
  passportIssueDate: { type: Date, default: null },
  passportExpiryDate: { type: Date, default: null },
  maritalStatus: { type: String, trim: true, default: "" },
  email: { type: String, trim: true, lowercase: true, default: "" },
  phone: { type: String, trim: true, default: "" },
  alternatePhone: { type: String, trim: true, default: "" },
  emergencyContactName: { type: String, trim: true, default: "" },
  emergencyContactRelation: { type: String, trim: true, default: "" },
  emergencyContactNumber: encryptedStringField(""),
  dietaryPreferences: { type: String, trim: true, default: "" },
  foodRestrictions: { type: String, trim: true, default: "" },
  medicalConditions: encryptedStringField(""),
  mobilityAssistance: { type: Boolean, default: false, index: true },
  wheelchairRequired: { type: Boolean, default: false, index: true },
  pregnancyStatus: { type: String, trim: true, default: "" },
  specialAssistanceNotes: { type: String, trim: true, default: "" },
  frequentFlyerNumber: { type: String, trim: true, default: "" },
  seatPreference: { type: String, trim: true, default: "" },
  visaStatus: { type: String, trim: true, default: "" },
  pickupAddress: { type: String, trim: true, default: "" },
  dropAddress: { type: String, trim: true, default: "" },
  gstNumber: { type: String, trim: true, default: "" },
  companyName: { type: String, trim: true, default: "" },
  travelInsuranceOpted: { type: Boolean, default: false },
  insuranceProvider: { type: String, trim: true, default: "" },
  documentChecklistStatus: { type: String, enum: ["PENDING", "PARTIAL", "COMPLETE"], default: "PENDING" },
}, {
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true, getters: true },
});

bookingTravellerSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

bookingTravellerSchema.set("toJSON", {
  virtuals: true,
  getters: true,
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret.id || String(ret._id);
    delete ret._id;
    ret.passportNumber = maskSecret(doc.get("passportNumber", null, { getters: false }), 3);
    ret.emergencyContactNumber = maskSecret(doc.get("emergencyContactNumber", null, { getters: false }), 3);
    ret.medicalConditions = ret.medicalConditions ? "Recorded" : "";
  },
});

bookingTravellerSchema.index({ bookingId: 1 });
bookingTravellerSchema.index({ passportExpiryDate: 1 });
bookingTravellerSchema.index({ visaStatus: 1 });

const BookingTraveller = mongoose.models?.BookingTraveller || mongoose.model("BookingTraveller", bookingTravellerSchema);
export default BookingTraveller;
