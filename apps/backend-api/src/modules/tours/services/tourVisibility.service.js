const id = (value) => String(value?._id || value || "");
const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MANAGEMENT_STATUSES = new Set([
    "draft",
    "pending_approval",
    "published",
    "unpublished",
    "archived",
    "cancelled",
]);

export const isPrivateAgentDraft = (tour = {}) =>
    tour?.status === "draft" && tour?.agentTour === true && Boolean(tour?.ownerAgent);

export const getTourCheckpointPublishingState = (tour = {}) => {
    const preservePublishedStatus = tour?.status === "published";
    return {
        status: preservePublishedStatus ? "published" : "draft",
        isPublished: preservePublishedStatus,
    };
};

export const getTourActor = (req = {}) => {
    const actor = req.access?.user || req.user || {};
    return {
        actor,
        actorId: id(actor._id || actor.sub || actor.id || req.user?.sub || req.user?.id),
        agencyId: req.access?.agencyId || actor.agencyId || req.user?.agencyId || null,
        role: req.access?.role || actor.agencyRole || req.user?.agencyRole,
        isMaster: Boolean(
            req.access?.isMaster || (actor.role === "admin" && actor.adminLevel === "master"),
        ),
    };
};

export const isPrivateDraftOwner = (req, tour) =>
    isPrivateAgentDraft(tour) && id(tour.ownerAgent) === getTourActor(req).actorId;

export const buildManagementTourQuery = (req, featuredOnly = false) => {
    const query = featuredOnly ? { featured: true } : {};
    const { actorId, agencyId, role, isMaster } = getTourActor(req);
    const ownOnly = String(req.query?.scope || "").toLowerCase() === "mine";

    // `scope=mine` is an explicit management contract used by PartnerTREM.
    // It also applies to partner admins: the "My tours" screen must not turn
    // into an agency-wide inventory view just because the actor has broader
    // permissions. The server derives actorId from the authenticated session;
    // callers cannot use this parameter to request another user's records.
    if (ownOnly) {
        if (!actorId) return { _id: null };
        if (!isMaster) query.agencyId = agencyId;
        query.ownerAgent = actorId;
        return query;
    }

    if (isMaster) {
        query.$nor = [{ status: "draft", agentTour: true, ownerAgent: { $ne: null } }];
        return query;
    }

    query.agencyId = agencyId;
    if (role === "partner_admin") {
        query.$or = [
            { status: { $ne: "draft" } },
            { agentTour: { $ne: true } },
            { ownerAgent: actorId },
        ];
    } else {
        query.ownerAgent = actorId;
    }
    return query;
};

export const buildManagementTourListQuery = (req, featuredOnly = false) => {
    const conditions = [buildManagementTourQuery(req, featuredOnly)];
    const search = String(req.query?.query || req.query?.search || "")
        .trim()
        .slice(0, 120);
    const status = String(req.query?.status || "").toLowerCase();

    if (search) {
        const pattern = new RegExp(escapeRegExp(search), "i");
        conditions.push({
            $or: [
                { title: pattern },
                { desc: pattern },
                { "city.from": pattern },
                { "city.to": pattern },
                { tags: pattern },
            ],
        });
    }
    if (MANAGEMENT_STATUSES.has(status)) conditions.push({ status });

    return conditions.length === 1 ? conditions[0] : { $and: conditions };
};

export const getManagementTourSort = (value = "newest") => {
    const sortMap = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        title: { title: 1, createdAt: -1 },
    };
    return sortMap[String(value || "").toLowerCase()] || sortMap.newest;
};
