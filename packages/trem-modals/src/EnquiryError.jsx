import React from "react";
import { buildGlobalAuthUrl, buildGlobalAppShellUrl } from "@packages/trem-utils";
import "./EnquiryError.styles.scss";

export default function EnquiryError({ error }) {
  if (!error) return null;
  const message = error.response?.data?.message || error.message || String(error);
  const needsSignIn = Number(error.status || error.statusCode || error.response?.status) === 401 ||
    error.code === "AUTH_REQUIRED" || /sign\s*in|log\s*in|unauthenticated|unauthorized|authentication required/i.test(message);

  const needsMobile = error.code === "MOBILE_REQUIRED" || /add your mobile number to your profile/i.test(message);

  return (
    <div className="trem-enquiry-error" role="alert">
      {needsSignIn ? "Please sign in to create your enquiry." : message}
      {needsSignIn ? (
        <> <a href={buildGlobalAuthUrl({ returnTo: window.location.href })}>Sign in</a></>
      ) : null}
      {needsMobile ? <> <a href={buildGlobalAppShellUrl({ tab: "profile" })}>Add mobile number</a></> : null}
    </div>
  );
}
