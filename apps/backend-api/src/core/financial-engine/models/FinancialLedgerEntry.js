import mongoose from "mongoose";
import { LEDGER_ENTRY_TYPE } from "../constants/index.js";
const schema = new mongoose.Schema({
  type: { type: String, enum: Object.values(LEDGER_ENTRY_TYPE), required: true, index: true },
  direction: { type: String, enum: ["CREDIT", "DEBIT"], required: true },
  amountMinor: { type: Number, required: true, min: 0 },
  moneyUnit: { type: String, enum: ["PAISE"], default: "PAISE" },
  currency: { type: String, default: "INR" },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null, index: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "BookingPayment", default: null, index: true },
  refundId: { type: mongoose.Schema.Types.ObjectId, ref: "BookingPayment", default: null },
  settlementId: { type: mongoose.Schema.Types.ObjectId, ref: "FinancialSettlement", default: null },
  idempotencyKey: { type: String, required: true, unique: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
for (const operation of ["updateOne", "updateMany", "replaceOne", "deleteOne", "deleteMany", "findOneAndDelete"]) schema.pre(operation, function immutable() { throw new Error("Financial ledger entries are immutable"); });
schema.pre("findOneAndUpdate", function immutableUpsert() {
  const update = this.getUpdate() || {};
  if (!this.getOptions().upsert || Object.keys(update).some((key) => key !== "$setOnInsert")) throw new Error("Financial ledger entries are immutable");
});
schema.pre("save", function immutableSave() { if (!this.isNew) throw new Error("Financial ledger entries are immutable"); });
export default mongoose.models?.FinancialLedgerEntry || mongoose.model("FinancialLedgerEntry", schema);
