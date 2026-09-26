import { applyProcessAction, getProcessSnapshot } from "@packages/trem-process-engine";
import Tour from "../../modules/tours/models/Tour.js";
import { sanitizeTourPayloadForUpdate } from "../../modules/tours/controllers/tourController.js";
import TOUR_BUILDER_PROCESS from "./tourProcessDefinition.js";
import { getTourCheckpointPublishingState } from "../../modules/tours/services/tourVisibility.service.js";

const id = (value) => String(value?._id || value || "");

function assertCanEdit(req, tour) {
    const actorId = id(req.access?.user?._id || req.user?.sub || req.user?.id);
    if (tour.status === "draft" && tour.agentTour === true && id(tour.ownerAgent) !== actorId) {
        throw Object.assign(new Error("Tour draft not found"), { status: 404 });
    }
    if (req.access?.isMaster) return;
    if (id(tour.agencyId) !== id(req.access?.agencyId || req.user?.agencyId))
        throw Object.assign(new Error("You cannot edit this draft"), { status: 403 });
    if (
        (req.access?.role || req.user?.agencyRole) !== "partner_admin" &&
        id(tour.ownerAgent) !== actorId
    )
        throw Object.assign(new Error("You cannot edit this draft"), { status: 403 });
}

export function getTourProcessSnapshot(process = {}) {
    return getProcessSnapshot(TOUR_BUILDER_PROCESS, process);
}

export async function submitTourProcessAction(req, { tourId, nodeId, payload }) {
    let tour = tourId ? await Tour.findById(tourId) : null;
    if (tourId && !tour) throw Object.assign(new Error("Tour draft not found"), { status: 404 });
    if (tour) assertCanEdit(req, tour);

    const persisted = tour?.builderProcess?.toObject?.() || tour?.builderProcess || {};
    const nextTransition = applyProcessAction(TOUR_BUILDER_PROCESS, persisted, {
        nodeId,
        data: payload,
    });
    if (!nextTransition.ok) return { ...nextTransition, tour };

    const draftPayload = { ...payload };
    if (!draftPayload.desc) delete draftPayload.desc;
    if (!draftPayload.description) delete draftPayload.description;
    delete draftPayload._id;
    delete draftPayload.builderProcess;
    // A process checkpoint must not silently unpublish an existing live tour.
    // New tours remain drafts until the final, permission-checked update.
    const checkpointPublishingState = getTourCheckpointPublishingState(tour);
    // Draft checkpoints may save a component-priced commercial block that has
    // not reached two or three enabled packages yet (the wizard prices that
    // section later). Published tours must stay fully priced.
    const sanitized = sanitizeTourPayloadForUpdate(draftPayload, {
        allowIncompleteCommercial: checkpointPublishingState.status !== "published",
    });
    Object.assign(sanitized, checkpointPublishingState);
    sanitized.builderProcess = { ...nextTransition.process, updatedAt: new Date() };

    if (!tour) {
        const actorId = req.access?.user?._id || req.user?.sub || req.user?.id || null;
        const isAgencyActor =
            req.user?.role === "agent" ||
            ["partner_agent", "partner_admin"].includes(req.access?.role || req.user?.agencyRole);
        tour = new Tour({
            ...sanitized,
            title: sanitized.title || payload.title,
            city: sanitized.city || payload.city,
            address: sanitized.address || payload.address || {},
            distance: sanitized.distance ?? payload.distance ?? 0,
            period: sanitized.period || payload.period || { days: 1, nights: 0 },
            price: sanitized.price || payload.price || { min: 0, max: 0, currency: "INR" },
            maxGroupSize: sanitized.maxGroupSize || payload.maxGroupSize || 1,
            desc: sanitized.desc || "",
            agencyId: req.access?.agencyId || req.user?.agencyId || null,
            ownerAgent: isAgencyActor ? actorId : null,
            createdBy: actorId,
            productKey: "trevista",
            agentTour: isAgencyActor,
            inventorySource: isAgencyActor ? "agent" : "platform",
        });
    } else {
        tour.set(sanitized);
    }
    await tour.save();
    return { ...nextTransition, tour };
}

export { TOUR_BUILDER_PROCESS };
