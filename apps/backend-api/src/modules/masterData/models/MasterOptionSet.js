import mongoose from "mongoose";

const { Schema } = mongoose;

const masterOptionSchema = new Schema({
  name: { type: String, trim: true, default: "" },
  value: { type: String, required: true, trim: true },
  title: { type: String, trim: true, default: "" },
  label: { type: String, trim: true, default: "" },
  disabled: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { _id: false });

const masterOptionSetSchema = new Schema({
  key: { type: String, required: true, unique: true, trim: true, index: true },
  product: { type: String, trim: true, default: "travels-trem", index: true },
  description: { type: String, trim: true, default: "" },
  active: { type: Boolean, default: true, index: true },
  options: { type: [masterOptionSchema], default: [] },
}, { timestamps: true });

const MasterOptionSet = mongoose.models?.MasterOptionSet || mongoose.model("MasterOptionSet", masterOptionSetSchema);

export default MasterOptionSet;
