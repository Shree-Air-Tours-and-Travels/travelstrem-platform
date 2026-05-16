import React, { useEffect, useRef } from 'react';
import TourViewView from './TourView.view';

export default function TourView({ tour, onClose = () => {}, onEdit = () => {} }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!tour) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const el = panelRef.current;
    if (el) el.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [tour, onClose]);

  return <TourViewView tour={tour} onClose={onClose} onEdit={onEdit} panelRef={panelRef} />;
}
