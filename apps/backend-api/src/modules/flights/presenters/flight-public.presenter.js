export const publicFlightPrice = (price) => price && Object.fromEntries([
    "currency", "unit", "baseFare", "taxes", "providerFees", "flightSubtotal", "travellerCount",
    "perTravellerTotal", "convenienceFee", "seatFees", "finalAmount", "total", "passengers",
].filter((key) => price[key] !== undefined).map((key) => [key, price[key]]));

export const publicFlightOffer = (offer) => ({
    ...offer,
    price: publicFlightPrice(offer.price),
    fare: { ...offer.fare, pricing: publicFlightPrice(offer.fare?.pricing) },
    fares: offer.fares.map((fare) => ({ ...fare, pricing: publicFlightPrice(fare.pricing) })),
});

export const publicRevalidation = (result) => ({
    ...result,
    currentPrice: publicFlightPrice(result.currentPrice),
    previousPrice: publicFlightPrice(result.previousPrice),
});
