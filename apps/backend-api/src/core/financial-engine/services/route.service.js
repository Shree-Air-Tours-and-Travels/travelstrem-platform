import { calculateFee } from "../engine/calculator.js";
import { percentageOf } from "../utils/money.js";
export function calculateRouteFee(baseMinor, config) {
  const feeMinor = calculateFee(baseMinor, config);
  const taxMinor = percentageOf(feeMinor, config?.taxRateBasisPoints || 0);
  return { feeMinor, taxMinor, totalMinor: feeMinor + taxMinor };
}
