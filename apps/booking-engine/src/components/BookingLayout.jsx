import React, { useState, useCallback } from "react";
import BookingProgress from "@packages/trem-ui/components/BookingProgress/BookingProgress.jsx";
import ConfirmOverlay from "@packages/trem-modals/ConfirmOverlay.jsx";
import ScrollToTopButton from "@packages/trem-ui/components/ScrollToTopButton/ScrollToTopButton.jsx";

export default function BookingLayout({ steps, currentStep, product, children, sidebar, floatingBar, onExit }) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const hasProgress = true;

  const handleExitClick = useCallback(() => {
    setShowExitConfirm(true);
  }, []);

  const handleConfirmExit = useCallback(() => {
    setShowExitConfirm(false);
    if (onExit) onExit();
  }, [onExit]);

  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  return (
    <div className="be-layout">
      <div className="be-layout__header">
        <div className="be-layout__brand">
          <span className="be-layout__logo">T</span>
          <span className="be-layout__title">{product === "trevio" ? "Trevio" : "Trevista"} Booking</span>
          {hasProgress && onExit && (
            <button type="button" className="be-layout__exit" onClick={handleExitClick} aria-label="Exit booking">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L2 8l4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M14 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Exit
            </button>
          )}
        </div>
        <BookingProgress steps={steps} currentStep={currentStep} />
      </div>
      <div className="be-layout__body">
        <div className="be-layout__main">{children}</div>
        {sidebar && <aside className="be-layout__sidebar">{sidebar}</aside>}
      </div>
      {floatingBar}
      <ScrollToTopButton />

      <ConfirmOverlay
        open={showExitConfirm}
        onClose={handleCancelExit}
        onConfirm={handleConfirmExit}
        title="Exit Booking?"
        note="Your progress will be saved. You can return and continue where you left off."
        confirmLabel="Exit"
        cancelLabel="Stay"
        icon="logOut"
      />
    </div>
  );
}
