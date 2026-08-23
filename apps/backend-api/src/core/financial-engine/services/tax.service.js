import { percentageOf } from "../utils/money.js";
export const calculateTax = (taxableMinor, rateBasisPoints) =>
    percentageOf(taxableMinor, rateBasisPoints);
