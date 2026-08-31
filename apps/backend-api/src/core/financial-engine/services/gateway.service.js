import { FEE_TYPE } from "../constants/index.js";
import { assertMinor, percentageOf, sumMinor } from "../utils/money.js";

const BASIS_POINTS = 10_000n;
const divideRoundUp = (numerator, denominator) =>
    (numerator + denominator - 1n) / denominator;

/**
 * Calculates a gateway charge without using floating point arithmetic.
 * Percentage fees charged to the customer are grossed up so the gateway
 * deduction does not reduce the configured subtotal received by the platform.
 */
export function calculateGatewayFee(baseMinor, config = {}, { grossUp = false } = {}) {
    assertMinor(baseMinor, "gatewayBaseMinor");
    if (!config.enabled)
        return {
            feeMinor: 0,
            taxMinor: 0,
            totalMinor: 0,
            finalPayableMinor: baseMinor,
            grossedUp: false,
        };

    const taxRateBasisPoints = config.taxRateBasisPoints || 0;
    if (!grossUp || config.type !== FEE_TYPE.PERCENTAGE) {
        const feeMinor =
            config.type === FEE_TYPE.FIXED
                ? assertMinor(config.fixedMinor || 0, "gatewayFixedMinor")
                : percentageOf(baseMinor, config.rateBasisPoints || 0);
        const taxMinor = percentageOf(feeMinor, taxRateBasisPoints);
        return {
            feeMinor,
            taxMinor,
            totalMinor: sumMinor([feeMinor, taxMinor]),
            finalPayableMinor: sumMinor([baseMinor, feeMinor, taxMinor]),
            grossedUp: false,
        };
    }

    const rateBasisPoints = BigInt(config.rateBasisPoints || 0);
    const taxBasisPoints = BigInt(taxRateBasisPoints);
    const denominator = BASIS_POINTS * BASIS_POINTS;
    const effectiveRateNumerator = rateBasisPoints * (BASIS_POINTS + taxBasisPoints);
    if (effectiveRateNumerator >= denominator)
        throw new RangeError("Effective gateway rate must be less than 100 percent");

    const finalPayableBigInt = divideRoundUp(
        BigInt(baseMinor) * denominator,
        denominator - effectiveRateNumerator,
    );
    const finalPayableMinor = Number(finalPayableBigInt);
    if (!Number.isSafeInteger(finalPayableMinor))
        throw new RangeError("Gateway gross-up exceeds the supported monetary range");

    const totalMinor = finalPayableMinor - baseMinor;
    const feeSplitDenominator = BASIS_POINTS + taxBasisPoints;
    const feeMinor = Number(
        (BigInt(totalMinor) * BASIS_POINTS + feeSplitDenominator / 2n) /
            feeSplitDenominator,
    );
    // Keep the accounting split equal to the exact gross-up total. The residual
    // absorbs at most the integer-paise rounding difference.
    const taxMinor = totalMinor - feeMinor;
    assertMinor(taxMinor, "gatewayTaxMinor");
    return {
        feeMinor,
        taxMinor,
        totalMinor,
        finalPayableMinor,
        grossedUp: true,
    };
}
