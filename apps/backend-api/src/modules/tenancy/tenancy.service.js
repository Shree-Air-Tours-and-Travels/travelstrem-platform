import crypto from "crypto";
import bcrypt from "bcryptjs";
import Invitation from "./models/Invitation.js";
import User from "../auth/models/User.js";
import RefreshToken from "../auth/models/RefreshToken.js";
import { sendInvitationEmail } from "../../services/email.service.js";
import config from "../../config/index.js";

export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const invitationExpiry = () => new Date(Date.now() + Number(config.INVITATION_TTL_HOURS || 48) * 60 * 60 * 1000);
export async function inviteUser({ agency, actorId, name, email, phone, designation, agencyRole, productKeys = [], permissions = [], session = null }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw Object.assign(new Error("A valid work email is required."), { status: 400 });
  if (await User.exists({ email: normalizedEmail }).session(session)) throw Object.assign(new Error("Email is already registered."), { status: 409 });
  const randomPasswordHash = await bcrypt.hash(crypto.randomBytes(48).toString("hex"), 12);
  const user = new User({ name, email: normalizedEmail, phone, designation, passwordHash: randomPasswordHash, role: "agent", agencyRole, agencyId: agency._id, partnerAgencyRef: agency.partnerAgencyRef, agentRef: `agent-${crypto.randomBytes(6).toString("hex")}`, agentApprovalStatus: "approved", accountStatus: "invited", productAccess: productKeys, permissionGrants: permissions });
  await user.save({ session });
  const rawToken = crypto.randomBytes(48).toString("base64url");
  const expiresAt = invitationExpiry();
  const invitation = new Invitation({ email: normalizedEmail, agencyId: agency._id, userId: user._id, role: agencyRole, productKeys, permissions, tokenHash: hashToken(rawToken), expiresAt, invitedBy: actorId });
  await invitation.save({ session });
  const authBase = String(config.AUTH_APP_URL || config.PARTNER_URL || config.SHELL_URL).replace(/\/$/, "");
  const activationUrl = `${authBase}/?app=partner&token=${encodeURIComponent(rawToken)}`;
  const result = session ? { success: true, deferred: true } : await sendInvitationEmail({ to: normalizedEmail, recipientName: name, agencyName: agency.agencyName, roleLabel: agencyRole === "partner_admin" ? "Partner Admin" : "Partner Agent", activationUrl, expiresInHours: config.INVITATION_TTL_HOURS || 48 });
  return { user, invitation, emailSent: result.success, rawToken };
}
export async function activateInvitation({ token, password }) {
  if (!token || !password || String(password).length < 8) throw Object.assign(new Error("A valid token and password of at least 8 characters are required."), { status: 400 });
  const passwordHash = await bcrypt.hash(password, 12);
  const session = await Invitation.startSession();
  try {
    let activatedUser;
    await session.withTransaction(async () => {
      const invitation = await Invitation.findOneAndUpdate(
        { tokenHash: hashToken(token), usedAt: null, revokedAt: null, expiresAt: { $gt: new Date() } },
        { $set: { usedAt: new Date() } }, { new: true, session }
      );
      if (!invitation) throw Object.assign(new Error("Invitation is invalid, expired, or already used."), { status: 400 });
      activatedUser = await User.findOneAndUpdate(
        { _id: invitation.userId, accountStatus: "invited" },
        { $set: { passwordHash, accountStatus: "active", activatedAt: new Date() }, $inc: { tokenVersion: 1 } },
        { new: true, session }
      );
      if (!activatedUser) throw Object.assign(new Error("Invited account is unavailable."), { status: 409 });
    });
    return activatedUser;
  } finally { await session.endSession(); }
}

export async function renewInvitation({ user, agency, actorId }) {
  if (!user || user.accountStatus !== "invited") throw Object.assign(new Error("Only pending invitations can be resent."), { status: 409 });
  await Invitation.updateMany({ userId: user._id, usedAt: null, revokedAt: null }, { $set: { revokedAt: new Date() } });
  const rawToken = crypto.randomBytes(48).toString("base64url");
  const invitation = await Invitation.create({
    email: user.email, agencyId: agency._id, userId: user._id, role: user.agencyRole,
    productKeys: user.productAccess || [], permissions: user.permissionGrants || [],
    tokenHash: hashToken(rawToken), expiresAt: invitationExpiry(), invitedBy: actorId,
  });
  const authBase = String(config.AUTH_APP_URL || config.PARTNER_URL || config.SHELL_URL).replace(/\/$/, "");
  const activationUrl = `${authBase}/?app=partner&token=${encodeURIComponent(rawToken)}`;
  const email = await sendInvitationEmail({ to: user.email, recipientName: user.name, agencyName: agency.agencyName, roleLabel: user.agencyRole === "partner_admin" ? "Partner Admin" : "Partner Agent", activationUrl, expiresInHours: config.INVITATION_TTL_HOURS || 48 });
  return { invitation, emailSent: email.success };
}
export async function revokeSessions(user) {
  user.tokenVersion = Number(user.tokenVersion || 0) + 1;
  await Promise.all([user.save(), RefreshToken.deleteMany({ userId: user._id })]);
}
