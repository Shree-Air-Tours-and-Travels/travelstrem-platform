import logger from "../../../shared/logger/index.js";
import MockFlightProvider from "./mock/mock-flight.provider.js";
import {
    resolveTenantIntegration,
    tenantIntegrationCacheKey,
} from "../../integrations/runtime.js";

const creators = new Map([["mock", (options) => new MockFlightProvider(options)]]);
const instances = new Map();

export const registerFlightProvider = (name, creator) => creators.set(String(name).toLowerCase(), creator);
export const getRegisteredFlightProviderNames = () => [...creators.keys()];
export const resetFlightProviderFactory = () => instances.clear();

export const getConfiguredFlightProviderName = () =>
    String(resolveTenantIntegration("travel.flights").provider || "mock")
        .trim()
        .toLowerCase();

export const createFlightProvider = (name = getConfiguredFlightProviderName(), options = {}) => {
    const runtime = resolveTenantIntegration("travel.flights");
    const key = String(name).trim().toLowerCase();
    const instanceKey = tenantIntegrationCacheKey("travel.flights", key);
    const creator = creators.get(key);
    if (!creator) throw new Error(`Unsupported flight provider: ${key}`);
    const providerOptions = { ...runtime.options, ...runtime.credentials, ...options };
    if (options.fresh) return creator(providerOptions);
    if (!instances.has(instanceKey)) {
        instances.set(instanceKey, creator(providerOptions));
        logger.info("[Flights] provider selected", { provider: key });
    }
    return instances.get(instanceKey);
};
