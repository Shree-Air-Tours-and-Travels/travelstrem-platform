import Tour from "../models/Tour.js";
import TourDeparture from "../models/TourDeparture.js";
import TourRepository from "../repositories/TourRepository.js";
import {
    SERVER_IDENTITY_FIELDS,
    PLATFORM_PROVIDER_NAME,
    resolveAgencyIdentity,
    applyIdentity,
} from "./builderIdentity.service.js";
import { canModifyTour, applyDerivedCommercialPrice } from "../controllers/tourController.js";
import { sanitizeTourPayloadForUpdate } from "../controllers/tourController.js";
import { getTourCheckpointPublishingState } from "../services/tourVisibility.service.js";
import { syncDerivedTourDeparture } from "../services/tourDepartureSyncService.js";
import {
    applyTourIntelligence,
    refreshTourIntelligence,
} from "../services/tourIntelligence.service.js";
import {
    applyProcessAction,
    getProcessSnapshot,
    PROCESS_ACTION,
} from "@packages/trem-process-engine";
import { createBuilderLabelContract } from "./builderLabelContract.js";
import {
    REALTIME_EVENTS,
    publishFanOut,
    publishToCatalog,
    publishToTour,
    realtimeNotify,
    tourDto,
} from "../../../realtime/index.js";
import {
    BUILDER_STEPS,
    TOUR_BUILDER_KEY,
    TOUR_BUILDER_VERSION,
    getBuilderDefinition,
    getBuilderProcessDefinition,
    cloneStepDefinition,
    findStepDefinition,
    stepNeighbours,
} from "./stepDefinitions.js";
import { syncTrevioBuilderTrip } from "../../trips/services/tripBuilderProjection.service.js";

/* ----------------------------- path helpers ----------------------------- */

const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);

const resolveProductKey = (req, requestedProductKey, tour = null) => {
    const requested = String(
        requestedProductKey || req.query?.product || req.body?.productKey || "trevista",
    ).toLowerCase();
    if (!['trevista', 'trevio'].includes(requested)) {
        throw Object.assign(new Error("Unsupported builder product"), { status: 422 });
    }
    if (tour?.productKey && tour.productKey !== requested) {
        throw Object.assign(new Error("This item belongs to a different travel product"), {
            status: 409,
        });
    }
    return requested;
};

const applyProductDefinition = (definition, values, productKey) => {
    if (productKey !== "trevio") return;
    if (definition.stepKey === "packaging") {
        setPath(values, "packageType", "fixed_departure");
    }
    definition.substeps.forEach((substep) =>
        substep.children.forEach((child) =>
            (child.widgets || []).forEach((widget) => {
                if (widget.path === "packageType") {
                    widget.readOnly = true;
                    widget.serverManaged = true;
                    widget.helpText = "Trevio trips use fixed departures. Add one or more dates below.";
                }
            }),
        ),
    );
};

export const getPath = (source, path = "") =>
    String(path)
        .split(".")
        .filter(Boolean)
        .reduce(
            (cursor, segment) =>
                isObject(cursor) || Array.isArray(cursor) ? cursor?.[segment] : undefined,
            source,
        );

export const setPath = (target, path, value) => {
    const segments = String(path).split(".").filter(Boolean);
    let cursor = target;
    segments.forEach((segment, index) => {
        if (index === segments.length - 1) {
            cursor[segment] = value;
            return;
        }
        if (!isObject(cursor[segment]) && !Array.isArray(cursor[segment])) cursor[segment] = {};
        cursor = cursor[segment];
    });
    return target;
};

/** Pick only the step-owned paths out of arbitrary incoming data. */
export const pickOwnedPaths = (data = {}, ownedPaths = []) => {
    if (!isObject(data)) return {};
    const picked = {};
    ownedPaths.forEach((ownedPath) => {
        const value = getPath(data, ownedPath);
        if (value !== undefined) setPath(picked, ownedPath, value);
    });
    return picked;
};

/* ------------------------------ identity -------------------------------- */

/* Server-managed agent/agency identity lives in builderIdentity.service.js
   (dependency-free so it stays unit-testable). */

/**
 * Marks widgets whose path is server-managed as read-only and prefills empty
 * display values with what will be stamped, so agents see their identity
 * before the first save.
 */
const markServerManagedWidgets = (widgets = [], values, identity) => {
    const walk = (list) =>
        list.forEach((widget) => {
            if (!widget?.path) return;
            if (identity[widget.path] !== undefined) {
                widget.readOnly = true;
                widget.serverManaged = true;
                if (!getPath(values, widget.path))
                    setPath(values, widget.path, identity[widget.path]);
            }
            if (widget.type === "REPEATER" || widget.type === "COLLECTION_REPEATER")
                walk(widget.itemWidgets || []);
            if (widget.type === "OBJECT") walk(widget.widgets || []);
        });
    walk(widgets);
    return values;
};

const ownsPath = (stepKey, candidatePath) => {
    const step = findStepDefinition(stepKey);
    if (!step) return false;
    return (step.ownedPaths || []).some(
        (ownedPath) =>
            candidatePath === ownedPath ||
            candidatePath.startsWith(`${ownedPath}.`) ||
            ownedPath.startsWith(`${candidatePath}.`),
    );
};

/* ---------------------------- capabilities ------------------------------ */

const capabilitiesFor = (req, tour) => {
    const access = req.access || {};
    const role = access.role || req.user?.agencyRole;
    const agencySettings = access.agency?.settings || {};
    return {
        isMaster: !!access.isMaster,
        canEdit: tour ? canModifyTour(req.user, tour, access) : true,
        canPublish:
            !!access.isMaster ||
            role === "partner_admin" ||
            agencySettings?.tripPublishingPermissions?.agentCanPublish === true,
        canVerify: !!access.isMaster,
        canEditMetrics: !!access.isMaster,
        canEditPlatformMeta: !!access.isMaster || role === "partner_admin",
        canEditVisibility: !!access.isMaster || role === "partner_admin",
        viewCosts: !!access.isMaster || role === "partner_admin" || !role,
    };
};

const widgetAllowed = (widget, capabilities) => {
    const required = widget.capabilities || {};
    for (const [capability, needed] of Object.entries(required)) {
        if (needed && capability in capabilities && !capabilities[capability]) return false;
    }
    return true;
};

/** Remove widgets (and their values) the actor may not see or edit. */
const redactWidgets = (widgets = [], capabilities) =>
    widgets.reduce((acc, widget) => {
        const readOnlyByCapability = Object.entries(widget.capabilities || {}).some(
            ([capability, needed]) =>
                needed && capability in capabilities && !capabilities[capability],
        );
        const next = { ...widget };
        if (readOnlyByCapability) next.readOnly = true;

        if (next.type === "REPEATER" || next.type === "COLLECTION_REPEATER") {
            next.itemWidgets = redactWidgets(next.itemWidgets || [], capabilities);
        }
        if (next.type === "OBJECT" && Array.isArray(next.widgets)) {
            next.widgets = redactWidgets(next.widgets, capabilities);
        }

        // Cost data is stripped rather than shown read-only for actors without viewCosts.
        if (!capabilities.viewCosts) {
            if (next.path === "supplierRef" || next.path === "costAmountMinor") return acc;
        }
        acc.push(next);
        return acc;
    }, []);

const stripWidgetValues = (widgets = [], values, capabilities) => {
    if (!isObject(values)) return values;
    let cleaned = JSON.parse(JSON.stringify(values));
    const removeAt = (path) => {
        const segments = path.split(".");
        const last = segments.pop();
        const parent = getPath(cleaned, segments.join("."));
        if (isObject(parent) || Array.isArray(parent)) delete parent[last];
    };
    const walk = (list) =>
        list.forEach((widget) => {
            if (!widgetAllowed(widget, capabilities) && widget.path) return removeAt(widget.path);
            if (
                !capabilities.viewCosts &&
                (widget.path === "supplierRef" || widget.path.endsWith(".supplierRef"))
            )
                return removeAt(widget.path);
            if (
                !capabilities.viewCosts &&
                (widget.path === "costAmountMinor" ||
                    widget.path.endsWith("pricing.costAmountMinor"))
            )
                return removeAt(widget.path);
            if (widget.type === "REPEATER" || widget.type === "COLLECTION_REPEATER")
                walk(widget.itemWidgets || []);
            if (widget.type === "OBJECT") walk(widget.widgets || []);
        });
    walk(widgets);
    return cleaned;
};

/* --------------------------- collection steps --------------------------- */

const loadCollectionRecords = async (collection, tourId) => {
    if (collection === "tour-departures") {
        return TourDeparture.find({ tourId }).sort({ departureDate: 1 }).lean();
    }
    return [];
};

const sanitizeDepartureRecord = (raw = {}) => {
    const pricing = raw.pricing || {};
    const origin = raw.origin || {};
    const dateOr = (value) => (value ? new Date(value) : null);
    return {
        ...(raw._id ? { _id: raw._id } : {}),
        origin: {
            cityId: String(origin.cityId || "").toLowerCase(),
            cityName: String(origin.cityName || ""),
            countryId: String(origin.countryId || "").toLowerCase(),
            countryName: String(origin.countryName || ""),
        },
        departureDate: dateOr(raw.departureDate),
        returnDate: dateOr(raw.returnDate),
        status: ["scheduled", "active", "sold_out", "cancelled", "completed"].includes(raw.status)
            ? raw.status
            : "active",
        capacity:
            raw.capacity == null || raw.capacity === "" ? null : Math.max(0, Number(raw.capacity)),
        availableSeats:
            raw.availableSeats == null || raw.availableSeats === ""
                ? null
                : Math.max(0, Number(raw.availableSeats)),
        pricing: {
            currency: String(pricing.currency || "INR").toUpperCase(),
            min: Number(pricing.min ?? 0),
            max: Number(pricing.max ?? 0),
            isFinal: !!pricing.isFinal,
            source: ["manual", "ai", "agent", "calculated", "component_calculation"].includes(
                pricing.source,
            )
                ? pricing.source
                : "manual",
        },
        bookingOpensAt: dateOr(raw.bookingOpensAt),
        bookingClosesAt: dateOr(raw.bookingClosesAt),
        legacyDerived: !!raw.legacyDerived,
    };
};

const saveCollectionStep = async (req, tour, stepKey, data) => {
    const step = findStepDefinition(stepKey);
    const repeater = step.substeps
        .flatMap((substep) => substep.children)
        .flatMap((child) => child.widgets)
        .find((widget) => widget.type === "COLLECTION_REPEATER");
    const recordKey = String(repeater.path || repeater.key).replace(/^\$/, "");
    const records = Array.isArray(data?.[recordKey])
        ? data[recordKey]
        : Array.isArray(data?.[repeater.key])
          ? data[repeater.key]
          : [];

    if (repeater.collection === "tour-departures") {
        const keptIds = [];
        for (const record of records) {
            const sanitized = sanitizeDepartureRecord(record);
            if (tour.commercial?.version === "COMPONENTS_V1" && Number(tour.price?.max) > 0) {
                sanitized.pricing = {
                    currency: tour.price.currency || "INR",
                    min: Number(tour.price.min || 0),
                    max: Number(tour.price.max || 0),
                    isFinal: Boolean(tour.price.isFinal),
                    source: "component_calculation",
                };
            }
            if (!sanitized.departureDate || !sanitized.returnDate)
                throw new Error("Each departure needs departure and return dates");
            if (Number(sanitized.pricing.min) > Number(sanitized.pricing.max))
                throw new Error("Departure max price must be >= min price");
            if (sanitized._id) {
                await TourDeparture.findOneAndUpdate(
                    { _id: sanitized._id, tourId: tour._id },
                    sanitized,
                    { new: true, runValidators: true },
                );
                keptIds.push(String(sanitized._id));
            } else {
                const created = await TourDeparture.create({ ...sanitized, tourId: tour._id });
                keptIds.push(String(created._id));
            }
        }
        const existing = await TourDeparture.find({ tourId: tour._id }, "_id");
        const staleIds = existing
            .filter((doc) => !keptIds.includes(String(doc._id)))
            .map((doc) => doc._id);
        if (staleIds.length)
            await TourDeparture.deleteMany({ _id: { $in: staleIds }, tourId: tour._id });
        await syncDerivedTourDeparture(tour).catch(() => {});
        return loadCollectionRecords("tour-departures", tour._id);
    }

    throw new Error(`Unknown collection "${repeater.collection}"`);
};

/* ------------------------------- loading -------------------------------- */

const buildPreviewData = (tourObj = {}) => ({
    title: tourObj.title,
    period: tourObj.period,
    city: tourObj.city,
    packageType: tourObj.packageType,
    price: tourObj.price,
    commercial:
        tourObj.commercial?.version === "COMPONENTS_V1"
            ? {
                  version: tourObj.commercial.version,
                  currency: tourObj.commercial.currency,
                  displayMode: tourObj.commercial.derived?.displayMode || "ESTIMATED",
                  packages: (tourObj.commercial.packages || []).map((pkg) => ({
                      ...pkg,
                      pricing:
                          (tourObj.commercial.derived?.packages || []).find(
                              (item) => item.packageKey === pkg.packageKey,
                          ) || null,
                  })),
                  components: (tourObj.commercial.components || [])
                      .filter((component) => component.active !== false)
                      .map((component) => ({
                          componentKey: component.componentKey,
                          name: component.name,
                          type: component.type,
                      })),
              }
            : { version: "LEGACY" },
});

const stepValuesForTour = (step, tourDoc) => {
    const tourObj = tourDoc.toObject ? tourDoc.toObject() : tourDoc;
    const values = pickOwnedPaths(tourObj, step.ownedPaths || []);
    if (step.stepKey === "review") return { preview: buildPreviewData(tourObj) };
    return values;
};

/** Resolve a fresh definition clone against permissions + runtime option sources. */
const resolveStepDefinition = (step, req, tour) => {
    const definition = cloneStepDefinition(step.stepKey);
    const capabilities = capabilitiesFor(req, tour);
    definition.substeps = definition.substeps.map((substep) => ({
        ...substep,
        children: substep.children.map((child) => ({
            ...child,
            widgets: redactWidgets(child.widgets || [], capabilities),
        })),
    }));
    if (definition.actions.next && capabilities.canEdit === false) definition.readOnlyStep = true;
    return { definition, capabilities };
};

export async function getBuilderOverview(req) {
    const contract = createBuilderLabelContract(getBuilderDefinition());
    const productKey = resolveProductKey(req, null, null);
    return {
        status: "success",
        builder: {
            ...contract.structure,
            productKey,
            constraints:
                productKey === "trevio"
                    ? { fixedDeparturesOnly: true, multipleDepartures: true }
                    : {},
        },
        elements: contract.elements,
    };
}

export async function loadBuilderStep(req, { tourId, stepKey }) {
    let tour = null;
    if (tourId) {
        tour = await TourRepository.findById(tourId);
        if (!tour) throw Object.assign(new Error("Tour not found"), { status: 404 });
        if (!canModifyTour(req.user, tour, req.access))
            throw Object.assign(new Error("You cannot edit this tour"), { status: 403 });
    }
    const productKey = resolveProductKey(req, null, tour);

    if (stepKey === "resume") {
        if (!tour)
            throw Object.assign(new Error("Choose a saved tour before resuming the builder."), {
                status: 409,
            });
        const process = getProcessSnapshot(
            getBuilderProcessDefinition(),
            tour.builderProcess || {},
        );
        const candidate = String(process.currentNodeId || "").split(".")[0];
        stepKey = findStepDefinition(candidate) ? candidate : "basics";
    }

    const step = findStepDefinition(stepKey);
    if (!step) throw Object.assign(new Error(`Unknown builder step "${stepKey}"`), { status: 404 });
    if (step.stepKey === "review" && !tour) {
        throw Object.assign(
            new Error(
                "The saved tour draft could not be identified. Reopen the builder from Tours.",
            ),
            { status: 409 },
        );
    }

    const { definition, capabilities } = resolveStepDefinition(step, req, tour);

    const identity = resolveAgencyIdentity(req);
    let values = {};
    if (step.collection) {
        const repeater = definition.substeps
            .flatMap((substep) => substep.children)
            .flatMap((child) => child.widgets)
            .find((widget) => widget.type === "COLLECTION_REPEATER");
        values = {
            [String(repeater?.path || repeater?.key || "records").replace(/^\$/, "")]:
                await loadCollectionRecords(step.collection, tour?._id),
        };
    } else if (step.stepKey === "review") values = stepValuesForTour(step, tour || {});
    else if (tour) values = stepValuesForTour(step, tour);
    applyProductDefinition(definition, values, productKey);
    if (step.stepKey === "commercial" && !tour) {
        values = {
            commercial: {
                version: "COMPONENTS_V1",
                currency: "INR",
                defaultBasis: {
                    adults: 1,
                    children: 0,
                    infants: 0,
                    rooms: 1,
                    vehicles: 1,
                    nights: 1,
                    days: 1,
                },
                pricingPolicy: {
                    feeType: "PERCENTAGE",
                    feePercent: 10,
                    feeAmountMinor: 0,
                    gstPercent: 18,
                    gstOn: "AGENT_FEE",
                },
                components: [],
                packages: [],
            },
        };
    }
    values = stripWidgetValues(
        definition.substeps
            .flatMap((substep) => substep.children)
            .flatMap((child) => child.widgets),
        values,
        capabilities,
    );
    definition.substeps.forEach((substep) =>
        substep.children.forEach((child) => {
            markServerManagedWidgets(child.widgets || [], values, identity);
        }),
    );

    const neighbours = stepNeighbours(stepKey);
    const process = getProcessSnapshot(getBuilderProcessDefinition(), tour?.builderProcess || {});
    const stepContract = createBuilderLabelContract({
        ...definition,
        actions: { ...definition.actions },
    });
    return {
        builder: {
            key: TOUR_BUILDER_KEY,
            version: TOUR_BUILDER_VERSION,
            tourId: tour?._id?.toString() || tourId || null,
            currentStepKey: stepKey,
            productKey,
            ...neighbours,
        },
        step: stepContract.structure,
        elements: stepContract.elements,
        data: values || {},
        navigation: neighbours,
        permissions: capabilities,
        meta: {
            productKey,
            constraints:
                productKey === "trevio"
                    ? { fixedDeparturesOnly: true, multipleDepartures: true }
                    : {},
            tourStatus: tour?.status || null,
            isPublished: tour ? tour.status === "published" : false,
            branding: req.access?.agency
                ? {
                      name: req.access.agency.agencyName || "",
                      logo: req.access.agency.logo || "",
                      ref: req.access.agency.partnerAgencyRef || "",
                  }
                : null,
            process: {
                status: process.status,
                progress: process.progress,
                completedStepKeys: process.completedStageIds,
                currentStepKey: process.currentNodeId,
            },
        },
    };
}

/** Persist wizard position without accepting or mutating any tour fields. */
export async function saveBuilderPosition(req, { tourId, stepKey, productKey }) {
    if (!tourId)
        throw Object.assign(new Error("A saved tour is required to track builder position."), {
            status: 409,
        });
    if (!findStepDefinition(stepKey))
        throw Object.assign(new Error(`Unknown builder step "${stepKey}"`), { status: 404 });

    const tour = await TourRepository.findById(tourId);
    if (!tour) throw Object.assign(new Error("Tour draft not found"), { status: 404 });
    if (!canModifyTour(req.user, tour, req.access))
        throw Object.assign(new Error("You cannot edit this tour"), { status: 403 });
    resolveProductKey(req, productKey, tour);

    const definition = getBuilderProcessDefinition();
    const process = getProcessSnapshot(definition, tour.builderProcess || {});
    const currentStageKey = findStepDefinition(process.currentNodeId)
        ? process.currentNodeId
        : BUILDER_STEPS[0].stepKey;
    const transition = applyProcessAction(definition, tour.builderProcess || {}, {
        nodeId: currentStageKey,
        targetNodeId: stepKey,
        action: PROCESS_ACTION.GO_TO,
        data: tour.toObject ? tour.toObject() : tour,
    });
    if (!transition.ok) {
        throw Object.assign(
            new Error(transition.errors?.process || "Could not update builder position"),
            { status: 422 },
        );
    }

    tour.builderProcess = { ...transition.process, updatedAt: new Date() };
    await tour.save();
    return {
        success: true,
        tourId: tour._id.toString(),
        currentStepKey: transition.process.currentNodeId,
    };
}

/* -------------------------------- saving -------------------------------- */

/**
 * Realtime fan-out for builder saves. A newly created draft nudges the owning
 * agency + admins only; the moment a tour becomes publicly visible it is
 * broadcast to the shared catalog room so open listing pages (e.g. the Trevista
 * tours page) refresh without a reload. Safe DTOs only, never raw models.
 */
const publishBuilderTourRealtime = (previousStatus, savedTour) => {
    try {
        const dto = tourDto(savedTour);
        const tourTitle = dto.title || "Tour";
        const becameUnavailable =
            previousStatus === "published" && savedTour?.status !== "published";
        if (previousStatus) {
            publishToTour(String(savedTour._id), REALTIME_EVENTS.TOUR_UPDATED, dto, {
                notify: realtimeNotify(
                    becameUnavailable ? "Tour is no longer available" : "Tour updated",
                    becameUnavailable
                        ? `${tourTitle} was just unpublished. We will show the closest available alternatives.`
                        : `${tourTitle} was updated.`,
                    becameUnavailable ? "info" : "success",
                    `tour:${dto.tourId || savedTour._id}:${becameUnavailable ? "unavailable" : "updated"}`,
                ),
            });

            // Existing public tours must invalidate open catalog pages for
            // card edits (featured/trending included) and unpublishing.
            if (previousStatus === "published") {
                publishToCatalog(REALTIME_EVENTS.TOUR_UPDATED, dto);
            }
        }
        if (!previousStatus) {
            publishFanOut({ agencyId: dto.agencyId }, REALTIME_EVENTS.TOUR_CREATED, dto, {
                notify: realtimeNotify(
                    "Tour draft created",
                    `${tourTitle} was saved as a draft.`,
                    "success",
                    `tour:${dto.tourId || savedTour._id}:created`,
                ),
            });
        }
        if (previousStatus !== "published" && savedTour?.status === "published") {
            publishToCatalog(REALTIME_EVENTS.TOUR_PUBLISHED, dto);
            publishFanOut(
                { agencyId: dto.agencyId, skipAdmins: true },
                REALTIME_EVENTS.TOUR_PUBLISHED,
                dto,
                {
                    notify: realtimeNotify(
                        "Tour published",
                        `${tourTitle} is now live.`,
                        "success",
                        `tour:${dto.tourId || savedTour._id}:published`,
                    ),
                },
            );
        }
    } catch (error) {
        console.error("[TourBuilder] realtime publish failed:", error?.message);
    }
};

export async function saveBuilderStep(req, { tourId, stepKey, data, productKey: requestedProductKey }) {
    const step = findStepDefinition(stepKey);
    if (!step) throw Object.assign(new Error(`Unknown builder step "${stepKey}"`), { status: 404 });

    let tour = null;
    if (tourId) {
        tour = await TourRepository.findById(tourId);
        if (!tour) throw Object.assign(new Error("Tour draft not found"), { status: 404 });
        if (!canModifyTour(req.user, tour, req.access))
            throw Object.assign(new Error("You cannot edit this tour"), { status: 403 });
    }
    const productKey = resolveProductKey(req, requestedProductKey, tour);
    if (productKey === "trevio" && stepKey === "packaging") {
        data = { ...(data || {}), packageType: "fixed_departure" };
    }

    /* Collection-backed steps replace their document sets. */
    if (step.collection) {
        if (!tour)
            throw Object.assign(new Error("Save earlier steps before managing this section"), {
                status: 409,
            });
        const savedRecords = await saveCollectionStep(req, tour, stepKey, data);
        const transition = applyProcessAction(
            getBuilderProcessDefinition(),
            tour.builderProcess || {},
            {
                nodeId: stepKey,
                data: tour.toObject ? tour.toObject() : tour,
            },
        );
        if (transition.ok) {
            tour.builderProcess = { ...transition.process, updatedAt: new Date() };
            await tour.save();
        }
        const neighbours = stepNeighbours(stepKey);
        return {
            success: true,
            saved: true,
            tourId: tour._id.toString(),
            data: savedRecords,
            ...neighbours,
        };
    }

    if (step.readOnlyStep) {
        if (!tour) {
            throw Object.assign(
                new Error(
                    "The saved tour draft could not be identified. Reopen the builder from Tours.",
                ),
                { status: 409 },
            );
        }
        const transition = applyProcessAction(
            getBuilderProcessDefinition(),
            tour.builderProcess || {},
            {
                nodeId: stepKey,
                data: tour.toObject ? tour.toObject() : tour,
            },
        );
        if (!transition.ok) {
            const error = Object.assign(
                new Error(transition.message || "Complete the required tour steps before review."),
                { status: 422 },
            );
            error.details = transition.errors || {};
            throw error;
        }
        tour.builderProcess = { ...transition.process, updatedAt: new Date() };
        await tour.save();
        const neighbours = stepNeighbours(stepKey);
        return {
            success: true,
            saved: false,
            tourId: tour._id.toString(),
            status: tour.status,
            data: stepValuesForTour(step, tour),
            ...neighbours,
        };
    }

    /* Guard: reject payloads touching paths the step does not own. */
    const foreignPaths = [];
    const scanForeign = (value, prefix) => {
        Object.entries(value || {}).forEach(([key, nested]) => {
            const path = prefix ? `${prefix}.${key}` : key;
            if (!ownsPath(stepKey, path)) foreignPaths.push(path);
            else if (isObject(nested) && !path.startsWith("commercial")) scanForeign(nested, path);
        });
    };
    scanForeign(data, "");
    if (foreignPaths.length) {
        throw Object.assign(
            new Error(`This step cannot modify: ${foreignPaths.slice(0, 5).join(", ")}`),
            { status: 422 },
        );
    }

    const payload = pickOwnedPaths(data, step.ownedPaths || []);
    if (!Object.keys(payload).length) {
        const neighbours = stepNeighbours(stepKey);
        return {
            success: true,
            saved: false,
            tourId: tour?._id?.toString() || null,
            ...neighbours,
        };
    }

    if (stepKey === "commercial") {
        payload.commercial = payload.commercial || {};
        payload.commercial.version = "COMPONENTS_V1";
        if (productKey === "trevio") {
            const enabledPackages = (payload.commercial.packages || []).filter(
                (item) => item?.enabled !== false,
            );
            if (enabledPackages.length < 1 || enabledPackages.length > 2) {
                const error = Object.assign(
                    new Error("Trevio trips must offer one package or two package variants."),
                    { status: 422 },
                );
                error.details = {
                    "commercial.packages":
                        "Add one package, or two variants such as without flights and with flights.",
                };
                throw error;
            }
        }
    }
    const checkpointState = getTourCheckpointPublishingState(tour);
    const sanitized = sanitizeTourPayloadForUpdate(payload, {
        allowIncompleteCommercial: checkpointState.status !== "published",
    });

    // Capability gates re-checked server side.
    const capabilities = capabilitiesFor(req, tour);
    if (
        sanitized.status !== undefined &&
        sanitized.status !== tour?.status &&
        !capabilities.canPublish
    ) {
        throw Object.assign(
            new Error("You do not have permission to change the tour publishing status."),
            { status: 403 },
        );
    }
    // Merchandising and analytics are backend intelligence outputs. No portal
    // role, including an agent or admin, may submit their resulting values.
    delete sanitized.featured;
    delete sanitized.trending;
    delete sanitized.metrics;
    delete sanitized.intelligence;
    delete sanitized.tremVerified;
    delete sanitized.reviews;
    if (sanitized.featuredRequest !== undefined) {
        const requested = sanitized.featuredRequest?.requested === true;
        const actor = req.access?.user || req.user || {};
        sanitized.featuredRequest = {
            ...(tour?.featuredRequest?.toObject?.() || tour?.featuredRequest || {}),
            requested,
            status: requested ? "pending" : "not_requested",
            requestedAt: requested ? new Date() : null,
            requestedBy: requested ? actor._id || actor.sub || actor.id || null : null,
            evaluatedAt: null,
            reason: requested
                ? "Waiting for TravelsTREM intelligence review."
                : "Featured consideration has not been requested.",
        };
    }
    if (sanitized.slug !== undefined && !capabilities.canEditPlatformMeta) delete sanitized.slug;
    if (sanitized.visibility !== undefined && !capabilities.canEditVisibility)
        delete sanitized.visibility;

    /* Identity fields are server-owned: drop whatever the client sent
       (manual form or pasted JSON, including empty overrides). */
    const identity = resolveAgencyIdentity(req);
    SERVER_IDENTITY_FIELDS.forEach((field) => delete sanitized[field]);

    const previousStatus = tour?.status ?? null;

    let savedTour = tour;
    if (!savedTour) {
        const actor = req.access?.user || req.user || {};
        savedTour = new Tour({
            ...sanitized,
            title: sanitized.title || "Untitled tour draft",
            city: sanitized.city || { from: "", to: "" },
            address: sanitized.address || {},
            distance: sanitized.distance ?? 0,
            period: sanitized.period || { days: 1, nights: 0 },
            price: sanitized.price || { min: 0, max: 0, currency: "INR" },
            maxGroupSize: sanitized.maxGroupSize ?? 1,
            agencyId: req.access?.agencyId || actor.agencyId || null,
            ownerAgent:
                identity.agentRef !== undefined ? actor._id || actor.sub || actor.id || null : null,
            createdBy: actor._id || actor.sub || actor.id || null,
            productKey,
            agentTour: identity.agentRef !== undefined,
            inventorySource: identity.agentRef !== undefined ? "agent" : "platform",
            status: "draft",
            isPublished: false,
            ...identity,
            providerName: identity.providerName || sanitized.providerName || PLATFORM_PROVIDER_NAME,
        });
        applyIdentity(savedTour, identity);
    } else {
        // Preserve the current publishing state for ordinary step saves, but
        // let an explicitly submitted, authorised status win on this step.
        Object.assign(savedTour, checkpointState, sanitized);
        applyIdentity(savedTour, identity);
    }

    // Commercial completion is atomic: calculate the authoritative totals
    // before marking the process node complete or writing the draft.
    if (stepKey === "commercial") {
        try {
            const recalculated = { ...savedTour.toObject(), ...sanitized };
            await applyDerivedCommercialPrice(recalculated, req);
            savedTour.commercial = recalculated.commercial;
            savedTour.price = recalculated.price;
            if (recalculated.departures) savedTour.departures = recalculated.departures;
        } catch (derivedError) {
            derivedError.status = derivedError.status || 422;
            derivedError.details = derivedError.details || {
                "commercial.derived": derivedError.message,
            };
            throw derivedError;
        }
    }

    const transition = applyProcessAction(
        getBuilderProcessDefinition(),
        savedTour.builderProcess || {},
        {
            nodeId: stepKey,
            data: savedTour.toObject ? savedTour.toObject() : savedTour,
            context: { actor: req.user, access: req.access },
        },
    );
    if (!transition.ok) {
        const error = new Error(Object.values(transition.errors)[0] || "This step is incomplete");
        error.status = 422;
        error.details = transition.errors;
        throw error;
    }
    savedTour.builderProcess = { ...transition.process, updatedAt: new Date() };
    applyTourIntelligence(savedTour);
    await savedTour.save();

    if (
        stepKey !== "commercial" &&
        (sanitized.commercial !== undefined ||
            sanitized.seasonalPricing !== undefined ||
            sanitized.flights !== undefined ||
            sanitized.packageType !== undefined ||
            sanitized.period !== undefined)
    ) {
        try {
            const recalculated = { ...savedTour.toObject(), ...sanitized };
            await applyDerivedCommercialPrice(recalculated, req);
            savedTour.commercial = recalculated.commercial;
            savedTour.price = recalculated.price;
            if (recalculated.departures) savedTour.departures = recalculated.departures;
            await savedTour.save();
        } catch (derivedError) {
            if (savedTour.status === "published") {
                derivedError.status = derivedError.status || 422;
                derivedError.details = derivedError.details || {
                    "commercial.derived": derivedError.message,
                };
                throw derivedError;
            }
            // Other draft steps may change pricing context before commercial
            // setup is complete; the commercial checkpoint remains authoritative.
        }
    }

    if (Array.isArray(savedTour.departures) && savedTour.departures.length) {
        await syncDerivedTourDeparture(savedTour).catch(() => {});
    }

    savedTour = (await refreshTourIntelligence(savedTour._id, { publish: false })) || savedTour;
    await syncTrevioBuilderTrip(savedTour);
    publishBuilderTourRealtime(previousStatus, savedTour);

    const neighbours = stepNeighbours(stepKey);
    return {
        success: true,
        saved: true,
        tourId: savedTour._id.toString(),
        status: savedTour.status,
        data: stepValuesForTour(step, savedTour),
        ...neighbours,
    };
}

/**
 * Calculates an unsaved commercial draft with the same FinancialEngine path
 * used during persistence. Nothing is written and no price is trusted from
 * the browser; this endpoint only returns a server-owned projection.
 */
export async function previewBuilderPricing(req, { tourId, data, productKey }) {
    if (!tourId)
        throw Object.assign(
            new Error("Save the earlier tour steps before calculating package prices"),
            { status: 409 },
        );

    const tour = await TourRepository.findById(tourId);
    if (!tour) throw Object.assign(new Error("Tour draft not found"), { status: 404 });
    if (!canModifyTour(req.user, tour, req.access)) {
        throw Object.assign(new Error("You cannot edit this tour"), { status: 403 });
    }
    resolveProductKey(req, productKey, tour);

    const sanitized = sanitizeTourPayloadForUpdate(
        { commercial: data?.commercial },
        {
            allowIncompleteCommercial: true,
        },
    );
    const enabledPackages = (sanitized.commercial?.packages || []).filter(
        (item) => item.enabled !== false,
    );
    if (!sanitized.commercial?.components?.length || !enabledPackages.length) {
        throw Object.assign(
            new Error("Add cost components and enable at least one package to calculate pricing"),
            { status: 422 },
        );
    }

    const preview = { ...tour.toObject(), commercial: sanitized.commercial };
    await applyDerivedCommercialPrice(preview, req);
    return {
        derived: preview.commercial.derived,
        price: preview.price,
    };
}

export { BUILDER_STEPS, TOUR_BUILDER_KEY, TOUR_BUILDER_VERSION };
