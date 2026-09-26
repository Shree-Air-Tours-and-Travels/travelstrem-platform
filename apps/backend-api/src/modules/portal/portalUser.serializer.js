import { normalizeProfileAvatar } from "../auth/profileAvatar.constants.js";

export const toSafePortalUser = (user, fallback = null) => {
    if (!user && !fallback) return null;
    const id =
        user?._id?.toString?.() ||
        user?.id ||
        fallback?.sub ||
        fallback?.id ||
        fallback?.userId ||
        null;
    if (!id) return null;

    return {
        id,
        name: user?.name || fallback?.name || null,
        email: user?.email || fallback?.email || null,
        avatar: normalizeProfileAvatar(user?.avatar || fallback?.avatar),
        role: user?.role || fallback?.role || "member",
        agentRef: user?.agentRef || fallback?.agentRef || "",
        agencyRef: user?.agencyRef || fallback?.agencyRef || "",
        partnerAgencyRef: user?.partnerAgencyRef || fallback?.partnerAgencyRef || "",
        agencyName: user?.agencyName || fallback?.agencyName || "",
        agentApprovalStatus:
            user?.agentApprovalStatus || fallback?.agentApprovalStatus || "not_required",
        adminLevel: user?.adminLevel || fallback?.adminLevel || "none",
        adminApprovalStatus:
            user?.adminApprovalStatus || fallback?.adminApprovalStatus || "not_required",
        agencyRole: user?.agencyRole || fallback?.agencyRole || "none",
        agencyId: user?.agencyId?.toString?.() || user?.agencyId || fallback?.agencyId || null,
        accountStatus: user?.accountStatus || fallback?.accountStatus || "active",
        productAccess: user?.productAccess || fallback?.productAccess || [],
        permissionGrants: user?.permissionGrants || fallback?.permissionGrants || [],
        permissionDenials: user?.permissionDenials || fallback?.permissionDenials || [],
        createdAt: user?.createdAt
            ? new Date(user.createdAt).toISOString()
            : fallback?.createdAt || null,
    };
};
