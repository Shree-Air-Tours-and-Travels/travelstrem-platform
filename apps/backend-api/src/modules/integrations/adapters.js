import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { registerIntegrationAdapter } from "./registry.js";
import { createSmtpProvider } from "../../config/mail.js";
import RazorpayProvider from "../../core/financial-engine/providers/razorpay.provider.js";
import HotelBedsClient from "../hotels/providers/hotel_beds/hotel_beds.client.js";
import StayingApiClient from "../hotels/providers/stayingapi/stayingapi.client.js";
import TrekkoClient from "../hotels/providers/trekko/trekko.client.js";

const required = (configuration, fields) => {
    const missing = fields.filter((field) => !configuration.credentials?.[field]);
    if (missing.length)
        throw Object.assign(new Error("Required integration credentials are missing."), {
            code: "INTEGRATION_CREDENTIALS_MISSING",
        });
};

registerIntegrationAdapter("travel.flights", "mock", {
    validate(configuration) {
        if (process.env.NODE_ENV === "production")
            throw Object.assign(new Error("Mock flights cannot be activated in production."), {
                code: "DEMO_PROVIDER_FORBIDDEN",
            });
        return configuration;
    },

});

const hotelConfig = (provider, configuration) => ({
    name: provider,
    environment: process.env[`HOTEL_${provider.toUpperCase()}_ENVIRONMENT`] || "sandbox",
    baseUrl: process.env[`HOTEL_${provider.toUpperCase()}_BASE_URL`] || "",
    requestTimeoutMs: Number(configuration.options.requestTimeoutMs || 10000),
    credentials: configuration.credentials,
});

registerIntegrationAdapter("travel.hotels", "hotelbeds", {
    validate: (configuration) => required(configuration, ["apiKey", "apiSecret"]),
    testScope: "supplier_status_read_only",
    async test(configuration) {
        const client = new HotelBedsClient(hotelConfig("hotelbeds", configuration));
        await client.request("connectionTest", { method: "GET", url: "/hotel-api/1.0/status" });
    },
});

registerIntegrationAdapter("travel.hotels", "trekko", {
    validate: (configuration) => required(configuration, ["apiKey", "apiSecret"]),
    testScope: "supplier_search_read_only",
    async test(configuration) {
        const client = new TrekkoClient(hotelConfig("trekko", configuration));
        await client.searchDestinations({ query: "Delhi" });
    },
});
registerIntegrationAdapter("travel.hotels", "stayingapi", {
    validate: (configuration) => required(configuration, ["apiKey"]),
    testScope: "supplier_search_read_only",
    async test(configuration) {
        const start = new Date(Date.now() + 30 * 86400000);
        const end = new Date(start.getTime() + 86400000);
        const date = (value) => value.toISOString().slice(0, 10);
        const client = new StayingApiClient(hotelConfig("stayingapi", configuration), {
            asyncTimeoutMs: 10000,
        });
        await client.searchHotels({
            location: "Delhi",
            checkIn: date(start),
            checkOut: date(end),
            adults: 1,
            children: 0,
            rooms: 1,
            currency: "INR",
            limit: 1,
        });
    },
});

registerIntegrationAdapter("payments", "razorpay", {
    validate(configuration) {
        required(configuration, ["keyId", "keySecret", "webhookSecret"]);
        if (!String(configuration.credentials.keyId).startsWith("rzp_"))
            throw Object.assign(new Error("Invalid Razorpay key ID."), {
                code: "PAYMENT_CREDENTIAL_FORMAT_INVALID",
            });
    },
    testScope: "razorpay_read_only",
    async test(configuration) {
        const provider = new RazorpayProvider({
            keyId: configuration.credentials.keyId,
            keySecret: configuration.credentials.keySecret,
            webhookSecret: configuration.credentials.webhookSecret,
            apiBaseUrl: configuration.options.apiBaseUrl,
            timeoutMs: configuration.options.timeoutMs,
        });
        await provider.request("/orders?count=1", undefined, "GET");
    },
});

for (const provider of ["r2", "s3"])
    registerIntegrationAdapter("storage.documents", provider, {
        validate(configuration) {
            required(
                configuration,
                provider === "r2"
                    ? ["accessKeyId", "secretAccessKey", "bucketName"]
                    : ["bucketName", "region"],
            );
        },
        testScope: "bucket_access_only",
        async test(configuration) {
            const c = configuration.credentials;
            const endpoint = provider === "r2" ? c.endpoint || (c.accountId ? `https://${c.accountId}.r2.cloudflarestorage.com` : undefined) : undefined;
            if (provider === "r2" && !endpoint) throw new Error("R2 endpoint is required.");
            if (Boolean(c.accessKeyId) !== Boolean(c.secretAccessKey)) throw new Error("Incomplete storage keys.");
            const client = new S3Client({
                region: provider === "r2" ? "auto" : c.region, endpoint,
                ...(c.accessKeyId ? { credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey, sessionToken: c.sessionToken } } : {}),
            });
            try { await client.send(new HeadBucketCommand({ Bucket: c.bucketName }), { abortSignal: AbortSignal.timeout(10000) }); }
            finally { client.destroy(); }
        },
    });

registerIntegrationAdapter("notifications.email", "smtp", {
    validate: (configuration) =>
        required(configuration, ["host", "port", "user", "pass", "fromEmail"]),
    testScope: "smtp_authentication_only",
    async test(configuration) {
        const provider = createSmtpProvider(configuration.credentials);
        try { await provider.verify(); }
        finally { provider.close?.(); }
    },
});
