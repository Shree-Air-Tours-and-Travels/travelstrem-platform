import React from "react";
import PropTypes from "prop-types";
import Button from "../Button/Button.jsx";
import CardWithSubEntity from "../CardWithSubEntity/CardWithSubEntity.jsx";
import InfoTooltip from "../InfoTooltip/InfoTooltip.jsx";
import "./HotelRateCard.styles.scss";

export default function HotelRateCard({ rate, labels = {}, assignedSlots = [], disabled = false, onSelect }) {
  const total = rate.priceFields?.find((field) => field.id === "total");
  const priceParts = (rate.priceFields || []).filter((field) => field.id !== "total");
  const sections = (rate.expandedDetails?.sections || []).filter(
    (section) => section.id === "rate" || section.id?.startsWith("provider-"),
  );
  const sources = sections.length
    ? sections.flatMap((section) => section.items || [])
    : [...(rate.detailFields || []).filter((field) => ["meal", "cancellation"].includes(field.id)), ...(rate.priceFacts || [])];
  const seen = new Set([String(rate.rateLabel || "").trim().toLowerCase()]);
  const facts = sources.filter((field) => {
    const value = String(field.value ?? "").trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return <CardWithSubEntity
    className="trem-hotel-rate-card"
    title={rate.rateLabel || rate.title}
    badge={assignedSlots.length ? assignedSlots.join(", ") : ""}
    headerMeta={total ? <span className="trem-hotel-rate-card__total"><small>{labels[total.labelRef] || labels.total}</small><strong>{total.value}</strong></span> : null}
    headerActions={[<Button key="select" text={labels.selectRate} variant="solid" disabled={disabled} onClick={() => onSelect?.(rate)} />]}
    sections={[
      ...(facts.length ? [{ id: "conditions", title: labels.rateConditions, collapsible: true, items: facts.map((fact, index) => ({ id: `${fact.id || "fact"}-${index}`, label: fact.label || labels[fact.labelRef], value: fact.value })) }] : []),
      ...(priceParts.length ? [{ id: "price", title: labels.priceDetails, collapsible: true, items: priceParts.map((field) => ({
        id: field.id,
        label: <>{labels[field.labelRef]}{field.help ? <InfoTooltip label={`About ${labels[field.labelRef]}`} text={field.help} inModal hide={field.id === "fee"} /> : null}</>,
        value: <>{field.value}{field.detail ? <small className="trem-hotel-rate-card__detail">{field.detail}</small> : null}</>,
      })) }] : []),
    ]}
  />;
}

HotelRateCard.propTypes = {
  rate: PropTypes.object.isRequired,
  labels: PropTypes.object,
  assignedSlots: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
  onSelect: PropTypes.func,
};
