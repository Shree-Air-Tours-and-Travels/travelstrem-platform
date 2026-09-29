import React from "react";
import { Button, CardWithSubEntity } from "@packages/trem-ui";
import ModalShell from "./ModalShell.jsx";
import EnquiryError from "./EnquiryError.jsx";
import "./EnquiryModal.styles.scss";

export default function EnquiryModal({
  open, title, note, summary, error, onClose, onConfirm,
  confirmLabel = "Confirm and continue", cancelLabel = "Cancel", confirmDisabled = false,
}) {
  return (
    <ModalShell open={open} label={title} onClose={onClose} dialogClassName="trem-enquiry-modal">
      <header className="trem-enquiry-modal__header">
        <h2>{title}</h2>
        <Button variant="text" isCircular iconLeft="x" aria-label="Close" onClick={onClose} />
      </header>
      <div className="trem-enquiry-modal__body">
        {note ? <p>{note}</p> : null}
        {summary ? <CardWithSubEntity {...summary} /> : null}
        <EnquiryError error={error} />
      </div>
      <footer className="trem-enquiry-modal__actions">
        <Button variant="outline" text={cancelLabel} onClick={onClose} />
        <Button variant="solid" text={confirmLabel} onClick={onConfirm} disabled={confirmDisabled || !summary} />
      </footer>
    </ModalShell>
  );
}
