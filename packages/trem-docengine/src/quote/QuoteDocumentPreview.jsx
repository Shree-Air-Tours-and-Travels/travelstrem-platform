import React from "react";
import { buildQuoteDocumentModel } from "./buildQuoteDocumentModel";
import "./quoteDocument.css";

const formatDate = (value) =>
  !value
    ? "Not set"
    : new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
const formatMoney = (value, currency) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );
const basis = (line) =>
  ({
    PER_PERSON: "Per person",
    PER_ADULT: "Per adult",
    PER_CHILD: "Per child",
    PER_ROOM: "Per room",
    PER_NIGHT: "Per night",
    PER_BOOKING: "Per booking",
    PERCENTAGE: "% of subtotal",
  })[line.pricingType] || "Fixed";

export default function QuoteDocumentPreview({
  booking,
  quote: quoteInput,
  amount,
  currency,
  notes,
  companyName = "TravelsTREM",
}) {
  const quote = buildQuoteDocumentModel({ booking, quote: quoteInput, amount, currency, notes });
  const lines = quote.lines || [];
  const inclusions = lines.filter((line) => line.category !== "fee");
  const fees = lines.filter((line) => line.category === "fee");
  const optional = (quoteInput?.items || []).filter(
    (line) => line.optional && line.selected === false,
  );
  const inclusionSubtotal = inclusions.reduce(
    (sum, line) => sum + Number((line.amount ?? line.unitAmount) || 0),
    0,
  );

  const rows = (items) =>
    items.map((line, index) => (
      <div className="trem-docengine__row" key={`${line.label}-${index}`}>
        <span className="trem-docengine__line-label">{line.label}</span>
        <span>{basis(line)}</span>
        <span>
          {line.pricingType && line.pricingType !== "FIXED"
            ? `${formatMoney(line.unitAmount, quote.currency)} × ${line.quantity || 1}`
            : "—"}
        </span>
        <b>{formatMoney(line.amount ?? line.unitAmount, quote.currency)}</b>
      </div>
    ));
  return (
    <section className="trem-docengine trem-docengine--quote" aria-label="Quote document preview">
      <header className="trem-docengine__header">
        <div>
          <span className="trem-docengine__eyebrow">Travel quote preview</span>
          <h3>{companyName}</h3>
        </div>
        <div className="trem-docengine__ref">
          <span>Reference</span>
          <strong>{quote.quoteNumber}</strong>
          <small>Version {quote.version}</small>
        </div>
      </header>
      <div className="trem-docengine__hero">
        <div>
          <span>Prepared for</span>
          <strong>{quote.customerName}</strong>
          <small>{quote.customerEmail}</small>
        </div>
        <div>
          <span>▣ &nbsp; Travel dates</span>
          <b>
            {formatDate(quote.startDate)} – {formatDate(quote.endDate)}
          </b>
        </div>
        <div>
          <span>♧ &nbsp; Travellers</span>
          <b>
            {quote.guests} traveller{quote.guests === 1 ? "" : "s"}
          </b>
        </div>
        <div>
          <span>◷ &nbsp; Quote valid until</span>
          <b>{formatDate(quote.expirationDate)}</b>
        </div>
      </div>
      <div className="trem-docengine__quote-grid">
        <div className="trem-docengine__panel">
          <h4>Price breakdown</h4>
          <div className="trem-docengine__table-head">
            <span>Item</span>
            <span>Basis</span>
            <span>Calculation</span>
            <span>Amount</span>
          </div>
          {inclusions.length ? (
            <>
              <h5>Inclusions</h5>
              {rows(inclusions)}
              <div className="trem-docengine__subrow">
                <span>Inclusions subtotal</span>
                <b>{formatMoney(inclusionSubtotal, quote.currency)}</b>
              </div>
            </>
          ) : null}
          {fees.length ? (
            <>
              <h5>Fees</h5>
              {rows(fees)}
            </>
          ) : null}
          {quote.discount > 0 ? (
            <>
              <h5 className="is-adjustment">Adjustments</h5>
              <div className="trem-docengine__row">
                <span className="trem-docengine__line-label">Agent discount</span>
                <span>Per booking</span>
                <span>—</span>
                <b className="is-negative">-{formatMoney(quote.discount, quote.currency)}</b>
              </div>
            </>
          ) : null}
          <div className="trem-docengine__grand-row">
            <span>Total quote amount</span>
            <b>{formatMoney(quote.amount, quote.currency)}</b>
          </div>
        </div>
        <aside className="trem-docengine__side">
          <div className="trem-docengine__side-card">
            <h4>Quote summary</h4>
            <p>
              <span>Subtotal</span>
              <b>{formatMoney(quote.amount + quote.discount, quote.currency)}</b>
            </p>
            <p>
              <span>TREM Coupon</span>
              <b>N/A</b>
            </p>
            <p>
              <span>GST & taxes</span>
              <b>N/A</b>
            </p>
            <p>
              <span>Convenience fee</span>
              <b>N/A</b>
            </p>
            <div>
              <span>Total quote amount</span>
              <strong>{formatMoney(quote.amount, quote.currency)}</strong>
            </div>
          </div>
          <div className="trem-docengine__side-card">
            <h4>Payment summary</h4>
            <p>
              <span>Amount payable now</span>
              <b>{formatMoney(quote.amountPayableNow, quote.currency)}</b>
            </p>
            <p>
              <span>Remaining balance</span>
              <b>
                {formatMoney(Math.max(0, quote.amount - quote.amountPayableNow), quote.currency)}
              </b>
            </p>
            <em>Due by {formatDate(quote.balanceDueDate)}</em>
          </div>
          <div className="trem-docengine__side-card">
            <h4>Important notes</h4>
            {quote.notes ? (
              <p className="trem-docengine__copy">✓ {quote.notes}</p>
            ) : (
              <p className="trem-docengine__copy">
                ✓ Prices are subject to availability at the time of booking.
                <br />✓ Flights are subject to change until ticketed.
              </p>
            )}
          </div>
          <div className="trem-docengine__side-card trem-docengine__addons">
            <h4>
              Optional add-ons <small>(Not included)</small>
            </h4>
            {optional.length ? (
              optional.map((item, index) => (
                <p key={index}>
                  {item.label} · {formatMoney(item.unitAmount, quote.currency)}
                </p>
              ))
            ) : (
              <p>None selected</p>
            )}
          </div>
        </aside>
      </div>
      {(quote.terms || quote.notes) && (
        <footer>
          <strong>Terms & cancellation</strong>
          <span>{quote.terms || quote.notes}</span>
        </footer>
      )}
    </section>
  );
}
