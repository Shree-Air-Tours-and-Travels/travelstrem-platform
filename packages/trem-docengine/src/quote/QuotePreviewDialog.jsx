import React from "react";
import { createPortal } from "react-dom";
import QuoteDocumentPreview from "./QuoteDocumentPreview";
import "./quoteDocument.css";

export default function QuotePreviewDialog({
  booking,
  quote,
  amount,
  currency,
  notes,
  companyName,
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="trem-docengine-preview-trigger"
        onClick={() => setOpen(true)}
      >
        <span>Quote document</span>
        <strong>Preview HTML layout</strong>
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="trem-docengine-dialog"
              role="presentation"
              onMouseDown={() => setOpen(false)}
            >
              <section
                className="trem-docengine-dialog__panel"
                role="dialog"
                aria-modal="true"
                aria-label="Quote document preview"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div className="trem-docengine-dialog__bar">
                  <div>
                    <strong>Quote preview</strong>
                    <span>This is the HTML layout for the document engine.</span>
                  </div>
                  <button type="button" onClick={() => setOpen(false)} aria-label="Close preview">
                    ×
                  </button>
                </div>
                <div className="trem-docengine-dialog__content">
                  <QuoteDocumentPreview
                    booking={booking}
                    quote={quote}
                    amount={amount}
                    currency={currency}
                    notes={notes}
                    companyName={companyName}
                  />
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
