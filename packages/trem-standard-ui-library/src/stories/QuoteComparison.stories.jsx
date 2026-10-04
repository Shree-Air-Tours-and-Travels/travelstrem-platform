import React from "react";
import { QuoteComparison } from "@packages/trem-ui";

const customized = {
  version: "TOUR_CUSTOMIZATION_V1",
  currency: "INR",
  quoteMode: "CUSTOMIZED",
  travellers: 2,
  rooms: 1,
  package: {
    packageKey: "basic",
    packageName: "Basic",
    perPersonMinor: 2594500,
    totalMinor: 5189000,
  },
  hotel: {
    optionName: "Upgrade to 4-Star Hotels",
    roomName: "Deluxe Room",
    included: false,
    supplement: { perPersonMinor: 500000, totalMinor: 1000000 },
  },
  customized: { perPersonMinor: 3094500, totalMinor: 6189000 },
  recommendedAlternative: {
    packageKey: "standard",
    packageName: "Standard",
    perPersonMinor: 2894500,
    totalMinor: 5789000,
    differenceMinor: -400000,
    absoluteDifferenceMinor: 400000,
    differencePerPersonMinor: 200000,
    savingsMinor: 400000,
    additionalMinor: 0,
    additionalBenefits: ["Airport transfer", "Premium meal plan"],
  },
};

export default {
  title: "Trem UI/Pricing/QuoteComparison",
  component: QuoteComparison,
  tags: ["autodocs"],
  args: { preview: customized },
};
export const CustomizedWithSaving = { args: { onSelectAlternative: () => {} } };
export const CustomizedWithoutSaving = {
  args: {
    preview: {
      ...customized,
      recommendedAlternative: {
        ...customized.recommendedAlternative,
        differenceMinor: 300000,
        absoluteDifferenceMinor: 300000,
        differencePerPersonMinor: 150000,
        savingsMinor: 0,
        additionalMinor: 300000,
      },
    },
  },
};
export const HotelAlreadyIncluded = {
  args: {
    preview: {
      ...customized,
      quoteMode: "PACKAGE",
      hotel: {
        ...customized.hotel,
        included: true,
        supplement: { perPersonMinor: 0, totalMinor: 0 },
      },
      customized: customized.package,
      recommendedAlternative: null,
    },
  },
};
export const Loading = { args: { preview: null, loading: true } };
export const Error = {
  args: {
    preview: null,
    error: "Price comparison is temporarily unavailable.",
  },
};
