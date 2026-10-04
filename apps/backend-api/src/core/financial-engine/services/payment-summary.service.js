import { assertMinor } from "../utils/money.js";

export function calculatePaymentSummary({ totalMinor, paidMinor = 0, refundedMinor = 0 }) {
    assertMinor(totalMinor, "totalMinor");
    assertMinor(paidMinor, "paidMinor");
    assertMinor(refundedMinor, "refundedMinor");
    return {
        totalMinor,
        paidMinor,
        remainingMinor: Math.max(0, totalMinor - paidMinor),
        refundedMinor,
    };
}

export function applyPaymentToSummary(summary, amountMinor) {
    assertMinor(amountMinor, "amountMinor");
    return calculatePaymentSummary({
        totalMinor: summary.totalMinor,
        paidMinor: summary.paidMinor + amountMinor,
        refundedMinor: summary.refundedMinor,
    });
}
