import crypto from "crypto";
import mongoose from "mongoose";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import config from "../config/index.js";
import User from "../modules/auth/models/User.js";
import AuthIdentity from "../modules/auth/models/AuthIdentity.js";
import RefreshToken from "../modules/auth/models/RefreshToken.js";
import OAuthTransaction from "../modules/auth/models/OAuthTransaction.js";
import MobileOtpChallenge from "../modules/auth/models/MobileOtpChallenge.js";

const normalizeLegacyPhone = (value) => {
  const parsed = parsePhoneNumberFromString(String(value || "").trim(), "IN");
  return parsed?.isValid() ? parsed.number : null;
};

await mongoose.connect(config.MONGO_URI);
try {
  const users = await User.find({});
  const normalizedPhoneCounts = users.reduce((counts, user) => {
    const normalized = normalizeLegacyPhone(user.phone);
    if (normalized) counts.set(normalized, (counts.get(normalized) || 0) + 1);
    return counts;
  }, new Map());
  for (const user of users) {
    if (typeof user.emailVerified !== "boolean") user.emailVerified = false;
    if (typeof user.mobileVerified !== "boolean") user.mobileVerified = false;
    if (!user.mobile && user.phone) {
      const normalized = normalizeLegacyPhone(user.phone);
      if (normalized && normalizedPhoneCounts.get(normalized) === 1) user.mobile = normalized;
    }
    await user.save();
  }

  const legacySessions = await RefreshToken.find({ $or: [{ sessionId: { $exists: false } }, { sessionId: null }] });
  for (const session of legacySessions) {
    session.sessionId = crypto.randomUUID();
    session.lastUsedAt = session.createdAt || new Date();
    await session.save();
  }

  await Promise.all([
    User.syncIndexes(),
    AuthIdentity.syncIndexes(),
    RefreshToken.syncIndexes(),
    OAuthTransaction.syncIndexes(),
    MobileOtpChallenge.syncIndexes(),
  ]);
  console.log(JSON.stringify({ status: "success", usersProcessed: users.length, sessionsProcessed: legacySessions.length }));
} finally {
  await mongoose.disconnect();
}
