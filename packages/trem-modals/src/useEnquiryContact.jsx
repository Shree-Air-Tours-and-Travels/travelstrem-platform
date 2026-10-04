import React, { useEffect, useRef, useState } from "react";
import { InputField, InfoTooltip } from "@packages/trem-ui";
import ConfirmOverlay from "./ConfirmOverlay.jsx";

export default function useEnquiryContact() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [savePhoneToProfile, setSave] = useState(false);
  const resolveRef = useRef(null);
  useEffect(() => () => resolveRef.current?.(null), []);
  const finish = (value) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setOpen(false);
  };
  const request = () =>
    new Promise((resolve) => {
      resolveRef.current = resolve;
      setOpen(true);
    });
  return {
    request,
    modal: open ? (
      <ConfirmOverlay
        open
        title="Add a contact number"
        note="Use this number for this enquiry. Saving it to your profile is optional."
        confirmLabel="Continue enquiry"
        cancelLabel="Keep reviewing"
        confirmDisabled={!phone.trim()}
        onClose={() => finish(null)}
        onConfirm={() => finish({ phone, savePhoneToProfile })}
      >
        <InputField
          type="tel"
          label="Phone number"
          value={phone}
          onChange={setPhone}
          placeholder="+91 98765 43210"
        />
        <label>
          <input
            type="checkbox"
            checked={savePhoneToProfile}
            onChange={(e) => setSave(e.target.checked)}
          />{" "}
          Add in profile
        </label>
        <InfoTooltip
          inModal
          label="About saving your number"
          text="Save this number for faster future enquiries. This does not verify the number."
        />
      </ConfirmOverlay>
    ) : null,
  };
}
