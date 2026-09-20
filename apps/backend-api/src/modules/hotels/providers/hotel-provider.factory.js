import AggregateHotelProvider from "./aggregate/aggregate.provider.js";
import HotelBedsProvider from "./hotel_beds/hotel_beds.provider.js";
import StayingApiProvider from "./stayingapi/stayingapi.provider.js";
import TrekkoProvider from "./trekko/trekko.provider.js";
import { createHotelProviderConfig } from "./provider.config.js";

const registeredProviders = new Map([
    ["hotelbeds", (config) => new HotelBedsProvider({ config })],
    ["stayingapi", (config) => new StayingApiProvider({ config })],
    ["trekko", (config) => new TrekkoProvider({ config })],
]);
const assertProvider = (provider, name) => {
    if (
        provider?.name?.toLowerCase() !== name ||
        typeof provider.searchHotels !== "function" ||
        typeof provider.getHotelDetails !== "function"
    )
        throw new Error(`Hotel provider ${name} does not implement the hotel contract.`);
    return provider;
};

export const registerHotelProvider = (name, factory) => {
    registeredProviders.set(String(name).toLowerCase(), factory);
};

const createSingleHotelProvider = async (name) => {
    const key = String(name).toLowerCase();
    if (!/^[a-z][a-z0-9-]*$/.test(key)) throw new Error(`Unsupported hotel provider: ${name}`);

    const registered = registeredProviders.get(key);
    const config = createHotelProviderConfig(key);
    if (registered) return assertProvider(await registered(config), key);

    let module;
    try {
        module = await import(`./${key}/${key}.provider.js`);
    } catch (error) {
        if (error?.code === "ERR_MODULE_NOT_FOUND" && error.message?.includes(`${key}.provider.js`))
            throw new Error(`Unsupported hotel provider: ${name}`, { cause: error });
        throw error;
    }
    const Provider = module.default;
    if (typeof Provider !== "function")
        throw new Error(`Hotel provider ${name} must export a default provider class.`);
    return assertProvider(new Provider({ config }), key);
};

export const createHotelProvider = async (
    names = process.env.HOTEL_PROVIDERS ||
        process.env.HOTEL_PROVIDER ||
        "hotelbeds,stayingapi,trekko",
) => {
    const keys = String(names)
        .split(",")
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean);
    if (!keys.length || new Set(keys).size !== keys.length)
        throw new Error("Hotel provider list must contain unique provider names.");
    const providers = (await Promise.all(keys.map(createSingleHotelProvider))).filter(
        (provider) => process.env.NODE_ENV === "development" || !provider.isDemo,
    );
    if (!providers.length)
        throw new Error(
            "Configure a real hotel provider using HOTEL_PROVIDERS. Mock inventory is disabled.",
        );
    return new AggregateHotelProvider(providers);
};

export { MockHotelProvider } from "./mock/mock.provider.js";
