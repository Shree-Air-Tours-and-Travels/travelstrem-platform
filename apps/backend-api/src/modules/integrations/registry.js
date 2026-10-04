const adapters = new Map();

const key = (capability, provider) => `${capability}:${String(provider).toLowerCase()}`;

export function registerIntegrationAdapter(capability, provider, hooks = {}) {
    if (typeof hooks.validate !== "function")
        throw new Error("Integration adapters must provide a validation hook.");
    adapters.set(key(capability, provider), Object.freeze({ ...hooks }));
}

export function getIntegrationAdapter(capability, provider) {
    return adapters.get(key(capability, provider)) || null;
}

export function listIntegrationAdapters(capability) {
    return [...adapters.entries()]
        .filter(([entry]) => entry.startsWith(`${capability}:`))
        .map(([entry]) => entry.slice(capability.length + 1));
}

export async function validateIntegrationConfiguration(
    configuration,
    { testConnection = false } = {},
) {
    const adapter = getIntegrationAdapter(configuration.capability, configuration.provider);
    if (!adapter)
        return {
            ok: false,
            code: "ADAPTER_NOT_REGISTERED",
            message: "This provider adapter is not registered.",
        };
    try {
        await adapter.validate(configuration);
        if (testConnection) {
            if (typeof adapter.test !== "function")
                return {
                    ok: false,
                    code: "CONNECTION_TEST_UNAVAILABLE",
                    message: "This adapter does not provide a connection test.",
                };
            await adapter.test(configuration);
        }
        return {
            ok: true,
            code: testConnection ? "CONNECTION_OK" : "CONFIGURATION_OK",
            message: testConnection ? "Connection succeeded." : "Configuration is valid.",
            scope: testConnection ? (adapter.testScope || "provider_connection") : "configuration_only",
        };
    } catch {
        // Adapter exceptions can contain provider responses, URLs or credentials.
        return {
            ok: false,
            code: "INTEGRATION_VALIDATION_FAILED",
            message: "Integration validation failed. Check the configured credentials and provider availability.",
        };
    }
}
