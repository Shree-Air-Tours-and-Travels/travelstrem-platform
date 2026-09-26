import FinancialEngine from "../../../core/financial-engine/index.js";

export const applyFlightFinancials = async ({ price, financialContext = {} }) => {
    const flightSubtotal = Number(price.flightSubtotal ?? price.total ?? 0);
    const travellerCount = (price.passengers || []).reduce(
        (total, passenger) => total + Number(passenger.count || 0),
        0,
    );
    const calculation = await FinancialEngine.calculatePricing({
        productType: "flight",
        baseAmountMinor: flightSubtotal,
        currency: price.currency || "INR",
        paymentProvider: financialContext.paymentProvider || "razorpay",
        agencyId: financialContext.agencyId || null,
        customerType: financialContext.customerType || null,
        ...(financialContext.config ? { config: financialContext.config } : {}),
    });
    const tremFeeInclusiveGst = calculation.platformFee.totalMinor;
    const razorpayFeeInclusiveGst = calculation.gateway.totalMinor;
    const perTravellerTotal = travellerCount
        ? Number(
              (BigInt(calculation.finalPayableMinor) + BigInt(Math.floor(travellerCount / 2))) /
                  BigInt(travellerCount),
          )
        : calculation.finalPayableMinor;

    return {
        ...price,
        version: calculation.version,
        unit: calculation.moneyUnit === "PAISE" ? "MINOR" : price.unit,
        flightSubtotal,
        travellerCount,
        perTravellerTotal,
        travelsTremFees: tremFeeInclusiveGst,
        tremFee: calculation.platformFee.amountMinor,
        tremFeeGst: calculation.platformFee.gstMinor,
        tremFeeInclusiveGst,
        razorpayFee: calculation.gateway.baseFeeMinor,
        razorpayFeeGst: calculation.gateway.gstMinor,
        razorpayFeeInclusiveGst,
        convenienceFee: calculation.finalPayableMinor - flightSubtotal,
        finalAmount: calculation.finalPayableMinor,
        total: calculation.finalPayableMinor,
        financials: calculation.financials,
        pricingConfigSnapshot: calculation.pricingConfigSnapshot,
    };
};
