import { detailRow, escapeHtml, renderEmailLayout } from "./base.template.js";

/** Builds login notifications and login/registration OTP messages. */
export default function loginTemplate({ companyName, customerName, loginTime, device, location, otp, purpose = "login", expiresInMinutes }) {
  const rows = [
    loginTime && detailRow("Time", loginTime),
    device && detailRow("Device", device),
    location && detailRow("Location", location),
  ].filter(Boolean).join("");
  const otpMarkup = otp
    ? `<div style="margin:4px 0 20px;padding:18px;border-radius:10px;background:#eef2ff;text-align:center;"><div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(purpose)} code</div><div style="margin-top:6px;font-size:30px;font-weight:700;letter-spacing:8px;color:#183b8f;">${escapeHtml(otp)}</div></div>`
    : "";
  return {
    subject: otp ? `Your ${purpose} code` : "New login to your account",
    text: otp
      ? `Your ${purpose} code is ${otp}.${expiresInMinutes ? ` It expires in ${expiresInMinutes} minutes.` : ""}`
      : `A new login was recorded${loginTime ? ` at ${loginTime}` : ""}.`,
    html: renderEmailLayout({
      companyName,
      preheader: otp ? `Your ${purpose} code is ${otp}.` : "A new login was recorded.",
      title: otp ? `Verify your ${purpose}` : "New login detected",
      intro: customerName ? `Hello ${customerName}, use the details below to continue securely.` : "Use the details below to continue securely.",
      content: `${otpMarkup}${rows ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>` : ""}${expiresInMinutes ? `<p style="margin:16px 0 0;color:#6b7280;">This code expires in ${escapeHtml(expiresInMinutes)} minutes. Never share it with anyone.</p>` : ""}`,
    }),
  };
}
