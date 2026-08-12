import mongoose from "mongoose";

const oauthTransactionSchema = new mongoose.Schema({
  stateHash: { type: String, required: true, unique: true, index: true },
  provider: { type: String, enum: ["GOOGLE"], required: true },
  portal: { type: String, enum: ["customer", "admin", "partner"], required: true },
  returnTo: { type: String, required: true },
  nonce: { type: String, required: true },
  codeVerifier: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date, default: null },
  ipAddress: { type: String, default: "" },
  userAgent: { type: String, default: "" },
}, { timestamps: true });

oauthTransactionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models?.OAuthTransaction || mongoose.model("OAuthTransaction", oauthTransactionSchema);
