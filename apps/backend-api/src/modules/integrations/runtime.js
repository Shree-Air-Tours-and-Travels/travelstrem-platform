import { AsyncLocalStorage } from "node:async_hooks";
import TenantIntegrationProfile from "./models/TenantIntegrationProfile.js";
import { resolveSecretReference } from "./secretStores.js";
import { tenantHasCapability } from "./capabilities.js";

const context = new AsyncLocalStorage();
const environment = () => process.env.PORTAL_ENV || process.env.NODE_ENV || "development";
const env = (key, fallback = "") => String(process.env[key] || fallback).trim();

const hotelCredentials = (provider) => {
    const prefix = `HOTEL_${String(provider).replace(/[^a-z0-9]+/gi, "_").toUpperCase()}`;
    return {
        apiKey: env(`${prefix}_API_KEY`),
        apiSecret: env(`${prefix}_API_SECRET`),
    };
};

export function legacyIntegrationConfiguration(capability, selectedProvider) {
    if (capability === "travel.flights")
        return { provider: selectedProvider || env("FLIGHT_PROVIDER", "mock"), options: {}, credentials: {} };
    if (capability === "travel.hotels") {
        const providers = env("HOTEL_PROVIDERS", env("HOTEL_PROVIDER", "hotelbeds,stayingapi,trekko"))
            .split(",")
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean);
        const provider = selectedProvider || providers[0];
        return { provider, options: { providers }, credentials: hotelCredentials(provider) };
    }
    if (capability === "payments")
        return {
            provider: selectedProvider || env("PAYMENT_PROVIDER", "razorpay"),
            options: { apiBaseUrl: env("RAZORPAY_API_BASE_URL"), timeoutMs: Number(env("RAZORPAY_TIMEOUT_MS", "15000")) },
            credentials: { keyId: env("RAZORPAY_KEY_ID"), keySecret: env("RAZORPAY_KEY_SECRET"), webhookSecret: env("RAZORPAY_WEBHOOK_SECRET") },
        };
    if (capability === "storage.documents") {
        const provider = selectedProvider || env("DOCUMENT_STORAGE_PROVIDER", "r2");
        return {
            provider,
            options: {},
            credentials: provider === "s3"
                ? { region: env("AWS_REGION"), bucketName: env("AWS_S3_BUCKET"), accessKeyId: env("AWS_ACCESS_KEY_ID"), secretAccessKey: env("AWS_SECRET_ACCESS_KEY"), sessionToken: env("AWS_SESSION_TOKEN") }
                : { accountId: env("R2_ACCOUNT_ID"), endpoint: env("R2_ENDPOINT"), accessKeyId: env("R2_ACCESS_KEY_ID"), secretAccessKey: env("R2_SECRET_ACCESS_KEY"), bucketName: env("R2_BUCKET_NAME") },
        };
    }
    if (capability === "notifications.email")
        return {
            provider: selectedProvider || "smtp",
            options: {},
            credentials: { host: env("SMTP_HOST"), port: Number(env("SMTP_PORT", "587")), secure: env("SMTP_SECURE") === "true", user: env("SMTP_USER"), pass: env("SMTP_PASS"), fromName: env("SMTP_FROM_NAME"), fromEmail: env("SMTP_FROM_EMAIL") },
        };
    return { provider: selectedProvider || "unconfigured", options: {}, credentials: {} };
}

export async function loadTenantIntegrationProfile(client) {
    if (!client) return null;
    return TenantIntegrationProfile.findOne({
        tenantId: String(client._id),
        environment: environment(),
    }).lean();
}

export function runWithTenantIntegrationContext(value, next) {
    return context.run(value, next);
}

export function currentTenantIntegrationContext() {
    return context.getStore() || null;
}

export function captureTenantIntegrationContext() {
    const runtime = currentTenantIntegrationContext();
    if (!runtime) return null;
    return Object.freeze({
        client: runtime.client,
        profile: runtime.profile,
        tenantId: runtime.tenantId,
    });
}

export async function runWithCapturedTenantIntegrationContext(runtime, next) {
    if (!runtime?.tenantId)
        throw Object.assign(new Error("Background work requires an explicit tenant context."), {
            code: "TENANT_CONTEXT_REQUIRED",
        });
    const deployedTenant = process.env.TENANT_CLIENT_ID;
    if (deployedTenant) {
        if (String(runtime.tenantId) !== deployedTenant)
            throw Object.assign(new Error("Background tenant does not match this deployment."), { code: "TENANT_CONTEXT_MISMATCH", status: 403 });
        const { default: Client } = await import("../clients/models/Client.js");
        const client = await Client.findOne({ _id: deployedTenant, status: "active" }).lean();
        if (!client || client.database?.name !== Client.db.name)
            throw Object.assign(new Error("Background tenant is inactive or unavailable."), { code: "TENANT_CONTEXT_INACTIVE", status: 403 });
        const profile = await loadTenantIntegrationProfile(client);
        if (profile?.status === "suspended")
            throw Object.assign(new Error("Tenant integrations are suspended."), { code: "INTEGRATION_NOT_ACTIVE", status: 503 });
        return runWithTenantIntegrationContext({ client, profile, tenantId: deployedTenant }, next);
    }
    if (runtime.client || runtime.tenantId !== "travelstrem")
        throw Object.assign(new Error("A platform worker cannot execute tenant database work."), { code: "TENANT_CONTEXT_MISMATCH", status: 403 });
    return runWithTenantIntegrationContext({ tenantId: "travelstrem", client: null, profile: null }, next);
}

export function tenantIntegrationCacheKey(capability, provider = "") {
    const runtime = currentTenantIntegrationContext();
    return [runtime?.tenantId || "platform", runtime?.profile?.version || "legacy", capability, provider].join(":");
}

export function materializeIntegrationEntry(client, entry) {
    if (!tenantHasCapability(client, entry.capability))
        throw Object.assign(
            new Error("This integration capability is not enabled for the tenant."),
            { code: "INTEGRATION_CAPABILITY_DISABLED", status: 403 },
        );
    const managed = legacyIntegrationConfiguration(entry.capability, entry.provider);
    const credentials =
        entry.ownership === "tenant" ? resolveSecretReference(entry.secretRef) : managed.credentials;
    return Object.freeze({
        capability: entry.capability,
        source: "tenant-profile",
        provider: entry.provider,
        ownership: entry.ownership,
        options: Object.freeze({ ...(managed.options || {}), ...(entry.options || {}) }),
        credentials: Object.freeze(credentials),
    });
}

export function resolveTenantIntegration(capability, legacy) {
    const runtime = currentTenantIntegrationContext();
    if (runtime?.client && !tenantHasCapability(runtime.client, capability))
        throw Object.assign(new Error("This integration capability is not enrolled."), { status: 403 });
    if (runtime?.profile?.status === "suspended")
        throw Object.assign(new Error("Tenant integrations are suspended."), { status: 503 });
    const entry = runtime?.profile?.entries?.find((item) => item.capability === capability);
    if (!entry)
        return Object.freeze({
            capability,
            source: "legacy",
            ...(legacy ? legacy() : legacyIntegrationConfiguration(capability)),
        });
    if (entry.status !== "active" || entry.validation?.status !== "passed")
        throw Object.assign(new Error("This tenant integration is not active."), {
            code: "INTEGRATION_NOT_ACTIVE",
            status: 503,
        });
    return materializeIntegrationEntry(runtime.client, entry);
}
