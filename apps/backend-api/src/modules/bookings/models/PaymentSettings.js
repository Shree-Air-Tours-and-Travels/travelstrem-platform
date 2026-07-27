import mongoose from "mongoose";

const { Schema } = mongoose;

const paymentMethodSchema = new Schema({
  code: { type: String, required: true, trim: true, uppercase: true },
  label: { type: String, required: true, trim: true },
  enabled: { type: Boolean, default: true },
  instructions: { type: String, trim: true, default: "" },
  upiId: { type: String, trim: true, default: "" },
  qrImage: { type: String, trim: true, default: "" },
  accountHolder: { type: String, trim: true, default: "" },
  bankAccount: { type: String, trim: true, default: "" },
  bankName: { type: String, trim: true, default: "" },
  ifsc: { type: String, trim: true, uppercase: true, default: "" },
}, { _id: false });

const paymentSettingsSchema = new Schema({
  key: { type: String, unique: true, default: "default" },
  methods: {
    type: [paymentMethodSchema],
    default: () => [
      { code: "UPI", label: "UPI / QR", enabled: true },
      { code: "BANK", label: "Bank Transfer", enabled: true },
    ],
  },
  instructions: { type: String, trim: true, default: "" },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

paymentSettingsSchema.set("toJSON", {
  versionKey: false,
  transform: (_, ret) => { delete ret._id; },
});

const PaymentSettings = mongoose.models?.PaymentSettings
  || mongoose.model("PaymentSettings", paymentSettingsSchema);

export default PaymentSettings;
