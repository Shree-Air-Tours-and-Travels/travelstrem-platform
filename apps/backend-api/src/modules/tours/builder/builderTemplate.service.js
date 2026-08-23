import mongoose from "mongoose";
import Tour from "../models/Tour.js";
import TourDeparture from "../models/TourDeparture.js";
import { findStepDefinition, getBuilderDefinition } from "./stepDefinitions.js";

/**
 * Schema-grounded JSON templates for the Tour Builder paste-import.
 *
 * Generated straight from the Mongoose schemas so AI assistants (and humans)
 * see every possible field with correct types and enum values. Fields the
 * platform generates or manages server-side are excluded; everything else is
 * fair game to paste into any step that owns it.
 */

const { Schema } = mongoose;

/* Fields generated/managed by the platform — never part of a client payload. */
const EXCLUDED_PATHS = new Set([
    "_id",
    "__v",
    "createdAt",
    "updatedAt",
    "agencyId",
    "createdBy",
    "ownerAgent",
    "productKey",
    "archivedAt",
    "builderProcess",
    "tremVerifiedBy",
    "tremVerifiedAt",
]);

/* Computed by the FinancialEngine / analytics — included as nulls for shape only. */
const COMPUTED_PATHS = new Set(["commercial.derived"]);

const TYPE_DEFAULTS = new Map([
    [String, ""],
    [Number, 0],
    [Boolean, false],
    [Date, "YYYY-MM-DD"],
    [Schema.Types.ObjectId, ""],
    [Schema.Types.Decimal128, "0.00"],
    [Schema.Types.Mixed, {}],
    [Schema.Types.Buffer, null],
]);

const isSchemaLike = (value) =>
    value instanceof Schema ||
    (value &&
        typeof value === "object" &&
        typeof value.tree === "object" &&
        typeof value.path === "function");

/* Safety net: schema graphs are finite; exceeding this means a cycle leaked through. */
const MAX_DEPTH = 64;

/**
 * Resolves a raw tree descriptor into exactly one of:
 *   { kind: "scalar", type }          — leaf typed field (String/Number/…)
 *   { kind: "schema", schema }        — sub-schema instance (bare or via { type })
 *   { kind: "inline", node }          — plain-object subdocument literal
 *   { kind: "list", element }         — array descriptor resolved to its element
 */
const resolveDescriptor = (descriptor, depth) => {
    if (depth > MAX_DEPTH)
        throw new Error("builderTemplate: schema nesting exceeded MAX_DEPTH (cycle?)");
    if (typeof descriptor === "function") return { kind: "scalar", type: descriptor };
    if (Array.isArray(descriptor))
        return { kind: "list", element: resolveDescriptor(descriptor[0], depth + 1) };
    if (!descriptor || typeof descriptor !== "object") return { kind: "scalar", type: String };
    if (isSchemaLike(descriptor)) return { kind: "schema", schema: descriptor };
    if ("type" in descriptor) {
        const inner = descriptor.type;
        if (Array.isArray(inner))
            return { kind: "list", element: resolveDescriptor(inner[0], depth + 1) };
        if (typeof inner === "function") return { kind: "scalar", type: inner };
        if (isSchemaLike(inner)) return { kind: "schema", schema: inner };
        /* Non-type metadata object (shouldn't happen) — degrade to string. */
        return { kind: "scalar", type: String };
    }
    return { kind: "inline", node: descriptor };
};

const scalarFor = (typeValue, path, enums) => {
    if (typeValue === Boolean) return false;
    if (typeValue === Number) return 0;
    if (typeValue === Date) return "YYYY-MM-DD";
    if (typeValue === Schema.Types.ObjectId || typeValue === Schema.Types.Decimal128) return "";
    if (typeValue === Schema.Types.Mixed) return {};
    // Strings: seed enums with their first allowed value so pastes validate.
    const enumList = enums && enums[path];
    return enumList && enumList.length ? enumList[0] : "";
};

/** Emits the template value for a resolved descriptor into `output[key]`. */
const emitResolved = (output, key, path, resolved, enums, depth) => {
    switch (resolved.kind) {
        case "scalar": {
            output[key] = scalarFor(resolved.type ?? String, path, enums);
            return;
        }
        case "schema": {
            output[key] = walkTree(resolved.schema.tree, enums, path, depth + 1);
            return;
        }
        case "inline": {
            output[key] = walkTree(resolved.node, enums, path, depth + 1);
            return;
        }
        case "list": {
            const element = resolved.element;
            if (element.kind === "schema" || element.kind === "inline") {
                /* Subdocument lists get one sample element to show the shape.
                   Item paths stay index-less ("list.field") to match how
                   mongoose registers enum paths on embedded schemas. */
                const holder = {};
                emitResolved(holder, "item", path, element, enums, depth + 1);
                output[key] = [holder.item];
            } else {
                /* Scalar / Mixed lists start empty — paste-ready. */
                output[key] = [];
            }
            return;
        }
        default:
            output[key] = "";
    }
};

const walkTree = (tree, enums, prefix = "", depth = 0) => {
    const output = {};

    Object.entries(tree).forEach(([key, descriptor]) => {
        if (key.startsWith("$")) return;
        const path = prefix ? `${prefix}.${key}` : key;
        if (EXCLUDED_PATHS.has(path)) return;
        emitResolved(output, key, path, resolveDescriptor(descriptor, depth), enums, depth);
    });

    return output;
};

/** Collect enum option lists keyed by dotted schema path ("a.b.0.c" for list items). */
const harvestEnums = (schemaType, path, sink) => {
    if (!schemaType || typeof schemaType !== "object") return;

    const direct = schemaType.enumValues || schemaType.caster?.enumValues;
    if (Array.isArray(direct) && direct.length && !sink[path]) sink[path] = [...direct];

    /* Single nested subschema ({ type: subSchema }). */
    if (schemaType.schema) {
        collectEnumsFromSchema(schemaType.schema, path, sink);
        return;
    }

    /* Document array ([subSchema]) — enumerate the embedded document's paths. */
    const embedded =
        schemaType.$embeddedSchemaType ||
        (schemaType.caster && schemaType.caster.schema ? schemaType.caster : null);
    if (embedded?.schema) collectEnumsFromSchema(embedded.schema, path, sink);
};

const collectEnumsFromSchema = (schema, prefix = "", sink = {}) => {
    Object.entries(schema.paths).forEach(([childPath, childType]) => {
        if (childPath === "_id") return;
        harvestEnums(childType, prefix ? `${prefix}.${childPath}` : childPath, sink);
    });
    return sink;
};

const collectEnums = (schema) => collectEnumsFromSchema(schema);

const stripComputed = (template) => {
    COMPUTED_PATHS.forEach((path) => {
        const segments = path.split(".");
        let cursor = template;
        for (let index = 0; index < segments.length - 1; index += 1) {
            cursor = cursor?.[segments[index]];
            if (!cursor) return;
        }
        if (cursor && segments[segments.length - 1] in cursor) {
            cursor[segments[segments.length - 1]] = null;
        }
    });
    return template;
};

const buildFromSchema = (model) => {
    const enums = collectEnums(model.schema);
    const template = walkTree(model.schema.tree, enums);
    return { template: stripComputed(template), enums };
};

const filterByOwnedPaths = (template, ownedPaths) => {
    const scoped = {};
    ownedPaths.forEach((owned) => {
        const segments = owned.split(".");
        let sourceCursor = template;
        let targetCursor = scoped;
        let reachable = true;
        segments.forEach((segment, index) => {
            if (
                !reachable ||
                sourceCursor == null ||
                typeof sourceCursor !== "object" ||
                !(segment in sourceCursor)
            ) {
                reachable = false;
                return;
            }
            const last = index === segments.length - 1;
            targetCursor[segment] = last
                ? sourceCursor[segment]
                : { ...(targetCursor[segment] || {}) };
            sourceCursor = sourceCursor[segment];
            targetCursor = targetCursor[segment];
        });
    });
    return scoped;
};

const cache = { full: null };

export const TOUR_TEMPLATE_RULES = Object.freeze([
    "Use a stable lowercase stayKey for every itinerary stop, for example leh-stay.",
    "Hotels are interchangeable only when stayKey, location and nights are identical.",
    "Assign exactly one hotel room to each package within a stay; alternative hotels must leave packageKeys empty.",
    "Every room packageKeys value must match a commercial.packages packageKey.",
    "Room and component monetary values are integer minor units (paise for INR); final totals are backend-calculated.",
    "Customer hotel customisation requires packageType custom and customConfig.allowCustomerCustomization true.",
]);

const roomExample = (shape, { roomKey, name, packageKeys, amountMinor }) => ({
    ...shape,
    roomKey,
    name,
    description: `${name} for this itinerary stay.`,
    bedType: "King or twin beds",
    maxAdults: 2,
    maxChildren: 1,
    meals: ["Breakfast"],
    amenities: ["Wi-Fi", "Air conditioning"],
    photos: ["https://example.com/hotel-room.jpg"],
    packageKeys,
    available: true,
    pricing: { ...shape?.pricing, unit: "PER_ROOM_PER_NIGHT", amountMinor, currency: "INR" },
});

/** Adds semantic examples that a raw schema cannot express by itself. */
const addTourTemplateExamples = (template) => {
    const packageShape = template.commercial?.packages?.[0] || {};
    if (template.commercial) {
        template.commercial.version = "COMPONENTS_V1";
        template.commercial.packages = [
            {
                ...packageShape,
                packageKey: "basic",
                tier: "BASIC",
                name: "Basic",
                enabled: true,
                recommended: false,
                includedComponentKeys: [],
                optionalComponentKeys: [],
            },
            {
                ...packageShape,
                packageKey: "standard",
                tier: "STANDARD",
                name: "Standard",
                enabled: true,
                recommended: true,
                includedComponentKeys: [],
                optionalComponentKeys: [],
            },
            {
                ...packageShape,
                packageKey: "premium",
                tier: "PREMIUM",
                name: "Premium",
                enabled: true,
                recommended: false,
                includedComponentKeys: [],
                optionalComponentKeys: [],
            },
        ];
    }
    if (template.customConfig) template.customConfig.allowCustomerCustomization = true;
    const hotelShape = template.hotelOptions?.[0];
    const roomShape = hotelShape?.rooms?.[0];
    if (hotelShape && roomShape) {
        const includedHotel = {
            ...hotelShape,
            optionKey: "destination-primary-hotel",
            stayKey: "destination-stay-1",
            title: "Primary destination hotel",
            propertyName: "Primary destination hotel",
            propertyClass: "4-star",
            location: "Destination",
            address: "Destination address",
            nights: 2,
            photos: ["https://example.com/primary-hotel.jpg"],
            amenities: ["Wi-Fi", "Restaurant", "Pool"],
            packageKeys: [],
            rooms: [
                roomExample(roomShape, {
                    roomKey: "primary-standard",
                    name: "Standard room",
                    packageKeys: ["basic"],
                    amountMinor: 500000,
                }),
                roomExample(roomShape, {
                    roomKey: "primary-deluxe",
                    name: "Deluxe room",
                    packageKeys: ["standard"],
                    amountMinor: 750000,
                }),
                roomExample(roomShape, {
                    roomKey: "primary-suite",
                    name: "Suite",
                    packageKeys: ["premium"],
                    amountMinor: 1100000,
                }),
            ],
            active: true,
        };
        template.hotelOptions = [
            includedHotel,
            {
                ...includedHotel,
                optionKey: "destination-alternative-hotel",
                title: "Alternative hotel in the same destination",
                propertyName: "Alternative destination hotel",
                photos: ["https://example.com/alternative-hotel.jpg"],
                rooms: [
                    roomExample(roomShape, {
                        roomKey: "alternative-standard",
                        name: "Alternative standard room",
                        packageKeys: [],
                        amountMinor: 600000,
                    }),
                    roomExample(roomShape, {
                        roomKey: "alternative-deluxe",
                        name: "Alternative deluxe room",
                        packageKeys: [],
                        amountMinor: 850000,
                    }),
                    roomExample(roomShape, {
                        roomKey: "alternative-suite",
                        name: "Alternative suite",
                        packageKeys: [],
                        amountMinor: 1250000,
                    }),
                ],
                recommended: false,
            },
        ];
    }
    return template;
};

/** Complete tour template + enum hints, generated once per process. */
export const buildFullTourTemplate = () => {
    if (!cache.full) {
        const { template, enums } = buildFromSchema(Tour);
        cache.full = { template: addTourTemplateExamples(template), enums };
    }
    return cache.full;
};

const COLLECTION_MODELS = {
    "tour-departures": () => TourDeparture,
};

/**
 * Template for a builder step:
 *   - tour-field steps → only the branches this step owns
 *   - collection steps → one sample record of the backing collection
 *   - no stepKey      → the complete tour document shape
 */
export const getBuilderTemplatePayload = ({ stepKey } = {}) => {
    if (!stepKey) {
        const { template, enums } = buildFullTourTemplate();
        return {
            scope: "tour",
            label: "Complete tour",
            schemaVersion: "TOUR_BUILDER_V2",
            tour: template,
            enums,
            rules: TOUR_TEMPLATE_RULES,
        };
    }

    const step = findStepDefinition(stepKey);
    if (!step) throw Object.assign(new Error(`Unknown builder step "${stepKey}"`), { status: 404 });

    if (step.collection) {
        const modelFactory = COLLECTION_MODELS[step.collection];
        const model = modelFactory ? modelFactory() : null;
        if (!model) {
            const { template, enums } = buildFullTourTemplate();
            return {
                scope: "tour",
                label: step.title,
                schemaVersion: "TOUR_BUILDER_V2",
                tour: template,
                enums,
                rules: TOUR_TEMPLATE_RULES,
            };
        }
        const { template, enums } = buildFromSchema(model);
        return {
            scope: "collection",
            label: step.title,
            schemaVersion: "TOUR_BUILDER_V2",
            collection: step.collection,
            recordKey: "departures",
            records: [stripComputed(template)],
            enums,
            rules: TOUR_TEMPLATE_RULES,
        };
    }

    const { template, enums } = buildFullTourTemplate();
    return {
        scope: "step",
        label: step.title,
        schemaVersion: "TOUR_BUILDER_V2",
        stepKey,
        tour: filterByOwnedPaths(template, step.ownedPaths || []),
        enums,
        rules: TOUR_TEMPLATE_RULES,
    };
};

/** Overview helper reused by definition consumers. */
export const getBuilderStepSummary = () =>
    getBuilderDefinition().steps.map(({ stepKey, title }) => ({ stepKey, title }));
