import { calculateFee } from "../engine/calculator.js";
export const calculateCommission = (amountMinor, config) => calculateFee(amountMinor, config);
