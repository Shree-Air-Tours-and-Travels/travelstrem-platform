import React from 'react';
import { Button, SubTitle, Paragraph, RecordReview } from "@packages/trem-ui";
import './TourView.scss';

export default function TourViewView({ tour, onClose, onEdit, panelRef }) {
  if (!tour) return null;

  const imageSrc = tour.photo || (Array.isArray(tour.photos) && tour.photos[0]) || '';

  return (
    <div
      className="tour-view-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${tour.title} details`}
      onClick={onClose}
    >
      <aside
        className="tour-view"
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="tv-header">
          <div className="tv-title">
            <SubTitle text={tour.title} variant="primary" size="large" />
            <div className="tv-meta">
              {typeof tour.city === "object"
                ? `${tour.city?.from || ""}${tour.city?.to ? ` → ${tour.city.to}` : ""}`
                : tour.city || ""}
            </div>
          </div>

          <div className="tv-actions">
            <Button primaryClassName="btn" variant="solid" color="primary" onClick={() => onEdit(tour)} text="Edit" />
            <Button primaryClassName="btn" variant="outline" onClick={onClose} aria-label="Close view" text="Close" />
          </div>
        </header>

        <div className="tv-body">
          <div className="tv-aside">
            {imageSrc ? <img src={imageSrc} alt={tour.title} className="tv-photo" /> : <div className="tv-photo tv-photo--fallback" aria-label="No tour image">No image available</div>}
           
          </div>

          <main className="tv-main" aria-label="Tour content">
            <div className="tv-row">
              <div className="tv-summary">
                <Paragraph><strong>Duration:</strong> {tour.period?.days != null ? String(tour.period.days) : "—"}d / {tour.period?.nights != null ? String(tour.period.nights) : "—"}n</Paragraph>
                <Paragraph><strong>Distance:</strong> {tour.distance ?? '—'} km</Paragraph>
                <Paragraph><strong>Price:</strong> {tour.price ? `${tour.price.min}-${tour.price.max} ${tour.price.currency}` : '—'}</Paragraph>
                <Paragraph><strong>Seats:</strong> {tour.availability?.seatsAvailable ?? '—'} / {tour.availability?.totalSeats ?? '—'}</Paragraph>
                <Paragraph><strong>Meeting point:</strong> {tour.meetingPoint || '—'}</Paragraph>
              </div>
            </div>

            <section className="tv-section">
              <SubTitle text="Description" />
              <Paragraph>{tour.desc || 'No description available.'}</Paragraph>
            </section>

            <section className="tv-section">
              <SubTitle text="Itinerary" />
              {(tour.itinerary || []).length === 0 && <Paragraph primaryClassname="tv-empty">No itinerary provided.</Paragraph>}
              {(tour.itinerary || []).map(it => (
                <div key={it._id || it.day} className="tv-it">
                  <strong>Day {it.day} , {it.title || ''}</strong>
                  {it.summary && <Paragraph>{it.summary}</Paragraph>}
                </div>
              ))}
            </section>

            <section className="tv-section">
              <SubTitle text="Highlights" />
              {(tour.highlights || []).length === 0 ? <Paragraph>No highlights provided.</Paragraph> : (
                <ul>
                  {(tour.highlights || []).map((h, idx) => <li key={h._id || idx}>{h.title || h}</li>)}
                </ul>
              )}
            </section>

            <section className="tv-section">
              <SubTitle text="Seasonal Pricing" />
              {(tour.seasonalPricing || []).length === 0 ? <Paragraph>No seasonal pricing provided.</Paragraph> : (
                <ul>
                  {(tour.seasonalPricing || []).map((s, idx) => (
                    <li key={s._id || idx}>
                      {s.seasonName || 'Season'} , {s.min ?? '-'}-{s.max ?? '-'} {s.currency || (tour.price && tour.price.currency) || ''}
                      {' '}({s.startDate ? new Date(s.startDate).toLocaleDateString() : '-'} → {s.endDate ? new Date(s.endDate).toLocaleDateString() : '-'})
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {tour.inclusions?.length > 0 && <section className="tv-section"><SubTitle text="Inclusions" /><ul>{tour.inclusions.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
            {tour.exclusions?.length > 0 && <section className="tv-section"><SubTitle text="Exclusions" /><ul>{tour.exclusions.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
            {tour.includedStays?.length > 0 && <section className="tv-section"><SubTitle text="Included stays" />{tour.includedStays.map((stay, index) => <Paragraph key={stay._id || index}><strong>{stay.propertyName || "Stay"}</strong> · {stay.location || "—"} · {stay.nights ?? 0} night(s) · {stay.roomType || "Room details not set"}{stay.meals?.length ? ` · ${stay.meals.join(", ")}` : ""}{stay.description ? ` — ${stay.description}` : ""}</Paragraph>)}</section>}
            {tour.hotelOptions?.length > 0 && <section className="tv-section"><SubTitle text="Hotel upgrades" />{tour.hotelOptions.map((option, index) => <Paragraph key={option._id || index}><strong>{option.title || "Upgrade"}</strong>{option.recommended ? " · Recommended" : ""} · {option.costLabel || "Cost"}: {option.cost || "—"}{option.description ? ` — ${option.description}` : ""}</Paragraph>)}</section>}
            {tour.extras?.length > 0 && <section className="tv-section"><SubTitle text="Optional extras" />{tour.extras.map((extra, index) => <Paragraph key={extra._id || index}><strong>{extra.title || "Extra"}</strong> · {extra.included ? "Included" : `${extra.currency || tour.price?.currency || "INR"} ${extra.price ?? 0}`}{extra.priceLabel ? ` (${extra.priceLabel})` : ""}{extra.description ? ` — ${extra.description}` : ""}</Paragraph>)}</section>}
            {(tour.cancellationPolicy || tour.cancellation?.policy || tour.cancellation?.tiers?.length) && <section className="tv-section"><SubTitle text="Cancellation" /><Paragraph>{tour.cancellationPolicy || tour.cancellation?.policy || "—"}</Paragraph>{tour.cancellation?.tiers?.map((tier, index) => <Paragraph key={tier._id || index}>{tier.label || "Refund"}: {tier.refundPercent ?? "—"}% · {tier.daysBefore ?? "—"} days before departure{tier.description ? ` — ${tier.description}` : ""}</Paragraph>)}</section>}
            <section className="tv-section"><SubTitle text="Ownership & audit" /><Paragraph><strong>Agency:</strong> {tour.agency?.name || "TravelsTREM platform"}</Paragraph><Paragraph><strong>Agent:</strong> {tour.ownerAgentName || "Master admin"}{tour.ownerAgentRef ? ` · ${tour.ownerAgentRef}` : ""}</Paragraph><Paragraph><strong>Verification:</strong> {tour.tremVerified ? `TREM verified${tour.tremVerifiedAt ? ` on ${new Date(tour.tremVerifiedAt).toLocaleDateString()}` : ""}` : "Not verified"}</Paragraph><Paragraph><strong>Created:</strong> {tour.createdAt ? new Date(tour.createdAt).toLocaleString() : "—"}</Paragraph><Paragraph><strong>Last updated:</strong> {tour.updatedAt ? new Date(tour.updatedAt).toLocaleString() : "—"}</Paragraph></section>
            <RecordReview
              data={tour}
              title="Complete tour record"
              description="Every available tour value, including nested pricing, itinerary, ownership, verification, and audit fields."
            />
          </main>
        </div>

        <footer className="tv-footer">
          <div className="tv-footer-left">
            <small>Tags: {(tour.tags || []).join(', ') || '—'}</small>
          </div>
     
        </footer>
      </aside>
    </div>
  );
}
