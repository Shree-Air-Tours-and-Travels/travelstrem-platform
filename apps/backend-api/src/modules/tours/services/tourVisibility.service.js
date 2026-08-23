const id = (value) => String(value?._id || value || "");

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
