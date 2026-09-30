import React, { useEffect, useRef, useState } from "react";
import { Button } from "@packages/trem-ui";
import ConfirmOverlay from "./ConfirmOverlay.jsx";

export default function useExistingEnquiryChoice() {
  const [existing, setExisting] = useState(null);
  const resolveRef = useRef(null);
  useEffect(() => () => resolveRef.current?.("review"), []);
  const finish = (choice) => {
    resolveRef.current?.(choice);
    resolveRef.current = null;
    setExisting(null);
  };
  const choose = (data) =>
    new Promise((resolve) => {
      resolveRef.current = resolve;
      setExisting(data);
    });
  const modal = existing ? (
    <ConfirmOverlay
      open
      className="trem-existing-enquiry"
      title="You already have an enquiry"
      note={`An enquiry for this product and selection already exists${existing.enquiryRef ? ` (${existing.enquiryRef})` : ""}. Continue it or start a separate enquiry.`}
      confirmLabel="Continue existing enquiry"
      cancelLabel="Keep reviewing"
      onConfirm={() => finish("continue")}
      onClose={() => finish("review")}
    >
      <Button text="Start new enquiry" variant="outline" fullWidth onClick={() => finish("new")} />
    </ConfirmOverlay>
  ) : null;
  return { choose, modal };
}
