import { calculateTourCommercials } from "../services/tour-commercial.service.js";
import { assertMinor } from "../utils/money.js";

/**
 * Tour-only responsibility: resolve the immutable partner/base quote.
 * Platform, tax and gateway calculations remain in the shared engine.
 */
export function prepareTourPricingInput(input = {}) {
    if (
        input.partnerQuoteMinor != null ||
        input.baseAmountMinor != null ||
        input.baseAmount != null
    ) {
        const baseAmountMinor = assertMinor(
            input.partnerQuoteMinor ?? input.baseAmountMinor ?? input.baseAmount,
            "partnerQuoteMinor",
        );
        return {
            productType: "tour",
            baseAmountMinor,
            currency: input.currency,
            commercial: input.commercial || null,
        };
    }
    if (input.tour?.commercial?.version !== "COMPONENTS_V1")
        throw new TypeError("Tour pricing requires a partner quote in integer paise");
    const commercial = calculateTourCommercials({
        tour: input.tour,
        packageKey: input.packageKey || input.selections?.packageKey,
        selections: input.selections,
    });
    return {
        productType: "tour",
        baseAmountMinor: commercial.agentAmountMinor,
        currency: commercial.currency,
        commercial,
    };
}
