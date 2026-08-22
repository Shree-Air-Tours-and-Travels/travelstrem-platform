import FinancialEngine from "../../core/financial-engine/index.js";
import { DEFAULT_FINANCIAL_CONFIG } from "../../core/financial-engine/constants/index.js";
import { mergeConfig } from "../../core/financial-engine/utils/configResolver.js";
import { percentageOf, rupeesToMinor } from "../../core/financial-engine/utils/money.js";
import { resolveFinancialConfig } from "../../core/financial-engine/engine/resolver.js";
import RazorpayProvider from "../../core/financial-engine/providers/razorpay.provider.js";
import crypto from "crypto";

const config = (overrides = {}) => mergeConfig(DEFAULT_FINANCIAL_CONFIG, overrides);

describe("FinancialEngine core", () => {
  test("calculates the ₹1,00,000 commission and GST example entirely in paise", async () => {
    const result = await FinancialEngine.calculateBookingFinancials({ agentAmountMinor: 10_000_000, config: config() });
    expect(Object.keys(result)).toEqual(["agent", "platform", "customer", "gateway", "route", "settlement"]);
    expect(result.platform.commissionMinor).toBe(1_000_000);
    expect(result.platform.gstMinor).toBe(180_000);
    expect(result.customer.payableMinor).toBe(11_180_000);
    expect(result.settlement.agentPayableMinor).toBe(10_000_000);
    expect(result.platform.marginMinor).toBe(1_000_000);
  });

  test("deducts agent-responsible route cost and platform-responsible gateway cost", async () => {
    const result = await FinancialEngine.calculateBookingFinancials({
      agentAmountMinor: 10_000_000,
      config: config({
        gatewayFee: { enabled: true, type: "PERCENTAGE", rateBasisPoints: 200, responsibility: "PLATFORM", taxRateBasisPoints: 1800 },
        routeFee: { enabled: true, type: "FIXED", fixedMinor: 25_000, responsibility: "AGENT", taxRateBasisPoints: 0 },
      }),
    });
    expect(result.gateway.totalMinor).toBe(263_848);
    expect(result.settlement.agentPayableMinor).toBe(9_975_000);
    expect(result.platform.marginMinor).toBe(736_152);
  });

  test("calculates partial refunds and settlement adjustments from snapshots", async () => {
    const financials = await FinancialEngine.calculateBookingFinancials({ agentAmountMinor: 10_000_000, config: config() });
    const refund = await FinancialEngine.calculateRefund({ financials, amountMinor: 5_590_000, config: config() });
    const settlement = await FinancialEngine.calculateSettlement({ financials, paidMinor: 11_180_000, refundedMinor: 5_590_000 });
    expect(refund.kind).toBe("PARTIAL");
    expect(refund.reversals.commissionMinor).toBe(500_000);
    expect(refund.reversals.platformGstMinor).toBe(90_000);
    expect(settlement.agentPayableMinor).toBe(5_000_000);
  });

  test("rejects floating point minor amounts and converts decimal rupees exactly", async () => {
    expect(rupeesToMinor("100000.25")).toBe(10_000_025);
    expect(percentageOf(101, 5000)).toBe(51);
    await expect(FinancialEngine.calculateBookingFinancials({ agentAmountMinor: 100.5, config: config() })).rejects.toThrow("safe integer");
  });

  test("resolves booking over tour over agency over global configuration", async () => {
    const rows = [
      { scopeType: "GLOBAL", scopeId: "default", config: { commission: { rateBasisPoints: 500 }, gatewayFee: { enabled: true } } },
      { scopeType: "AGENCY", scopeId: "agency-1", config: { commission: { rateBasisPoints: 700 } } },
      { scopeType: "TOUR", scopeId: "tour-1", config: { commission: { rateBasisPoints: 900 } } },
      { scopeType: "BOOKING", scopeId: "booking-1", config: { commission: { rateBasisPoints: 1100 } } },
    ];
    const resolved = await resolveFinancialConfig({ agencyId: "agency-1", tourId: "tour-1", bookingId: "booking-1" }, { config: { findActive: async () => rows } });
    expect(resolved.commission.rateBasisPoints).toBe(1100);
    expect(resolved.gatewayFee.enabled).toBe(true);
  });

  test("centralizes generic product tax, fee, discount and token calculations", async () => {
    const quote = await FinancialEngine.calculateQuote({ subtotalMinor: 1_000_000, taxRateBasisPoints: 1800, discountRateBasisPoints: 1000, feeRatesBasisPoints: { service: 500 }, fixedTokenMinor: 200_000, config: { token: { rateBasisPoints: 1500 } } });
    expect(quote.pricing.taxAmountMinor).toBe(180_000);
    expect(quote.pricing.feesMinor.service).toBe(50_000);
    expect(quote.pricing.discountMinor).toBe(123_000);
    expect(quote.pricing.finalPayableMinor).toBe(1_107_000);
    expect(quote.tokenAmountMinor).toBe(200_000);
  });

  test("derives two tour package prices from reusable cost components", async () => {
    const tour = {
      period: { days: 3, nights: 2 },
      commercial: {
        version: "COMPONENTS_V1", currency: "INR",
        components: [
          { componentKey: "hotel-basic", type: "ACCOMMODATION", name: "Basic hotel", pricing: { unit: "PER_ROOM_PER_NIGHT", costAmountMinor: 200000, sellingAmountMinor: 250000 } },
          { componentKey: "hotel-premium", type: "ACCOMMODATION", name: "Premium hotel", replacesComponentKey: "hotel-basic", pricing: { unit: "PER_ROOM_PER_NIGHT", costAmountMinor: 350000, sellingAmountMinor: 450000 } },
          { componentKey: "transfer", type: "TRANSFER", name: "Airport transfer", pricing: { unit: "PER_VEHICLE", costAmountMinor: 100000, sellingAmountMinor: 125000 } },
        ],
        packages: [
          { packageKey: "basic", tier: "BASIC", name: "Basic", includedComponentKeys: ["hotel-basic", "transfer"], optionalComponentKeys: ["hotel-premium"] },
          { packageKey: "premium", tier: "PREMIUM", name: "Premium", includedComponentKeys: ["hotel-premium", "transfer"], optionalComponentKeys: [] },
        ],
      },
    };
    const result = await FinancialEngine.calculateBookingFinancials({ tour, packageKey: "basic", selections: { adults: 2, rooms: 1, nights: 2, vehicles: 1 }, config: config({ commission: { enabled: false }, platformGst: { enabled: false } }) });
    expect(result.commercial.costTotalMinor).toBe(500000);
    expect(result.commercial.sellingTotalMinor).toBe(625000);
    expect(result.commercial.componentMarginMinor).toBe(125000);
    expect(result.customer.payableMinor).toBe(625000);
  });

  test("charges hotel upgrades as a difference and rejects unconfigured add-ons", async () => {
    const tour = { period: { days: 2, nights: 1 }, commercial: { version: "COMPONENTS_V1", currency: "INR", components: [
      { componentKey: "base", type: "ACCOMMODATION", name: "Base", pricing: { unit: "PER_ROOM", costAmountMinor: 100000, sellingAmountMinor: 150000 } },
      { componentKey: "upgrade", type: "ACCOMMODATION", name: "Upgrade", replacesComponentKey: "base", pricing: { unit: "PER_ROOM", costAmountMinor: 160000, sellingAmountMinor: 240000 } },
    ], packages: [
      { packageKey: "basic", tier: "BASIC", name: "Basic", includedComponentKeys: ["base"], optionalComponentKeys: ["upgrade"] },
      { packageKey: "premium", tier: "PREMIUM", name: "Premium", includedComponentKeys: ["upgrade"], optionalComponentKeys: [] },
    ] } };
    const priced = await FinancialEngine.calculateBookingFinancials({ tour, packageKey: "basic", selections: { adults: 1, rooms: 1, optionalComponentKeys: ["upgrade"] }, config: config({ commission: { enabled: false }, platformGst: { enabled: false } }) });
    expect(priced.commercial.sellingTotalMinor).toBe(240000);
    await expect(FinancialEngine.calculateBookingFinancials({ tour, packageKey: "basic", selections: { adults: 1, optionalComponentKeys: ["missing"] }, config: config() })).rejects.toThrow("not optional");
  });

  test("derives package totals from supplier costs plus agent fee and GST", async () => {
    const tour = { period: { days: 4, nights: 3 }, commercial: {
      version: "COMPONENTS_V1", currency: "INR",
      pricingPolicy: { feeType: "PERCENTAGE", feePercent: 10, gstPercent: 18 },
      components: [
        { componentKey: "hotel", type: "ACCOMMODATION", name: "Hotel", pricing: { unit: "PER_ROOM_PER_NIGHT", costAmountMinor: 100000, sellingAmountMinor: 999999 } },
        { componentKey: "activity", type: "ACTIVITY", name: "Activity", pricing: { unit: "PER_PERSON", costAmountMinor: 50000, sellingAmountMinor: 999999 } },
      ],
      packages: [{ packageKey: "base", tier: "BASIC", name: "Base", includedComponentKeys: ["hotel", "activity"] }],
    } };
    const result = await FinancialEngine.calculateBookingFinancials({
      tour, packageKey: "base", selections: { adults: 2, rooms: 1, nights: 3 },
      config: config({ commission: { enabled: false }, platformGst: { enabled: false } }),
    });
    expect(result.commercial.costTotalMinor).toBe(400000);
    expect(result.commercial.agentFeeMinor).toBe(40000);
    expect(result.commercial.agentGstMinor).toBe(7200);
    expect(result.commercial.sellingTotalMinor).toBe(447200);
    expect(result.customer.payableMinor).toBe(447200);
  });

  test("verifies Razorpay signatures without exposing its secret", () => {
    const rawBody = Buffer.from('{"event":"payment.captured"}');
    const signature = crypto.createHmac("sha256", "webhook-secret").update(rawBody).digest("hex");
    const provider = new RazorpayProvider({ webhookSecret: "webhook-secret" });
    expect(provider.verifyWebhook({ rawBody, signature })).toBe(true);
    expect(provider.verifyWebhook({ rawBody, signature: "invalid" })).toBe(false);
  });
});
