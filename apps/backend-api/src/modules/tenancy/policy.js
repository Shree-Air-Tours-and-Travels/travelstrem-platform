import Client from "../clients/models/Client.js";
import User from "../auth/models/User.js";
import PartnerAgency from "../auth/models/PartnerAgency.js";
import { effectiveRole, permissionsFor } from "./permissions.js";

export async function resolveAccessContext(userId, tokenVersion) {
    const user = await User.findById(userId)
        .select(
            "name email phone mobile createdAt clientId clientRole role adminLevel agencyRole agencyId agentRef agencyRef partnerAgencyRef avatar accountStatus tokenVersion productAccess permissionGrants permissionDenials",
        )
        .lean();
    if (
        !user ||
        (tokenVersion !== undefined && Number(tokenVersion || 0) !== Number(user.tokenVersion || 0))
    )
        throw Object.assign(new Error("Session is no longer valid."), { status: 401 });
    if ((user.accountStatus || "active") !== "active")
        throw Object.assign(new Error(`Account is ${user.accountStatus}.`), { status: 403 });
    if (process.env.TENANT_CLIENT_ID && String(user.clientId) !== process.env.TENANT_CLIENT_ID)
        throw Object.assign(new Error("Account does not belong to this tenant."), { status: 403 });
    const agency = user.agencyId ? await PartnerAgency.findById(user.agencyId).lean() : null;
    if (user.agencyId && (!agency || agency.status !== "active"))
        throw Object.assign(new Error("Agency access is not active."), { status: 403 });
    const client = user.clientId ? await Client.findOne({ _id: user.clientId, status: "active" }).lean() : null;
    if (user.clientId && !client) throw Object.assign(new Error("Tenant access is inactive."), { status: 403 });
    const rolePermissions = client?.roles?.[effectiveRole(user)];
    const permissions = permissionsFor(user).filter((permission) => !rolePermissions || permission.includes(":") || rolePermissions.includes(permission));
    return {
        user,
        agency,
        role: effectiveRole(user),
        permissions: new Set(permissions),
        agencyId: user.agencyId ? String(user.agencyId) : null,
        isMaster: !user.clientId && effectiveRole(user) === "trem_master_admin",
        isTenantAdmin: Boolean(process.env.TENANT_CLIENT_ID && String(user.clientId) === process.env.TENANT_CLIENT_ID && ["client_master_admin", "client_admin"].includes(user.clientRole)),
    };
}

export async function loadAccessContext(req, res, next) {
    try {
        req.access = await resolveAccessContext(
            req.user?.sub || req.user?.id,
            req.user?.tokenVersion || 0,
        );
        return next();
    } catch (error) {
        if (error.status)
            return res.status(error.status).json({ status: "error", message: error.message });
        return next(error);
    }
}

export const requirePermission =
    (...required) =>
    (req, res, next) => {
        if (!req.access)
            return res.status(500).json({ status: "error", message: "Access context is missing." });
        if (
            req.access.isMaster ||
            required.some((permission) => req.access.permissions.has(permission))
        )
            return next();
        return res.status(403).json({
            status: "error",
            message: "You do not have permission to perform this action.",
        });
    };

export function tenantQuery(req, extra = {}) {
    return (req.access?.isMaster || req.access?.isTenantAdmin) ? extra : { ...extra, agencyId: req.access?.agencyId };
}

export function assertTenant(req, record) {
    if (req.access?.isMaster || req.access?.isTenantAdmin) return true;
    return Boolean(record?.agencyId && String(record.agencyId) === String(req.access?.agencyId));
}
