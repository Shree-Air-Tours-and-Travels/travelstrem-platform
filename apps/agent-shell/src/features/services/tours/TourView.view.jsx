import React, { useState } from 'react';
import { Button, SubTitle, Paragraph } from "@packages/trem-ui";
import pageConfig from "./tourView.config.json";
import './TourView.scss';

function TourImage({ photo, alt }) {
  const [failed, setFailed] = useState(false);
  if (!photo || failed) {
    return <div className="tv-photo tv-photo--fallback" aria-label={alt || 'Tour image'}>{pageConfig.fallbackImage}</div>;
  }
  return <img src={photo} alt={alt || 'Tour image'} className="tv-photo" onError={() => setFailed(true)} />;
}

function MetaBlock({ label, value }) {
  if (value == null || value === '' || value === '—') return null;
  return (
    <div className="tv-meta-block">
      <span className="tv-meta-label">{label}</span>
      <span className="tv-meta-value">{value}</span>
    </div>
  );
}

function Section({ title, children, empty, emptyText = pageConfig.fallbackText }) {
  if (empty) return null;
  return (
    <section className="tv-section">
      <SubTitle text={title} />
      {children}
    </section>
  );
}

function ArraySection({ title, items, emptyText, renderItem, keyFn }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="tv-section">
      <SubTitle text={title} />
      {items.length === 0 ? <Paragraph>{emptyText || pageConfig.fallbackText}</Paragraph> : items.map((item, i) => (
        <div key={keyFn ? keyFn(item, i) : i} className="tv-array-item">
          {renderItem(item, i)}
        </div>
      ))}
    </section>
  );
}

const tvContent = (tour, onEdit, onClose, isPage) => {
  const dateOpts = { year: 'numeric', month: 'short', day: 'numeric' };
  const { meta, sections, itineraryLabels } = pageConfig;

  return (
  <>
    <header className="tv-header">
      <div className="tv-title">
        <div className="tv-title-row">
          <SubTitle text={tour.title} variant="primary" size="large" />
          {tour.featured && <span className="tv-badge tv-badge--featured">{pageConfig.badgeFeatured}</span>}
          {tour.status && <span className={`tv-badge tv-badge--${tour.status}`}>{tour.status}</span>}
        </div>
        <div className="tv-meta">{tour.city?.from || '?'} → {tour.city?.to || '?'}</div>
        {tour.avgRating > 0 && <div className="tv-rating">★ {tour.avgRating} ({Array.isArray(tour.reviews) ? tour.reviews.length : 0} reviews)</div>}
      </div>
      <div className="tv-actions">
        <Button primaryClassName="btn" variant="solid" color="primary" onClick={() => onEdit(tour)} text={pageConfig.editButton.text} />
        {onClose && (
          <Button primaryClassName="btn" variant="outline" onClick={onClose} text={isPage ? pageConfig.backButton.text : pageConfig.closeButton.text} />
        )}
      </div>
    </header>

    <div className="tv-body">
      <div className="tv-aside">
        <TourImage photo={tour.photo || (Array.isArray(tour.photos) && tour.photos[0]) || ''} alt={tour.title} />
      </div>

      <main className="tv-main" aria-label="Tour content">
        <div className="tv-summary-grid">
          <MetaBlock label={meta.duration.label} value={tour.period ? `${tour.period.days}d / ${tour.period.nights}n` : '—'} />
          <MetaBlock label={meta.distance.label} value={tour.distance != null ? `${tour.distance} km` : '—'} />
          <MetaBlock label={meta.price.label} value={tour.price ? `${tour.price.currency} ${tour.price.min} - ${tour.price.max}` : '—'} />
          <MetaBlock label={meta.groupSize.label} value={tour.maxGroupSize ? `Up to ${tour.maxGroupSize}` : '—'} />
          <MetaBlock label={meta.ageRange.label} value={tour.minAge != null || tour.maxAge != null ? `${tour.minAge ?? 0} - ${tour.maxAge ?? '∞'}` : '—'} />
          <MetaBlock label={meta.seats.label} value={tour.availability ? `${tour.availability.seatsAvailable ?? '—'} / ${tour.availability.totalSeats ?? '—'}` : '—'} />
          <MetaBlock label={meta.meetingPoint.label} value={tour.meetingPoint} />
          <MetaBlock label={meta.languages.label} value={Array.isArray(tour.languages) && tour.languages.length > 0 ? tour.languages.join(', ') : '—'} />
        </div>

        <Section title={sections.schedule.title} empty={!tour.startDate && !tour.endDate}>
          <Paragraph>
            {tour.startDate ? new Date(tour.startDate).toLocaleDateString('en-US', dateOpts) : '—'}
            {' — '}
            {tour.endDate ? new Date(tour.endDate).toLocaleDateString('en-US', dateOpts) : '—'}
          </Paragraph>
        </Section>

        <Section title={sections.description.title} empty={!tour.desc}>
          <Paragraph>{tour.desc}</Paragraph>
        </Section>

        <Section title={sections.address.title} empty={!tour.address?.line1 && !tour.address?.city}>
          <Paragraph>
            {[tour.address?.line1, tour.address?.line2, tour.address?.city, tour.address?.state, tour.address?.zip, tour.address?.country].filter(Boolean).join(', ') || '—'}
          </Paragraph>
        </Section>

        {Array.isArray(tour.photos) && tour.photos.length > 1 && (
          <section className="tv-section">
            <SubTitle text={sections.photoGallery.title} />
            <div className="tv-gallery">
              {tour.photos.map((url, i) => (
                <img key={i} src={url} alt={`${tour.title} photo ${i + 1}`} className="tv-gallery-img" onError={(e) => { e.target.style.display = 'none'; }} />
              ))}
            </div>
          </section>
        )}

        <Section title={sections.itinerary.title} empty={!Array.isArray(tour.itinerary) || tour.itinerary.length === 0}>
          {(tour.itinerary || []).map((it) => (
            <div key={it._id || it.day} className="tv-it">
              <strong className="tv-it-day">Day {it.day}</strong>
              <div className="tv-it-content">
                <strong className="tv-it-title">{it.title || ''}</strong>
                {it.summary && <Paragraph>{it.summary}</Paragraph>}
                {Array.isArray(it.activities) && it.activities.length > 0 && (
                  <div className="tv-it-details">{itineraryLabels.activities}: {it.activities.join(', ')}</div>
                )}
                {Array.isArray(it.meals) && it.meals.length > 0 && (
                  <div className="tv-it-details">{itineraryLabels.meals}: {it.meals.join(', ')}</div>
                )}
                {it.accommodation && <div className="tv-it-details">{itineraryLabels.accommodation}: {it.accommodation}</div>}
                {it.location && <div className="tv-it-details">{itineraryLabels.location}: {it.location}</div>}
                {it.notes && <div className="tv-it-details">{itineraryLabels.notes}: {it.notes}</div>}
              </div>
            </div>
          ))}
        </Section>

        <ArraySection
          title={sections.highlights.title}
          items={tour.highlights}
          renderItem={(h) => (
            <div className="tv-highlight-item">
              {h.icon && <span className="tv-highlight-icon">{h.icon}</span>}
              <span><strong>{h.title}</strong>{h.short ? ` — ${h.short}` : ''}</span>
            </div>
          )}
        />

        <Section title={sections.inclusions.title} empty={!Array.isArray(tour.inclusions) || tour.inclusions.length === 0}>
          <ul className="tv-list">{tour.inclusions.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </Section>

        <Section title={sections.exclusions.title} empty={!Array.isArray(tour.exclusions) || tour.exclusions.length === 0}>
          <ul className="tv-list">{tour.exclusions.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </Section>

        <Section title={sections.cancellationPolicy.title} empty={!tour.cancellationPolicy}>
          <Paragraph>{tour.cancellationPolicy}</Paragraph>
        </Section>

        <Section title={sections.seasonalPricing.title} empty={!Array.isArray(tour.seasonalPricing) || tour.seasonalPricing.length === 0}>
          {(tour.seasonalPricing || []).map((s, i) => (
            <div key={s._id || i} className="tv-seasonal-item">
              <strong>{s.seasonName}</strong>: {s.min}-{s.max} {s.currency}
              <span className="tv-seasonal-dates">
                ({new Date(s.startDate).toLocaleDateString('en-US', dateOpts)} — {new Date(s.endDate).toLocaleDateString('en-US', dateOpts)})
              </span>
              {s.notes && <div className="tv-seasonal-notes">{s.notes}</div>}
            </div>
          ))}
        </Section>

        <Section title={sections.tags.title} empty={!Array.isArray(tour.tags) || tour.tags.length === 0}>
          <Paragraph>{(tour.tags || []).join(', ') || pageConfig.fallbackText}</Paragraph>
        </Section>

        <Section title={sections.reviews.title} empty={!Array.isArray(tour.reviews) || tour.reviews.length === 0}>
          {(tour.reviews || []).map((r, i) => (
            <div key={r._id || i} className="tv-review">
              <div className="tv-review-header">
                <strong>{r.name}</strong>
                <span className="tv-review-rating">{'★'.repeat(Math.round(r.rating || 0))}{'☆'.repeat(5 - Math.round(r.rating || 0))}</span>
              </div>
              {r.comment && <Paragraph>{r.comment}</Paragraph>}
            </div>
          ))}
        </Section>

        <Section title={sections.tourInfo.title} empty={!tour.ownerAgent && !tour.inventorySource && !tour.agencyRef}>
          <div className="tv-info-grid">
            {tour.ownerAgentName && <MetaBlock label="Owner" value={tour.ownerAgentName} />}
            {tour.ownerAgentRef && <MetaBlock label="Owner Ref" value={tour.ownerAgentRef} />}
            {tour.agencyRef && <MetaBlock label="Agency Ref" value={tour.agencyRef} />}
            {tour.inventorySource && <MetaBlock label="Source" value={tour.inventorySource} />}
            {tour.providerName && <MetaBlock label="Provider" value={tour.providerName} />}
            {tour.createdAt && <MetaBlock label="Created" value={new Date(tour.createdAt).toLocaleDateString('en-US', dateOpts)} />}
            {tour.updatedAt && <MetaBlock label="Updated" value={new Date(tour.updatedAt).toLocaleDateString('en-US', dateOpts)} />}
          </div>
        </Section>
      </main>
    </div>
  </>
);
};

export default function TourViewView({ tour, onClose, onEdit, panelRef, variant = 'modal' }) {
  if (!tour) return null;

  if (variant === 'page') {
    return (
      <div className="tour-view tour-view--page">
        {tvContent(tour, onEdit, onClose, true)}
      </div>
    );
  }

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
        {tvContent(tour, onEdit, onClose, false)}
      </aside>
    </div>
  );
}
