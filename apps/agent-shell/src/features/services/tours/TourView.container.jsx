import React, { useCallback, useEffect, useRef } from 'react';
import TourViewView from './TourView.view';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function TourView({ tour, onClose = () => {}, onEdit = () => {}, variant = 'modal' }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const timerRef = useRef(null);

  const trapFocus = useCallback((e) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const els = panelRef.current.querySelectorAll(FOCUSABLE);
    if (els.length === 0) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!tour || variant === 'page') return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const el = panelRef.current;
    if (el) {
      el.focus();
      const first = el.querySelector(FOCUSABLE);
      if (first) {
        timerRef.current = setTimeout(() => first.focus(), 50);
      }
    }

    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keydown', trapFocus);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keydown', trapFocus);
    };
  }, [tour, variant, trapFocus]);

  return <TourViewView tour={tour} onClose={onClose} onEdit={onEdit} panelRef={panelRef} variant={variant} />;
}
