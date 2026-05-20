import React from 'react';
import { Button, SubTitle, Paragraph } from "@packages/trem-ui";
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
            <div className="tv-meta">{tour.city?.from} → {tour.city?.to}</div>
          </div>

          <div className="tv-actions">
            <Button primaryClassName="btn" variant="solid" color="primary" onClick={() => onEdit(tour)} text="Edit" />
            <Button primaryClassName="btn" variant="outline" onClick={onClose} aria-label="Close view" text="Close" />
          </div>
        </header>

        <div className="tv-body">
          <div className="tv-aside">
            <img src={imageSrc} alt={tour.title} className="tv-photo" />
           
          </div>

          <main className="tv-main" aria-label="Tour content">
            <div className="tv-row">
              <div className="tv-summary">
                <Paragraph><strong>Duration:</strong> {tour.period?.days}d / {tour.period?.nights}n</Paragraph>
                <Paragraph><strong>Distance:</strong> {tour.distance ?? ','} km</Paragraph>
                <Paragraph><strong>Price:</strong> {tour.price ? `${tour.price.min}-${tour.price.max} ${tour.price.currency}` : ','}</Paragraph>
                <Paragraph><strong>Seats:</strong> {tour.availability?.seatsAvailable ?? ','} / {tour.availability?.totalSeats ?? ','}</Paragraph>
                <Paragraph><strong>Meeting point:</strong> {tour.meetingPoint || ','}</Paragraph>
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
              {(tour.highlights || []).length === 0 ? <Paragraph>,</Paragraph> : (
                <ul>
                  {(tour.highlights || []).map((h, idx) => <li key={h._id || idx}>{h.title || h}</li>)}
                </ul>
              )}
            </section>

            <section className="tv-section">
              <SubTitle text="Seasonal Pricing" />
              {(tour.seasonalPricing || []).length === 0 ? <Paragraph>,</Paragraph> : (
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
          </main>
        </div>

        <footer className="tv-footer">
          <div className="tv-footer-left">
            <small>Tags: {(tour.tags || []).join(', ') || ','}</small>
          </div>
     
        </footer>
      </aside>
    </div>
  );
}
