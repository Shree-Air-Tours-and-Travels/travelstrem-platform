import crypto from "crypto";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import config from "../../../config/index.js";
import MobileOtpChallenge from "../models/MobileOtpChallenge.js";
import { mobileOtpProvider } from "../providers/mobile/index.js";
import { AuthServiceError, authenticateWithMobile } from "./identity.service.js";

export const normalizeMobileNumber = (input, defaultCountry = "IN") => {
  const parsed = parsePhoneNumberFromString(String(input || "").trim(), defaultCountry);
  if (!parsed?.isValid()) throw new AuthServiceError("INVALID_MOBILE_NUMBER", "Enter a valid mobile number.", 400);
  return parsed.number;
};

const hashOtp = (otp, salt = crypto.randomBytes(16).toString("hex")) => {
  const derived = crypto.scryptSync(String(otp), salt, 32).toString("hex");
  return `${salt}:${derived}`;
};

const matchesOtp = (otp, stored) => {
  const [salt, expectedHex] = String(stored || "").split(":");
  if (!salt || !expectedHex) return false;
  const actual = Buffer.from(hashOtp(otp, salt).split(":")[1], "hex");
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

export const requestMobileOtp = async ({ phoneNumber: input, portal = "customer", ipAddress = "" }) => {
  if (!config.MOBILE_AUTH_ENABLED) {
    throw new AuthServiceError("MOBILE_AUTH_DISABLED", "Mobile verification is currently unavailable.", 503);
  }
  const phoneNumber = normalizeMobileNumber(input);
  const cooldownAfter = new Date(Date.now() - config.MOBILE_OTP_RESEND_COOLDOWN_SECONDS * 1000);
  const recent = await MobileOtpChallenge.findOne({ phoneNumber, createdAt: { $gt: cooldownAfter } }).sort({ createdAt: -1 });
  if (recent) throw new AuthServiceError("OTP_RATE_LIMITED", "Please wait before requesting another code.", 429);

  const hourAgo = new Date(Date.now() - 3600000);
  const recentCount = await MobileOtpChallenge.countDocuments({ phoneNumber, createdAt: { $gt: hourAgo } });
  if (recentCount >= 5) throw new AuthServiceError("OTP_RATE_LIMITED", "Too many verification requests. Please try again later.", 429);

  const otp = config.IS_DEVELOPMENT && config.MOBILE_AUTH_DEV_MODE
    ? config.MOBILE_AUTH_TEST_OTP
    : String(crypto.randomInt(100000, 1000000));
  await mobileOtpProvider.sendOtp(phoneNumber, otp);

  await MobileOtpChallenge.updateMany(
    { phoneNumber, verifiedAt: null, invalidatedAt: null },
    { $set: { invalidatedAt: new Date() } },
  );
  const challenge = await MobileOtpChallenge.create({
    phoneNumber,
    otpHash: hashOtp(otp),
    portal,
    expiresAt: new Date(Date.now() + config.MOBILE_OTP_EXPIRY_SECONDS * 1000),
    maxAttempts: config.MOBILE_OTP_MAX_ATTEMPTS,
    ipAddress: String(ipAddress).slice(0, 100),
  });
  return {
    challengeId: challenge._id.toString(),
    phoneNumber,
    expiresIn: config.MOBILE_OTP_EXPIRY_SECONDS,
    resendAfter: config.MOBILE_OTP_RESEND_COOLDOWN_SECONDS,
    ...(config.IS_DEVELOPMENT && config.MOBILE_AUTH_DEV_MODE ? { developmentOtp: otp } : {}),
  };
};

export const verifyMobileOtp = async ({ challengeId, otp, portal = "customer" }) => {
  if (!/^[a-f\d]{24}$/i.test(String(challengeId || "")) || !/^\d{6}$/.test(String(otp || ""))) {
    throw new AuthServiceError("INVALID_OTP", "The verification code is invalid or expired.", 400);
  }
  const challenge = await MobileOtpChallenge.findById(challengeId);
  if (!challenge || challenge.verifiedAt || challenge.invalidatedAt || challenge.expiresAt <= new Date() || challenge.portal !== portal) {
    throw new AuthServiceError("INVALID_OTP", "The verification code is invalid or expired.", 400);
  }
  if (challenge.attemptCount >= challenge.maxAttempts) {
    throw new AuthServiceError("OTP_ATTEMPTS_EXCEEDED", "Too many verification attempts. Request a new code.", 429);
  }
  if (!matchesOtp(otp, challenge.otpHash)) {
    challenge.attemptCount += 1;
    if (challenge.attemptCount >= challenge.maxAttempts) challenge.invalidatedAt = new Date();
    await challenge.save();
    throw new AuthServiceError("INVALID_OTP", "The verification code is invalid or expired.", 400);
  }

  challenge.verifiedAt = new Date();
  challenge.otpHash = hashOtp(crypto.randomBytes(32).toString("hex"));
  await challenge.save();
  const user = await authenticateWithMobile({ phoneNumber: challenge.phoneNumber, portal });
  return { user, phoneNumber: challenge.phoneNumber };
};
