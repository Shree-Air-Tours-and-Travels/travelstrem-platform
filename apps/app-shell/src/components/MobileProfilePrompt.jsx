import React, { useEffect, useState } from "react";
import { InputField } from "@packages/trem-ui";
import { ConfirmOverlay } from "@packages/trem-modals";
import { fetchData } from "@packages/trem-utils";

export default function MobileProfilePrompt({ userId, eligible, onSaved }) {
  const [prompt, setPrompt] = useState(null);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId || !eligible) return undefined;
    let cancelled = false;
    // Wait until the initial page has settled before claiming the reminder.
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetchData("/auth/profile/mobile-prompt", { method: "POST" });
        if (!cancelled && response.status === "success") setPrompt(response.data);
      } catch { /* An optional reminder must not block browsing. */ }
    }, 15000);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [userId, eligible]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetchData("/auth/profile", { method: "PUT", body: { phone } });
      if (response.status !== "success") throw new Error(response.message);
      setPrompt(null);
      onSaved?.();
    } catch (failure) {
      setError(failure.message || "We couldn’t save your number. Please try again.");
    } finally { setSaving(false); }
  };

  return (
    <ConfirmOverlay
      open={Boolean(prompt) && eligible}
      title={prompt?.title}
      note={prompt?.description}
      confirmLabel={prompt?.saveLabel}
      cancelLabel={prompt?.dismissLabel}
      confirmDisabled={saving}
      onClose={() => !saving && setPrompt(null)}
      onConfirm={save}
    >
      <InputField label={prompt?.label} placeholder={prompt?.placeholder}
        value={phone} onChange={setPhone} inputMode="tel" disabled={saving} error={error} />
    </ConfirmOverlay>
  );
}
