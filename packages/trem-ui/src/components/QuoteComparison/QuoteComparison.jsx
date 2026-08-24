import React from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import "./QuoteComparison.styles.scss";

const money = (amountMinor, currency) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  }).format(Number(amountMinor || 0) / 100);

const Amount = ({ value, currency, perPersonLabel, totalLabel, pendingLabel }) => {
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
  requirements = [],
  onSelectAlternative,
}) {
  const completedRequirements = requirements.filter((item) => item.complete).length;
  const requirementProgress = requirements.length
    ? Math.round((completedRequirements / requirements.length) * 100)
    : 0;

  if (loading)
    return (
      <section
        className="trem-quote-comparison trem-quote-comparison--calculation is-loading"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="trem-quote-comparison__calculation-hero">
          <span className="trem-quote-comparison__calculation-icon" aria-hidden="true">
            <Icon name="sparkles" size={22} />
          </span>
          <div>
            <strong>{labels.calculating || "Calculating your TREM price…"}</strong>
            <p>
              {labels.calculatingDescription ||
                "Comparing package components, rooms and traveller pricing."}
            </p>
          </div>
          {labels.intelligenceTag ? (
            <span className="trem-quote-comparison__intelligence">
              <Icon name="sparkles" size={14} />
              {labels.intelligenceTag}
            </span>
          ) : null}
        </div>
        <div className="trem-quote-comparison__calculation-track" aria-hidden="true">
          <span />
        </div>
        <div className="trem-quote-comparison__skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
    );
  if (error)
    return (
      <section className="trem-quote-comparison is-error" role="status">
        {error}
      </section>
    );
  if (!preview)
    return (
      <section
        className="trem-quote-comparison trem-quote-comparison--calculation is-awaiting"
        aria-label={labels.summary || "Quote summary"}
      >
        <div className="trem-quote-comparison__calculation-hero">
          <span className="trem-quote-comparison__calculation-icon" aria-hidden="true">
            <Icon name="sparkles" size={22} />
          </span>
          <div>
            <strong>{labels.assistantTitle || "Build your intelligent price"}</strong>
            <p>
              {labels.assistantDescription ||
                "Complete the trip details and TREM Intelligence will compare your options."}
            </p>
          </div>
          {labels.intelligenceTag ? (
            <span className="trem-quote-comparison__intelligence">
              <Icon name="sparkles" size={14} />
              {labels.intelligenceTag}
            </span>
          ) : null}
        </div>
        {requirements.length ? (
          <>
            <div className="trem-quote-comparison__progress-copy">
              <span>{labels.detailsProgress || "Pricing details"}</span>
              <strong>
                {completedRequirements}/{requirements.length}
              </strong>
            </div>
            <div
              className="trem-quote-comparison__progress"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={requirementProgress}
            >
              <span style={{ width: `${requirementProgress}%` }} />
            </div>
            <ul className="trem-quote-comparison__requirements">
              {requirements.map((item) => (
                <li className={item.complete ? "is-complete" : ""} key={item.id || item.label}>
                  <span aria-hidden="true">
                    <Icon name={item.complete ? "check" : "circleDot"} size={14} />
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <p className="trem-quote-comparison__calculation-note">
          {labels.waitingForDetails ||
            "Your estimate will appear here when the required selections are ready."}
        </p>
      </section>
    );
  const alternative = preview.recommendedAlternative;
  const hasDifference =
    alternative?.absoluteDifferenceMinor != null && alternative?.differencePerPersonMinor != null;
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
    <section className="trem-quote-comparison" aria-label={labels.summary || "Quote summary"}>
      <header>
        <span className="trem-quote-comparison__icon">
          <Icon
            name={preview.quoteMode === "CUSTOMIZED" ? "settings" : "travelPackage"}
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
            {preview.travellers} {labels.travellers || "travellers"} · {preview.rooms}{" "}
            {labels.rooms || "rooms"}
          </small>
        </div>
        {labels.intelligenceTag ? (
          <span className="trem-quote-comparison__intelligence">
            <Icon name="sparkles" size={14} />
            {labels.intelligenceTag}
          </span>
        ) : null}
      </header>
      <div className="trem-quote-comparison__rows">
        <div>
          <span>
            <small>{labels.basePackage || "Selected package"}</small>
            <strong>{preview.package?.packageName}</strong>
          </span>
          <Amount value={preview.package} {...amountProps} />
        </div>
        {(preview.hotels?.length ? preview.hotels : preview.hotel ? [preview.hotel] : []).map(
          (hotel) => (
            <div key={hotel.stayKey || hotel.optionKey}>
              <span>
                <small>
                  {hotel.included
                    ? labels.includedUpgrade || "Already included"
                    : labels.hotelUpgrade || "Hotel upgrade"}
                </small>
                <strong>
                  {[hotel.location, hotel.optionName, hotel.roomName].filter(Boolean).join(" · ")}
                </strong>
              </span>
              <Amount value={hotel.supplement} {...amountProps} />
            </div>
          ),
        )}
        {(preview.hotelRequests || []).map((request) => (
          <div key={`request-${request.stayKey}`}>
            <span>
              <small>{labels.hotelRequest || "Requested hotel"}</small>
              <strong>
                {[request.location, request.propertyClass, request.roomType]
                  .filter(Boolean)
                  .join(" · ")}
              </strong>
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
        <div className={`trem-quote-comparison__recommendation${saves ? " is-saving" : ""}`}>
          <Icon name={saves ? "sparkles" : "info"} size={18} />
          <div>
            <strong>
              {saves
                ? labels.saveWithPackage || "You can save by switching packages"
                : labels.comparePackage || "Compare with the package that includes this hotel"}
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
                {money(alternative.totalMinor, preview.currency)} {labels.total || "total"}
              </b>
              {difference ? (
                <>
                  . {saves ? labels.saves || "You save" : labels.difference || "Price difference"}:{" "}
                  <b>
                    {money(difference.perPersonMinor, preview.currency)}{" "}
                    {labels.perPerson || "per person"}
                  </b>{" "}
                  ·{" "}
                  <b>
                    {money(difference.totalMinor, preview.currency)} {labels.total || "total"}
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
              <button type="button" onClick={() => onSelectAlternative(alternative.packageKey)}>
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
