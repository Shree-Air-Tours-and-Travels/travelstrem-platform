import { journeyResolver } from "./journeys.js";

// Product adapters own module selection; the response builder is product agnostic.
export const dashboardResolvers = new Map([
    ["trevio", journeyResolver({ productId: "trevio", wishlist: true })],
    ["trevista", journeyResolver({ productId: "trevista", wishlist: true })],
    ["trehub", journeyResolver({ productId: "trehub", flights: true })],
]);
