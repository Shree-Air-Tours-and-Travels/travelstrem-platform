import { getRegisteredFlightProviderNames } from "../flights/providers/flight-provider.factory.js";
import { getRegisteredHotelProviderNames } from "../hotels/providers/hotel-provider.factory.js";
import { getR2Config } from "../../services/r2/config.js";

// Configuration inspection only: never return secret values or claim live
// credentials, webhook delivery or supplier booking capability were verified.
export function integrationReadiness(client, profile = null) {
    const env = (key) => String(process.env[key] || "").trim();
    const required = (keys) => keys.filter((key) => !env(key));
    const enabled = (product, service) =>
        client.productAccess?.includes(product) && client.modules?.[product]?.includes(service);
    const integrations = [];
    if (enabled("trehub", "flights")) {
        const provider = env("FLIGHT_PROVIDER") || "mock";
        integrations.push({
            id: "flights",
            provider,
            status:
                provider === "mock"
                    ? "demo_only"
                    : getRegisteredFlightProviderNames().includes(provider)
                      ? "adapter_available"
                      : "adapter_required",
            verification: "not_verified",
        });
    }
    if (enabled("trehub", "hotels")) {
        const providers = (
            env("HOTEL_PROVIDERS") ||
            env("HOTEL_PROVIDER") ||
            "hotelbeds,stayingapi,trekko"
        )
            .split(",")
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean);
        for (const provider of [...new Set(providers)]) {
            const prefix = `HOTEL_${provider.replace(/[^a-z0-9]+/gi, "_").toUpperCase()}`;
            const fields = [
                `${prefix}_API_KEY`,
                ...(provider === "stayingapi" ? [] : [`${prefix}_API_SECRET`]),
                `${prefix}_BASE_URL`,
            ];
            const missing = required(fields);
            integrations.push({
                id: `hotels:${provider}`,
                provider,
                missing,
                status: !getRegisteredHotelProviderNames().includes(provider)
                    ? "adapter_required"
                    : missing.length
                      ? "configuration_missing"
                      : "configured",
                verification: "not_verified",
            });
        }
    }
    const paymentProvider = env("PAYMENT_PROVIDER") || "razorpay";
    const missingPayment = required([
        "RAZORPAY_KEY_ID",
        "RAZORPAY_KEY_SECRET",
        "RAZORPAY_WEBHOOK_SECRET",
        "PAYMENT_APP_URL",
    ]);
    integrations.push({
        id: "payments",
        provider: paymentProvider,
        status:
            paymentProvider !== "razorpay"
                ? "adapter_required"
                : missingPayment.length
                  ? "configuration_missing"
                  : "configured",
        missing: paymentProvider === "razorpay" ? missingPayment : [],
        checkoutPolicy: "development_only",
        webhookPath: `/api/webhooks/payments/${paymentProvider === "razorpay" ? "razorpay" : ":provider"}`,
        verification: "not_verified",
    });
    const storageProvider = env("DOCUMENT_STORAGE_PROVIDER") || "r2";
    let storageConfigured = false;
    try {
        storageConfigured = Boolean(getR2Config());
    } catch {
        /* report unsupported adapter without exposing values */
    }
    integrations.push({
        id: "documents",
        provider: storageProvider,
        status:
            storageProvider === "local"
                ? "development_only"
                : !["r2", "s3"].includes(storageProvider)
                  ? "adapter_required"
                  : storageConfigured
                    ? "configured"
                    : "configuration_missing",
        requiredSettings:
            storageProvider === "s3"
                ? [
                      "AWS_REGION",
                      "AWS_S3_BUCKET",
                      "IAM role or AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY",
                  ]
                : [
                      "R2_ENDPOINT or R2_ACCOUNT_ID",
                      "R2_ACCESS_KEY_ID",
                      "R2_SECRET_ACCESS_KEY",
                      "R2_BUCKET_NAME",
                  ],
        verification: "not_verified",
    });
    const missingEmail = required(["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM_EMAIL"]);
    integrations.push({ id: "email", provider: "smtp", status: missingEmail.length ? "configuration_missing" : "configured", missing: missingEmail, verification: "not_verified" });
    return {
        owner: "per_integration",
        managedBy: "platform",
        assessment: profile ? "tenant_profile" : "legacy_environment",
        profile: profile
            ? {
                  environment: profile.environment,
                  status: profile.status,
                  version: profile.version,
                  entries: profile.entries.map((entry) => ({
                      capability: entry.capability,
                      provider: entry.provider,
                      ownership: entry.ownership,
                      status: entry.status,
                      secretConfigured: Boolean(entry.secretRef),
                      validation: entry.validation,
                  })),
              }
            : null,
        integrations,
        requiredAcceptance: [
            "Tenant database role validation",
            "Supplier sandbox request and booking lifecycle",
            "Payment signature and duplicate-event handling",
            "Private document upload/download",
            "Webhook delivery to the tenant API origin",
        ],
    };
}
