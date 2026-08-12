import React from "react";
import Title from "../../../../components/Title/Title.jsx";
import Paragraph from "../../../../components/Paragraph/Paragraph.jsx";
import Icon from "../../../../icons/Icon/Icon.jsx";
import "./CancellationPolicy.styles.scss";

const money = (price, currency, locale) => {
  if (price == null || Number.isNaN(Number(price))) return "";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(price));
};

export default function CancellationPolicyView({ labels = {}, policy = "", cancellation = null, extras = [], config = {} }) {
  const policyText = policy || cancellation?.policy || "";
  const tiers = Array.isArray(cancellation?.tiers) ? cancellation.tiers : [];
  const freeUntil = cancellation?.freeCancellationUntil || "";
  const refundPercent = cancellation?.refundPercent;
  const depositRequired = Boolean(cancellation?.depositRequired);
  const depositPercent = cancellation?.depositPercent;
  const depositNote = cancellation?.depositNote || "";
  const note = cancellation?.note || "";

  const hasSummary = Boolean(freeUntil || (refundPercent != null && refundPercent !== 100) || depositRequired);
  const hasAny =
    policyText || hasSummary || tiers.length > 0 || note || depositNote || extras.length > 0;
  if (!hasAny) return null;

  const title = labels.cancellationPolicy;

  return (
    <section className="tour-detail__section td-cp" aria-label={title}>
      <header className="td-cp__header">
        <span className="td-cp__header-icon">
          <Icon name={config.headerIcon} size={18} />
        </span>
        <Title text={title} primaryClassname="td-cp__title" />
      </header>

      <div className="td-cp__body">
        {(hasSummary || policyText) && (
          <div className="td-cp__hero">
            {!hasSummary && policyText && (
              <div className="td-cp__hero-item">
                <span className="td-cp__hero-icon">
                  <Icon name={config.policySummaryIcon} size={16} />
                </span>
                <div className="td-cp__hero-text">
                  <span className="td-cp__hero-label">{labels.policyTerms}</span>
                  <span className="td-cp__hero-value">{labels.policyApplies}</span>
                </div>
              </div>
            )}
            {freeUntil && (
              <div className="td-cp__hero-item td-cp__hero-item--good">
                <span className="td-cp__hero-icon">
                  <Icon name={config.freeCancellationIcon} size={16} />
                </span>
                <div className="td-cp__hero-text">
                  <span className="td-cp__hero-label">{labels.freeCancellation}</span>
                  <span className="td-cp__hero-value">{freeUntil}</span>
                </div>
              </div>
            )}
            {refundPercent != null && refundPercent !== 100 && (
              <div className="td-cp__hero-item">
                <span className="td-cp__hero-icon">
                  <Icon name={config.refundIcon} size={16} />
                </span>
                <div className="td-cp__hero-text">
                  <span className="td-cp__hero-label">{labels.refundUpTo}</span>
                  <span className="td-cp__hero-value">{refundPercent}%</span>
                </div>
              </div>
            )}
            {depositRequired && (
              <div className="td-cp__hero-item td-cp__hero-item--warn">
                <span className="td-cp__hero-icon">
                  <Icon name={config.depositIcon} size={16} />
                </span>
                <div className="td-cp__hero-text">
                  <span className="td-cp__hero-label">{labels.deposit}</span>
                  <span className="td-cp__hero-value">
                    {depositPercent != null ? `${depositPercent}% ${labels.upfrontSuffix}` : labels.required}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {policyText && (
          <div className="td-cp__policy-wrap">
            <Paragraph primaryClassname="td-cp__policy" text={policyText} />
          </div>
        )}

        {tiers.length > 0 && (
          <div className="td-cp__block">
            <p className="td-cp__block-title">
              <Icon name={config.timelineIcon} size={15} />
              {labels.tiersTitle}
            </p>
            <ul className="td-cp__timeline">
              {tiers.map((tier, i) => {
                const good = tier.refundPercent != null && tier.refundPercent >= 100;
                const partial = tier.refundPercent != null && tier.refundPercent > 0 && !good;
                return (
                  <li className="td-cp__tier" key={i}>
                    <div className="td-cp__tier-track">
                      <span className={`td-cp__tier-node${good ? " td-cp__tier-node--good" : partial ? " td-cp__tier-node--partial" : " td-cp__tier-node--none"}`}>
                        {good ? (
                          <Icon name="check" size={12} />
                        ) : partial ? (
                          <Icon name="wallet" size={12} />
                        ) : (
                          <Icon name="x" size={12} />
                        )}
                      </span>
                      {i < tiers.length - 1 && <span className="td-cp__tier-line" />}
                    </div>
                    <div className="td-cp__tier-body">
                      <p className="td-cp__tier-label">{tier.label || `${labels.tierFallback} ${i + 1}`}</p>
                      {tier.description && <p className="td-cp__tier-desc">{tier.description}</p>}
                    </div>
                    <span className={`td-cp__tier-pct${good ? " td-cp__tier-pct--good" : ""}`}>
                      {tier.refundPercent != null ? `${tier.refundPercent}%` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {depositNote && (
          <div className="td-cp__strip td-cp__strip--warn">
            <Icon name={config.noteIcon} size={15} />
            <span>{depositNote}</span>
          </div>
        )}
        {note && (
          <div className="td-cp__strip">
            <Icon name={config.noteIcon} size={15} />
            <span>{note}</span>
          </div>
        )}
      </div>

      {extras.length > 0 && (
        <div className="td-cp__extras">
          <header className="td-cp__extras-header">
            <span className="td-cp__extras-icon">
              <Icon name={config.extrasIcon} size={16} />
            </span>
            <h4 className="td-cp__extras-title">{labels.extras}</h4>
            <span className="td-cp__extras-count">{extras.length}</span>
          </header>

          <div className="td-cp__extras-list">
            {extras.map((extra, i) => {
              const included = Boolean(extra.included);
              const rawPriceLabel = String(extra.priceLabel || "").trim();
              const hasPrice = extra.price != null && extra.price !== "";
              // Older trip records use priceLabel for the billing unit (for
              // example, "Per person") while keeping the numeric value in
              // price. Show both instead of letting the unit hide the price.
              const priceLabel = rawPriceLabel && /[\d₹$€£]/.test(rawPriceLabel)
                ? rawPriceLabel
                : hasPrice
                  ? [
                    money(extra.price, extra.currency || config.defaultCurrency, config.locale),
                    rawPriceLabel || (extra.perPerson ? labels.perPerson : ""),
                  ].filter(Boolean).join(" ")
                  : rawPriceLabel;
              return (
                <div className="td-cp__extra" key={i}>
                  <span className="td-cp__extra-icon">
                    <Icon name={extra.icon || config.defaultExtraIcon} size={16} />
                  </span>
                  <div className="td-cp__extra-body">
                    <p className="td-cp__extra-title">{extra.title}</p>
                    {extra.description && <p className="td-cp__extra-desc">{extra.description}</p>}
                  </div>
                  <div className="td-cp__extra-aside">
                    {included ? (
                      <span className="td-cp__extra-included">
                        <Icon name="check" size={13} />
                        {labels.included}
                      </span>
                    ) : (
                      priceLabel && <span className="td-cp__extra-price">{priceLabel}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
