import logger from "../../../shared/logger/index.js";
import MockFlightProvider from "./mock/mock-flight.provider.js";

const creators = new Map([["mock", (options) => new MockFlightProvider(options)]]);
const instances = new Map();

export const registerFlightProvider = (name, creator) => creators.set(String(name).toLowerCase(), creator);
export const resetFlightProviderFactory = () => instances.clear();

export const createFlightProvider = (name = process.env.FLIGHT_PROVIDER || "mock", options = {}) => {
    const key = String(name).trim().toLowerCase();
    const creator = creators.get(key);
    if (!creator) throw new Error(`Unsupported flight provider: ${key}`);
    if (options.fresh) return creator(options);
    if (!instances.has(key)) {
        instances.set(key, creator(options));
        logger.info("[Flights] provider selected", { provider: key });
    }
    return instances.get(key);
};
