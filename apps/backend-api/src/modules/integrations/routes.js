import "./adapters.js";
import express from "express";
import TenantIntegrationProfile from "./models/TenantIntegrationProfile.js";
import { INTEGRATION_CAPABILITIES, tenantHasCapability } from "./capabilities.js";
import { materializeIntegrationEntry } from "./runtime.js";
import { validateIntegrationConfiguration } from "./registry.js";
import { audit } from "../tenancy/audit.service.js";

const router = express.Router();
const currentEnvironment = () => process.env.PORTAL_ENV || process.env.NODE_ENV || "development";
const handle = (fn) => async (req, res, next) => {
    try {
        await fn(req, res);
    } catch (error) {
        next(error);
    }
};
const fail = (status, message, code = "INTEGRATION_CONFIGURATION_INVALID") => {
    throw Object.assign(new Error(message), { status, code });
};
const publicProfile = (profile) => {
    if (!profile) return null;
    const source = profile.toObject ? profile.toObject() : profile;
    return {
        tenantId: source.tenantId,
        environment: source.environment,
        status: source.status,
        version: source.version,
        updatedAt: source.updatedAt,
        entries: (source.entries || []).map((entry) => ({
            capability: entry.capability,
            provider: entry.provider,
            ownership: entry.ownership,
            status: entry.status,
            options: entry.options || {},
            secretConfigured: Boolean(entry.secretRef),
            validation: entry.validation,
            activatedAt: entry.activatedAt,
        })),
    };
};
const findProfile = (req) =>
    TenantIntegrationProfile.findOne({
        tenantId: req.tenant.id,
        environment: currentEnvironment(),
    });

router.get(
    "/",
    handle(async (req, res) => {
        const profile = await findProfile(req).lean();
        res.json({ status: "success", componentData: { data: publicProfile(profile) } });
    }),
);

router.put(
    "/",
    handle(async (req, res) => {
        if (!Array.isArray(req.body?.entries)) fail(422, "Integration entries are required.");
        const existing = await findProfile(req);
        const existingSecretRefs = new Map(
            (existing?.entries || []).map((entry) => [entry.capability, entry.secretRef]),
        );
        const entries = req.body.entries.map((entry) => {
            if (!INTEGRATION_CAPABILITIES.includes(entry.capability))
                fail(422, "Unsupported integration capability.");
            if (!tenantHasCapability(req.tenant.client, entry.capability))
                fail(422, `${entry.capability} is not included in this tenant's products.`);
            return {
                capability: entry.capability,
                provider: entry.provider,
                ownership: entry.ownership,
                secretRef:
                    entry.secretRef === undefined
                        ? existingSecretRefs.get(entry.capability) || ""
                        : entry.secretRef,
                options: entry.options || {},
                status: "draft",
                validation: { status: "not_run" },
            };
        });
        if (new Set(entries.map((entry) => entry.capability)).size !== entries.length)
            fail(422, "Each integration capability may be configured only once.");
        const candidate = new TenantIntegrationProfile({ tenantId: req.tenant.id, environment: currentEnvironment(), entries });
        await candidate.validate();
        const before = publicProfile(existing);
        const profile = await TenantIntegrationProfile.findOneAndUpdate(
            { tenantId: req.tenant.id, environment: currentEnvironment() },
            {
                $set: { status: "draft", entries, updatedBy: req.user.sub },
                $setOnInsert: { createdBy: req.user.sub },
                $inc: { version: 1 },
            },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
        );
        await audit(req, {
            action: "tenant.integration_profile.updated",
            entityType: "TenantIntegrationProfile",
            entityId: profile._id,
            before,
            after: publicProfile(profile),
        });
        res.json({ status: "success", componentData: { data: publicProfile(profile) } });
    }),
);

const validateEntry = (testConnection) =>
    handle(async (req, res) => {
        const profile = await findProfile(req);
        const entry = profile?.entries.find((item) => item.capability === req.params.capability);
        if (!entry) fail(404, "Integration capability is not configured.", "INTEGRATION_NOT_FOUND");
        let result;
        try {
            const configuration = materializeIntegrationEntry(req.tenant.client, entry.toObject());
            result = await validateIntegrationConfiguration(configuration, { testConnection });
        } catch {
            result = { ok: false, code: "INTEGRATION_VALIDATION_FAILED", message: "Integration validation failed." };
        }
        entry.status = result.ok ? "validated" : "draft";
        entry.validation = {
            status: result.ok ? "passed" : "failed",
            checkedAt: new Date(),
            scope: result.scope || "configuration_only",
            code: result.code,
            message: result.message,
        };
        profile.status = "draft";
        profile.updatedBy = req.user.sub;
        profile.version += 1;
        await profile.save();
        await audit(req, {
            action: testConnection ? "tenant.integration.tested" : "tenant.integration.validated",
            entityType: "TenantIntegrationProfile",
            entityId: profile._id,
            after: { capability: entry.capability, provider: entry.provider, result },
        });
        res.status(result.ok ? 200 : 422).json({
            status: result.ok ? "success" : "error",
            message: result.message,
            code: result.code,
            componentData: { data: publicProfile(profile) },
        });
    });

router.post("/:capability/validate", validateEntry(false));
router.post("/:capability/test", validateEntry(true));
router.post(
    "/:capability/activate",
    handle(async (req, res) => {
        const profile = await findProfile(req);
        const entry = profile?.entries.find((item) => item.capability === req.params.capability);
        if (!entry) fail(404, "Integration capability is not configured.", "INTEGRATION_NOT_FOUND");
        if (
            entry.validation?.status !== "passed" ||
            !entry.validation?.scope ||
            entry.validation.scope === "configuration_only"
        )
            fail(409, "Run a live connection test before activation.", "INTEGRATION_LIVE_TEST_REQUIRED");
        const configuration = materializeIntegrationEntry(req.tenant.client, entry.toObject());
        const validation = await validateIntegrationConfiguration(configuration, { testConnection: true });
        if (!validation.ok) fail(422, "The live integration connection test failed.", validation.code);
        await audit(req, { action: "tenant.integration.activation_requested", entityType: "TenantIntegrationProfile", entityId: profile._id,
            after: { capability: entry.capability, provider: entry.provider } });
        entry.status = "active";
        entry.activatedAt = new Date();
        entry.activatedBy = req.user.sub;
        profile.status = "active";
        profile.updatedBy = req.user.sub;
        profile.version += 1;
        await profile.save();
        await audit(req, {
            action: "tenant.integration.activated",
            entityType: "TenantIntegrationProfile",
            entityId: profile._id,
            after: {
                capability: entry.capability,
                provider: entry.provider,
                ownership: entry.ownership,
            },
        });
        res.json({ status: "success", componentData: { data: publicProfile(profile) } });
    }),
);

export default router;
