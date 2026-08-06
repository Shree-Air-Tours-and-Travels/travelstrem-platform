import { escapeHtml, renderEmailLayout } from "./base.template.js";

/** Builds password-reset links or OTP messages. */
export default function resetPasswordTemplate({ companyName, customerName, resetUrl, otp, expiresInMinutes }) {
  const code = otp
    ? `<div style="margin:4px 0 20px;padding:18px;border-radius:10px;background:#eef2ff;text-align:center;font-size:30px;font-weight:700;letter-spacing:8px;color:#183b8f;">${escapeHtml(otp)}</div>`
    : "";
  return {
    subject: "Reset your password",
    text: otp
      ? `Your password reset code is ${otp}.${expiresInMinutes ? ` It expires in ${expiresInMinutes} minutes.` : ""}`
      : `Use this link to reset your password: ${resetUrl || ""}`,
    html: renderEmailLayout({
      companyName,
      preheader: "Securely reset your password.",
      title: "Reset your password",
      intro: customerName ? `Hello ${customerName}, we received a request to reset your password.` : "We received a request to reset your password.",
      content: `${code}<p style="margin:0;color:#6b7280;">${expiresInMinutes ? `This request expires in ${escapeHtml(expiresInMinutes)} minutes. ` : ""}If you did not request this, you can safely ignore this email.</p>`,
      action: resetUrl ? { label: "Reset password", url: resetUrl } : null,
    }),
  };
}
