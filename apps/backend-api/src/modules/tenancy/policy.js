import User from "../auth/models/User.js";
import PartnerAgency from "../auth/models/PartnerAgency.js";
import { effectiveRole, permissionsFor } from "./permissions.js";

export async function loadAccessContext(req, res, next) {
  try {
    const userId = req.user?.sub || req.user?.id;
    const user = await User.findById(userId).select("name email role adminLevel agencyRole agencyId partnerAgencyRef accountStatus tokenVersion productAccess permissionGrants permissionDenials").lean();
    if (!user || Number(req.user?.tokenVersion || 0) !== Number(user.tokenVersion || 0)) return res.status(401).json({ status: "error", message: "Session is no longer valid." });
    if (!["active"].includes(user.accountStatus || "active")) return res.status(403).json({ status: "error", message: `Account is ${user.accountStatus}.` });
    let agency = null;
    if (user.agencyId) agency = await PartnerAgency.findById(user.agencyId).lean();
    if (agency && agency.status !== "active") return res.status(403).json({ status: "error", message: `Agency is ${agency.status}.` });
    req.access = { user, agency, role: effectiveRole(user), permissions: new Set(permissionsFor(user)), agencyId: user.agencyId ? String(user.agencyId) : null, isMaster: effectiveRole(user) === "master_admin" };
    return next();
  } catch (error) { return next(error); }
}

export const requirePermission = (...required) => (req, res, next) => {
  if (!req.access) return res.status(500).json({ status: "error", message: "Access context is missing." });
  if (req.access.isMaster || required.some((permission) => req.access.permissions.has(permission))) return next();
  return res.status(403).json({ status: "error", message: "You do not have permission to perform this action." });
};

export function tenantQuery(req, extra = {}) {
  return req.access?.isMaster ? extra : { ...extra, agencyId: req.access?.agencyId };
}

export function assertTenant(req, record) {
  if (req.access?.isMaster) return true;
  return Boolean(record?.agencyId && String(record.agencyId) === String(req.access?.agencyId));
}
