// src/components/TourView.jsx
import React, { useEffect, useRef } from 'react';
import './TourView.scss';

export default function TourView({ tour, onClose = () => {}, onEdit = () => {} }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!tour) return;

    // lock background scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // focus panel for accessibility
    const el = panelRef.current;
    if (el) el.focus();

    // handle Escape
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [tour, onClose]);

  if (!tour) return null;

  const imageSrc = tour.photo || (Array.isArray(tour.photos) && tour.photos[0]) || '';

  return (
    <div
      className="tour-view-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${tour.title} details`}
      onClick={onClose} // backdrop click closes
    >
      <aside
        className="tour-view"
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()} // prevent backdrop close when interacting inside panel
      >
        <header className="tv-header">
          <div className="tv-title">
            <h3>{tour.title}</h3>
            <div className="tv-meta">{tour.city?.from} → {tour.city?.to}</div>
          </div>

          <div className="tv-actions">
            <button className="btn" onClick={() => onEdit(tour)}>Edit</button>
            <button className="btn" onClick={onClose} aria-label="Close view">Close</button>
          </div>
        </header>

        <div className="tv-body">
          <div className="tv-aside">
            <img src={imageSrc} alt={tour.title} className="tv-photo" />
           
          </div>

          <main className="tv-main" aria-label="Tour content">
            <div className="tv-row">
              <div className="tv-summary">
                <p><strong>Duration:</strong> {tour.period?.days}d / {tour.period?.nights}n</p>
                <p><strong>Distance:</strong> {tour.distance ?? '—'} km</p>
                <p><strong>Price:</strong> {tour.price ? `${tour.price.min}-${tour.price.max} ${tour.price.currency}` : '—'}</p>
                <p><strong>Seats:</strong> {tour.availability?.seatsAvailable ?? '—'} / {tour.availability?.totalSeats ?? '—'}</p>
                <p><strong>Meeting point:</strong> {tour.meetingPoint || '—'}</p>
              </div>
            </div>

            <section className="tv-section">
              <h4>Description</h4>
              <p>{tour.desc || 'No description available.'}</p>
            </section>

            <section className="tv-section">
              <h4>Itinerary</h4>
              {(tour.itinerary || []).length === 0 && <p className="tv-empty">No itinerary provided.</p>}
              {(tour.itinerary || []).map(it => (
                <div key={it._id || it.day} className="tv-it">
                  <strong>Day {it.day} — {it.title || ''}</strong>
                  {it.summary && <p>{it.summary}</p>}
                </div>
              ))}
            </section>

            <section className="tv-section">
              <h4>Highlights</h4>
              {(tour.highlights || []).length === 0 ? <p>—</p> : (
                <ul>
                  {(tour.highlights || []).map((h, idx) => <li key={h._id || idx}>{h.title || h}</li>)}
                </ul>
              )}
            </section>

            <section className="tv-section">
              <h4>Seasonal Pricing</h4>
              {(tour.seasonalPricing || []).length === 0 ? <p>—</p> : (
                <ul>
                  {(tour.seasonalPricing || []).map((s, idx) => (
                    <li key={s._id || idx}>
                      {s.seasonName || 'Season'} — {s.min ?? '-'}-{s.max ?? '-'} {s.currency || (tour.price && tour.price.currency) || ''}
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
            <small>Tags: {(tour.tags || []).join(', ') || '—'}</small>
          </div>
     
        </footer>
      </aside>
    </div>
  );
}
