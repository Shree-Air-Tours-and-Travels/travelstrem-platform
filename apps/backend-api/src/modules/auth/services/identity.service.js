import AuthIdentity from "../models/AuthIdentity.js";
import User from "../models/User.js";

export class AuthServiceError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const portalAllowsRole = (portal, role) => ({
  // The customer app is available to every active TravelsTREM account.
  // Admin and partner capabilities remain protected by their own portals/RBAC.
  customer: ["member", "agent", "admin"],
  admin: ["admin"],
  partner: ["agent"],
}[portal] || ["member"]).includes(role);

const ensurePortalAccess = (user, portal) => {
  if (!portalAllowsRole(portal, user.role)) {
    throw new AuthServiceError("PORTAL_ACCESS_DENIED", `This account does not have access to the ${portal} portal.`, 403);
  }
  if ((user.accountStatus || "active") !== "active") {
    throw new AuthServiceError("ACCOUNT_INACTIVE", "This account is not active.", 403);
  }
};

const createIdentitySafely = async (payload) => {
  try {
    return await AuthIdentity.create(payload);
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return AuthIdentity.findOne({ provider: payload.provider, providerUserId: payload.providerUserId });
  }
};

export const authenticateWithGoogle = async ({ claims, portal = "customer" }) => {
  const providerUserId = String(claims?.sub || "").trim();
  const email = String(claims?.email || "").trim().toLowerCase();
  const emailVerified = claims?.email_verified === true;
  if (!providerUserId || !email || !emailVerified) {
    throw new AuthServiceError("GOOGLE_EMAIL_NOT_VERIFIED", "Google did not provide a verified email address.", 403);
  }

  let identity = await AuthIdentity.findOne({ provider: "GOOGLE", providerUserId });
  let user = identity ? await User.findById(identity.userId) : null;

  if (!user) {
    user = await User.findOne({ email });
    if (!user && portal !== "customer") {
      throw new AuthServiceError("PORTAL_ACCOUNT_REQUIRED", "An existing portal account is required before Google can be linked.", 403);
    }
    if (!user) {
      user = await User.create({
        name: String(claims.name || email.split("@")[0]).trim(),
        email,
        emailVerified: true,
        avatar: String(claims.picture || "user"),
        role: "member",
        accountStatus: "active",
      });
    }
    ensurePortalAccess(user, portal);
    identity = await createIdentitySafely({
      userId: user._id,
      provider: "GOOGLE",
      providerUserId,
      providerEmail: email,
      verified: true,
      lastAuthenticatedAt: new Date(),
    });
    if (String(identity.userId) !== String(user._id)) {
      throw new AuthServiceError("IDENTITY_ALREADY_LINKED", "This Google account is already linked to another user.", 409);
    }
  }

  ensurePortalAccess(user, portal);
  user.name = user.name || String(claims.name || email.split("@")[0]);
  user.email = user.email || email;
  user.emailVerified = Boolean(user.emailVerified || emailVerified);
  if (claims.picture && (!user.avatar || user.avatar === "user")) user.avatar = claims.picture;
  await user.save();
  await AuthIdentity.updateOne({ _id: identity._id }, {
    $set: { providerEmail: email, verified: true, lastAuthenticatedAt: new Date() },
  });
  return user;
};

export const authenticateWithMobile = async ({ phoneNumber, portal = "customer" }) => {
  let identity = await AuthIdentity.findOne({ provider: "MOBILE", providerUserId: phoneNumber });
  let user = identity ? await User.findById(identity.userId) : null;

  if (!user) {
    user = await User.findOne({ mobile: phoneNumber, mobileVerified: true });
    if (!user && portal !== "customer") {
      throw new AuthServiceError("PORTAL_ACCOUNT_REQUIRED", "An existing verified portal account is required before mobile can be linked.", 403);
    }
    if (!user) {
      user = await User.create({
        name: `Traveller ${phoneNumber.slice(-4)}`,
        mobile: phoneNumber,
        phone: phoneNumber,
        mobileVerified: true,
        role: "member",
        accountStatus: "active",
      });
    }
    ensurePortalAccess(user, portal);
    identity = await createIdentitySafely({
      userId: user._id,
      provider: "MOBILE",
      providerUserId: phoneNumber,
      providerPhone: phoneNumber,
      verified: true,
      lastAuthenticatedAt: new Date(),
    });
    if (String(identity.userId) !== String(user._id)) {
      throw new AuthServiceError("IDENTITY_ALREADY_LINKED", "This mobile number is already linked to another user.", 409);
    }
  }

  ensurePortalAccess(user, portal);
  user.mobile = phoneNumber;
  user.phone = phoneNumber;
  user.mobileVerified = true;
  await user.save();
  await AuthIdentity.updateOne({ _id: identity._id }, { $set: { verified: true, lastAuthenticatedAt: new Date() } });
  return user;
};

export const linkIdentity = async ({ userId, provider, providerUserId, providerEmail = null, providerPhone = null, verified = false }) => {
  if (!verified) throw new AuthServiceError("IDENTITY_NOT_VERIFIED", "Identity ownership must be verified before linking.", 400);
  const identity = await createIdentitySafely({ userId, provider, providerUserId, providerEmail, providerPhone, verified });
  if (String(identity.userId) !== String(userId)) {
    throw new AuthServiceError("IDENTITY_ALREADY_LINKED", "This identity is already linked to another user.", 409);
  }
  return identity;
};
