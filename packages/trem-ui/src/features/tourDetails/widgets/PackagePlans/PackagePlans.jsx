import React, { useEffect, useMemo } from "react";
import Button from "../../../../components/Button/Button.jsx";
import Icon from "../../../../icons/Icon/Icon.jsx";
import useTourDetailWidget from "../../hooks/useTourDetailWidget";
import {
  getCurrencyFormatter,
  getPackageDisplayName,
  getPackageDisplayRank,
} from "../../helper";
import { WidgetError, WidgetSkeleton } from "../../shared";
import "./PackagePlans.styles.scss";

export default function PackagePlans({
  tourRef,
  selectedPackage = "",
  onSelectPackage,
  productType,
}) {
  const { loading, error, widgetData, retry } = useTourDetailWidget(tourRef, "pricing-card.json");
  const labels = widgetData?.elements?.labels || {};
  const pricing = widgetData?.data?.tour?.commercialPricing;
  const plans = useMemo(() => {
    if (!Array.isArray(pricing?.packages)) return [];
    const formatter = getCurrencyFormatter(pricing.currency || "INR");
    return pricing.packages
      .map((item) => ({
        ...item,
        displayName: getPackageDisplayName(item),
        priceText: formatter.format(Number(item.sellingTotalMinor || 0) / 100),
      }))
      .filter((item) => item.packageKey && Number(item.sellingTotalMinor) > 0)
      .sort((left, right) => getPackageDisplayRank(left) - getPackageDisplayRank(right));
  }, [pricing]);

  useEffect(() => {
    if (!plans.length || plans.some((plan) => plan.packageKey === selectedPackage)) return;
    const defaultPlan = plans.find((plan) => plan.displayName === "Premium") || plans[0];
    onSelectPackage?.(defaultPlan.packageKey, defaultPlan);
  }, [onSelectPackage, plans, selectedPackage]);

  if (loading && !plans.length) return <WidgetSkeleton />;
  if (error && !plans.length) return <WidgetError message={error} retry={retry} />;
  if (!plans.length) return null;

  return (
    <section className="td-plans" aria-labelledby="td-plans-title">
      <header className="td-plans__header">
        <div>
          <span className="td-plans__eyebrow">
            {productType === "trip"
              ? "Choose your fixed trip option"
              : labels.planEyebrow || "Choose your stay and service level"}
          </span>
          <h2 id="td-plans-title">
            {productType === "trip" ? "Trip packages" : labels.planTitle || "Tour packages"}
          </h2>
          <p>
            {productType === "trip"
              ? "Compare the fixed facilities and flight inclusion for this departure. The itinerary remains unchanged."
              : labels.planDescription || "Compare what is included before requesting your quote."}
          </p>
        </div>
      </header>
      <div className="td-plans__grid">
        {plans.map((plan) => {
          const selected = selectedPackage === plan.packageKey;
          const recommended = plan.displayName === "Premium";
          return (
            <article
              className={`td-plans__card${recommended ? " is-recommended" : ""}${selected ? " is-selected" : ""}`}
              key={plan.packageKey}
            >
              <div className="td-plans__plan-label">
                <span>{plan.displayName}</span>
                {recommended ? (
                  <span className="td-plans__recommended">
                  <Icon name="sparkles" size={14} />
                  {labels.recommended || "Recommended"}
                  </span>
                ) : null}
              </div>
              <div className="td-plans__card-head">
                <h3>{plan.displayName}</h3>
                <strong>{plan.priceText}</strong>
              </div>
              {plan.description ? (
                <p className="td-plans__description">{plan.description}</p>
              ) : null}
              <div className="td-plans__features">
                {(plan.included || []).slice(0, 5).map((item) => (
                  <span key={item}>
                    <Icon name="check" size={15} />
                    {item}
                  </span>
                ))}
              </div>
              {(plan.optional || []).length ? (
                <details className="td-plans__optional">
                  <summary>{labels.optionalExtras || "Optional extras"}</summary>
                  <p>{plan.optional.join(" · ")}</p>
                </details>
              ) : null}
              <Button
                fullWidth
                variant={selected ? "solid" : "outline"}
                color="primary"
                text={
                  selected
                    ? labels.selectedPlan || "Selected"
                    : productType === "trip"
                      ? "Choose this package"
                      : labels.selectPlan || "Choose this plan"
                }
                onClick={() => onSelectPackage?.(plan.packageKey, plan)}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
