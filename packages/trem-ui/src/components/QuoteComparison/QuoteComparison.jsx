import React from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import "./QuoteComparison.styles.scss";

const money = (amountMinor, currency) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  }).format(Number(amountMinor || 0) / 100);

const Amount = ({
  value,
  currency,
  perPersonLabel,
  totalLabel,
  pendingLabel,
}) => {
  if (value?.perPersonMinor == null || value?.totalMinor == null) {
    return (
      <span className="trem-quote-comparison__amount is-pending">
        <strong>{pendingLabel}</strong>
      </span>
    );
  }
  return (
    <span className="trem-quote-comparison__amount">
      <strong>
        {money(value.perPersonMinor, currency)} <small>{perPersonLabel}</small>
      </strong>
      <span>
        {money(value.totalMinor, currency)} {totalLabel}
      </span>
    </span>
  );
};

export default function QuoteComparison({
  preview,
  labels = {},
  loading = false,
  error = "",
  onSelectAlternative,
}) {
  if (loading)
    return (
      <section className="trem-quote-comparison is-loading" aria-live="polite">
        {labels.calculating || "Updating your price…"}
      </section>
    );
  if (error)
    return (
      <section className="trem-quote-comparison is-error" role="status">
        {error}
      </section>
    );
  if (!preview) return null;
  const alternative = preview.recommendedAlternative;
  const hasDifference =
    alternative?.absoluteDifferenceMinor != null &&
    alternative?.differencePerPersonMinor != null;
  const saves = hasDifference && Number(alternative.savingsMinor) > 0;
  const difference = hasDifference
    ? {
        totalMinor: Number(alternative.absoluteDifferenceMinor),
        perPersonMinor: Number(alternative.differencePerPersonMinor),
      }
    : null;
  const amountProps = {
    currency: preview.currency,
    perPersonLabel: labels.perPerson || "per person",
    totalLabel: labels.total || "total",
    pendingLabel: labels.pricePending || "Price pending",
  };

  return (
    <section
      className="trem-quote-comparison"
      aria-label={labels.summary || "Quote summary"}
    >
      <header>
        <span className="trem-quote-comparison__icon">
          <Icon
            name={
              preview.quoteMode === "CUSTOMIZED" ? "settings" : "travelPackage"
            }
            size={18}
          />
        </span>
        <div>
          <strong>
            {preview.quoteMode === "CUSTOMIZED"
              ? labels.customQuote || "Customized quote"
              : labels.packageQuote || "Package price"}
          </strong>
          <small>
            {preview.travellers} {labels.travellers || "travellers"} ·{" "}
            {preview.rooms} {labels.rooms || "rooms"}
          </small>
        </div>
      </header>
      <div className="trem-quote-comparison__rows">
        <div>
          <span>
            <small>{labels.basePackage || "Selected package"}</small>
            <strong>{preview.package?.packageName}</strong>
          </span>
          <Amount value={preview.package} {...amountProps} />
        </div>
        {(preview.hotels?.length ? preview.hotels : preview.hotel ? [preview.hotel] : []).map((hotel) => (
          <div key={hotel.stayKey || hotel.optionKey}>
            <span>
              <small>
                {hotel.included
                  ? labels.includedUpgrade || "Already included"
                  : labels.hotelUpgrade || "Hotel upgrade"}
              </small>
              <strong>
                {[hotel.location, hotel.optionName, hotel.roomName]
                  .filter(Boolean)
                  .join(" · ")}
              </strong>
            </span>
            <Amount value={hotel.supplement} {...amountProps} />
          </div>
        ))}
        {(preview.hotelRequests || []).map((request) => (
          <div key={`request-${request.stayKey}`}>
            <span>
              <small>{labels.hotelRequest || "Requested hotel"}</small>
              <strong>{[request.location, request.propertyClass, request.roomType].filter(Boolean).join(" · ")}</strong>
            </span>
            <Amount value={null} {...amountProps} />
          </div>
        ))}
        <div className="trem-quote-comparison__final">
          <span>
            <small>{labels.yourPrice || "Your estimated price"}</small>
            <strong>
              {preview.quoteMode === "CUSTOMIZED"
                ? labels.customizedPlan || "Customized package"
                : preview.package?.packageName}
            </strong>
          </span>
          <Amount value={preview.customized} {...amountProps} />
        </div>
      </div>
      {alternative ? (
        <div
          className={`trem-quote-comparison__recommendation${saves ? " is-saving" : ""}`}
        >
          <Icon name={saves ? "sparkles" : "info"} size={18} />
          <div>
            <strong>
              {saves
                ? labels.saveWithPackage || "You can save by switching packages"
                : labels.comparePackage ||
                  "Compare with the package that includes this hotel"}
            </strong>
            <p>
              {alternative.packageName}{" "}
              {labels.includesHotel || "recalculates all your selected stays"}.{" "}
              {labels.alternativePrice || "Package price"}:{" "}
              <b>
                {money(alternative.perPersonMinor, preview.currency)}{" "}
                {labels.perPerson || "per person"}
              </b>{" "}
              ·{" "}
              <b>
                {money(alternative.totalMinor, preview.currency)}{" "}
                {labels.total || "total"}
              </b>
              {difference ? (
                <>
                  .{" "}
                  {saves
                    ? labels.saves || "You save"
                    : labels.difference || "Price difference"}
                  :{" "}
                  <b>
                    {money(difference.perPersonMinor, preview.currency)}{" "}
                    {labels.perPerson || "per person"}
                  </b>{" "}
                  ·{" "}
                  <b>
                    {money(difference.totalMinor, preview.currency)}{" "}
                    {labels.total || "total"}
                  </b>
                </>
              ) : null}
              .
            </p>
            {alternative.additionalBenefits?.length ? (
              <p>
                {labels.alsoIncludes || "It also includes"}:{" "}
                {alternative.additionalBenefits.join(" · ")}.
              </p>
            ) : null}
            {typeof onSelectAlternative === "function" ? (
              <button
                type="button"
                onClick={() => onSelectAlternative(alternative.packageKey)}
              >
                {(labels.choosePackage || "Choose {package}").replace(
                  "{package}",
                  alternative.packageName,
                )}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {preview.requiresRepricing ? (
        <p className="trem-quote-comparison__note">
          {(preview.hotelRequests?.length ? labels.hotelRequestPending : labels.repricing) ||
            "The agent will confirm availability and the final quote."}
        </p>
      ) : null}
    </section>
  );
}
