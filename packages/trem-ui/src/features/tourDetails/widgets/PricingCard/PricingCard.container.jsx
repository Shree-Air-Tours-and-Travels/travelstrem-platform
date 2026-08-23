import React, { useMemo } from "react";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import { getCityDisplay, getCurrencyFormatter, getPriceText } from "../../helper";
import { WidgetError, WidgetSkeleton } from "../../shared";
import PricingCardView from "./PricingCard.view";

export default function PricingCardContainer({
  tourRef,
  tour: fallbackTour,
  onContact,
  onShare,
  isFavorited,
  onFavorite,
}) {
  const { loading, error, widgetData } = useTourDetailWidget(tourRef, "pricing-card.json");
  const labels = widgetData?.elements?.labels || {};
  const config = widgetData?.structure?.widgets?.[0]?.props?.config || {};
  const tour = widgetData?.data?.tour || fallbackTour || null;
  const cityDisplay = useMemo(() => getCityDisplay(tour), [tour]);
  const priceText = useMemo(() => getPriceText(tour), [tour]);
  const packagePrices = useMemo(() => {
    const pricing = tour?.commercialPricing;
    if (!Array.isArray(pricing?.packages)) return [];
    const formatter = getCurrencyFormatter(pricing.currency || tour?.priceInfo?.currency || "INR");
    return pricing.packages
      .filter((item) => Number(item.sellingTotalMinor) > 0)
      .map((item) => ({
        key: item.packageKey || item.tier,
        name:
          item.name ||
          { BASIC: "Base", STANDARD: "Standard", PREMIUM: "Premium" }[item.tier] ||
          "Package",
        priceText: formatter.format(Number(item.sellingTotalMinor) / 100),
        requiresRepricing: item.requiresRepricing === true,
      }));
  }, [tour]);

  if (loading && !tour) return <WidgetSkeleton />;
  if (error && !tour) return <WidgetError message={error} />;

  return (
    <PricingCardView
      labels={labels}
      showBookNow={config.showBookNow === true}
      tour={tour}
      priceText={priceText}
      packagePrices={packagePrices}
      priceDisplayMode={
        tour?.commercialPricing?.displayMode || (tour?.priceInfo?.isFinal ? "FINAL" : "ESTIMATED")
      }
      cityDisplay={cityDisplay}
      onContact={onContact}
      onShare={onShare}
      isFavorited={isFavorited}
      onFavorite={onFavorite}
    />
  );
}
