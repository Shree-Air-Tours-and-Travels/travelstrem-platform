import { escapeHtml, renderEmailLayout } from "./base.template.js";

/** Generic lifecycle template used for tenant notifications and future events. */
export default function tenantNotificationTemplate({
    companyName,
    recipientName,
    title,
    message,
    actionLabel,
    actionUrl,
}) {
    return {
        subject: title,
        text: `${recipientName ? `${recipientName}, ` : ""}${message}${actionUrl ? ` ${actionUrl}` : ""}`,
        html: renderEmailLayout({
            companyName,
            preheader: message,
            title,
            intro: recipientName ? `Hello ${recipientName},` : "",
            content: `<p style="margin:0">${escapeHtml(message)}</p>`,
            action: actionUrl ? { label: actionLabel || "View details", url: actionUrl } : null,
        }),
    };
}
