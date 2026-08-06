/** Shared, Gmail-safe email layout. Templates pass escaped content into this shell. */
export const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export const renderEmailLayout = ({
  companyName,
  preheader = "",
  title,
  intro = "",
  content = "",
  action,
  footerText = "",
}) => {
  const brand = escapeHtml(companyName);
  const year = new Date().getFullYear();
  const actionMarkup = action?.url && action?.label
    ? `<tr><td style="padding:8px 32px 28px;"><a href="${escapeHtml(action.url)}" style="display:inline-block;padding:13px 22px;border-radius:8px;background:#183b8f;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;">${escapeHtml(action.label)}</a></td></tr>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f6fa;color:#111827;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f4f6fa;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <tr><td style="padding:24px 32px;background:#0f1b33;color:#ffffff;font-family:Arial,sans-serif;font-size:20px;font-weight:700;">${brand}</td></tr>
        <tr><td style="padding:32px 32px 10px;font-family:Arial,sans-serif;font-size:28px;line-height:1.25;font-weight:700;color:#111827;">${escapeHtml(title)}</td></tr>
        ${intro ? `<tr><td style="padding:0 32px 22px;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#4b5563;">${escapeHtml(intro)}</td></tr>` : ""}
        <tr><td style="padding:0 32px 24px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;">${content}</td></tr>
        ${actionMarkup}
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b7280;">${footerText ? `${escapeHtml(footerText)}<br>` : ""}&copy; ${year} ${brand}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
};

export const detailRow = (label, value) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">${escapeHtml(label)}</td>
    <td align="right" style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-weight:700;">${escapeHtml(value)}</td>
  </tr>`;
