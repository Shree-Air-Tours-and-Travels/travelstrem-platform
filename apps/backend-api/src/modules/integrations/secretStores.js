const stores = new Map();

export function registerSecretStore(scheme, resolver) {
    if (!/^[a-z][a-z0-9-]*$/.test(scheme) || typeof resolver !== "function")
        throw new Error("A valid secret-store scheme and resolver are required.");
    stores.set(scheme, resolver);
}

registerSecretStore("env", (reference) => {
    const environment = String(process.env.PORTAL_ENV || process.env.NODE_ENV || "development").toLowerCase();
    if (
        environment === "production" &&
        (process.env.DEPLOYMENT_SECRET_STORE_ENCRYPTED_AT_REST !== "true" ||
            !String(process.env.DEPLOYMENT_SECRET_STORE_PROVIDER || "").trim())
    )
        throw Object.assign(
            new Error("Encrypted deployment secret storage has not been verified."),
            { code: "DEPLOYMENT_SECRET_ENCRYPTION_UNVERIFIED" },
        );
    const raw = process.env[reference];
    if (!raw)
        throw Object.assign(new Error("The configured integration secret is unavailable."), {
            code: "INTEGRATION_SECRET_UNAVAILABLE",
        });
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
        return parsed;
    } catch {
        throw Object.assign(new Error("The configured integration secret must be a JSON object."), {
            code: "INTEGRATION_SECRET_INVALID",
        });
    }
});

export function resolveSecretReference(secretRef) {
    if (!secretRef) return {};
    const separator = secretRef.indexOf(":");
    const scheme = secretRef.slice(0, separator);
    const reference = secretRef.slice(separator + 1);
    if (scheme === "env" && !/^TENANT_INTEGRATION_[A-Z0-9_]{1,100}$/.test(reference))
        throw Object.assign(
            new Error("Use a deployment-approved TENANT_INTEGRATION_* secret reference."),
            { code: "INTEGRATION_SECRET_REFERENCE_DENIED" },
        );
    const resolver = stores.get(scheme);
    if (!resolver)
        throw Object.assign(
            new Error(`Secret store ${scheme} is not configured on this deployment.`),
            { code: "INTEGRATION_SECRET_STORE_UNAVAILABLE" },
        );
    return resolver(reference);
}
