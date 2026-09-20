import HotelProvider from "../../../../providers/travel/contracts/HotelProvider.js";
import ApiError from "../../../../shared/errors/ApiError.js";
import logger from "../../../../shared/logger/index.js";
import { canonicalizeHotels, normalizeHotel } from "../../domain/normalize-hotel.js";

const qualifyHotel = (provider, hotel) => ({
    ...hotel,
    hotelId: `${provider.name}:${hotel.hotelId}`,
    rooms: hotel.rooms.map((room) => ({
        ...room,
        roomId: `${provider.name}:${room.roomId}`,
        providerReference: {
            providerName: provider.name,
            hotelId: hotel.hotelId,
            roomId: room.roomId,
            supplier: room.providerReference || null,
        },
    })),
    providerReference: {
        providerName: provider.name,
        hotelId: hotel.hotelId,
        supplier: hotel.providerReference || null,
        expiresAt: hotel.providerReference?.expiresAt,
    },
});
const providerResultLimit = () => Math.max(1, Number(process.env.HOTEL_PROVIDER_RESULT_LIMIT) || 40);

export default class AggregateHotelProvider extends HotelProvider {
    constructor(providers) {
        super({ name: providers.map((provider) => provider.name).join(",") });
        this.providers = new Map(providers.map((provider) => [provider.name, provider]));
        this.isDemo = providers.some((provider) => provider.isDemo);
        if (this.providers.size !== providers.length)
            throw new Error("Hotel provider names must be unique in an aggregate search.");
    }

    async searchHotels(input) {
        const providers = [...this.providers.values()];
        const executions = providers.map(async (provider) => {
            const startedAt = Date.now();
            try {
                const response = await provider.searchHotels(input);
                if (!Array.isArray(response)) throw new TypeError("Invalid hotel search response");
                const byHotelId = new Map();
                const items = [];
                let skipped = 0;
                for (const item of response.slice(0, providerResultLimit())) {
                    try {
                        const hotel = normalizeHotel(item);
                        const qualified = qualifyHotel(provider, hotel);
                        const existing = byHotelId.get(hotel.hotelId);
                        if (existing) {
                            const roomIds = new Set(existing.rooms.map((room) => room.roomId));
                            existing.rooms.push(
                                ...qualified.rooms.filter((room) => {
                                    if (roomIds.has(room.roomId)) {
                                        skipped += 1;
                                        return false;
                                    }
                                    roomIds.add(room.roomId);
                                    return true;
                                }),
                            );
                            existing.images = [
                                ...new Set([...existing.images, ...qualified.images]),
                            ];
                            existing.amenities = [
                                ...new Set([...existing.amenities, ...qualified.amenities]),
                            ];
                            continue;
                        }
                        byHotelId.set(hotel.hotelId, qualified);
                        items.push(qualified);
                    } catch {
                        skipped += 1;
                    }
                }
                return {
                    name: provider.name,
                    status: "success",
                    items,
                    skipped,
                    durationMs: Date.now() - startedAt,
                };
            } catch (error) {
                logger.error("[Hotels] provider search failed", {
                    provider: provider.name,
                    code: error?.code || "PROVIDER_ERROR",
                });
                return {
                    name: provider.name,
                    status: "failed",
                    items: [],
                    skipped: 0,
                    code: error?.code || "PROVIDER_ERROR",
                    durationMs: Date.now() - startedAt,
                };
            }
        });
        const merge = (outcomes) => {
            const successfulResults = outcomes
                .filter((outcome) => outcome.status === "success")
                .map((outcome) => outcome.items);
            if (!successfulResults.length)
                throw new ApiError(502, "Hotel suppliers are unavailable. Please try again.");
            const hotels = [];
            const longest = Math.max(0, ...successfulResults.map((items) => items.length));
            for (let index = 0; index < longest; index += 1) {
                for (const items of successfulResults) {
                    if (items[index]) hotels.push(items[index]);
                }
            }
            const canonicalHotels = canonicalizeHotels(hotels);
            Object.defineProperty(canonicalHotels, "providerDiagnostics", {
                value: outcomes.map(({ name, status, items, skipped, code, durationMs }) => ({
                    name,
                    status,
                    count: items.length,
                    skipped,
                    ...(code ? { code } : {}),
                    durationMs,
                })),
                enumerable: false,
            });
            return canonicalHotels;
        };
        const completion = Promise.all(executions).then(merge);
        let initialWait;
        const first = await Promise.race([
            Promise.any(
                executions.map((execution) =>
                    execution.then((outcome) => {
                        if (outcome.status !== "success" || !outcome.items.length)
                            throw new Error("Supplier returned no usable stays");
                        return outcome;
                    }),
                ),
            ).catch(() => null),
            new Promise((resolve) => {
                initialWait = setTimeout(() => resolve(null), 750);
            }),
        ]);
        clearTimeout(initialWait);
        const hotels = first ? canonicalizeHotels(first.items) : [];
        Object.defineProperty(hotels, "providerDiagnostics", {
            value: providers.map((provider) =>
                first && provider.name === first.name
                    ? {
                          name: first.name,
                          status: first.status,
                          count: first.items.length,
                          skipped: first.skipped,
                          durationMs: first.durationMs,
                      }
                    : { name: provider.name, status: "loading", count: 0 },
            ),
            enumerable: false,
        });
        Object.defineProperty(hotels, "providerCompletion", {
            value: completion,
            enumerable: false,
        });
        return hotels;
    }

    async getHotelDetails({ hotelId, providerReference, input }) {
        const routings = Array.isArray(providerReference?.suppliers)
            ? providerReference.suppliers
            : [providerReference].filter(Boolean);
        if (!routings.length)
            throw new ApiError(410, "This hotel search is no longer valid. Search again.");
        const outcomes = await Promise.allSettled(
            routings.map(async (routing) => {
                const provider = this.providers.get(routing?.providerName);
                if (!provider || !routing?.hotelId) return null;
                const hotel = await provider.getHotelDetails({
                    hotelId: routing.hotelId,
                    providerReference: routing.supplier,
                    input,
                });
                return hotel ? qualifyHotel(provider, normalizeHotel(hotel)) : null;
            }),
        );
        const hotels = outcomes.flatMap((outcome) =>
            outcome.status === "fulfilled" && outcome.value ? [outcome.value] : [],
        );
        if (!hotels.length) return null;
        return { ...canonicalizeHotels(hotels)[0], hotelId };
    }
}
