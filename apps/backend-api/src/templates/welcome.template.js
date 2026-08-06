import { escapeHtml, renderEmailLayout } from "./base.template.js";

/** Builds the welcome message without sending it. */
export default function welcomeTemplate({ companyName, customerName, dashboardUrl, supportEmail }) {
  const name = customerName || "Traveller";
  return {
    subject: `Welcome to ${companyName}`,
    text: `Welcome, ${name}. Your ${companyName} account is ready.`,
    html: renderEmailLayout({
      companyName,
      preheader: `Your ${companyName} account is ready.`,
      title: `Welcome, ${name}`,
      intro: `Your account is ready. Plan trips, manage bookings and keep your travel details together.`,
      content: `<p style="margin:0;">We are glad to have you with us. You can now explore travel products and manage every reservation from one place.</p>${supportEmail ? `<p style="margin:16px 0 0;">Need help? Contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#183b8f;">${escapeHtml(supportEmail)}</a>.</p>` : ""}`,
      action: dashboardUrl ? { label: "Open dashboard", url: dashboardUrl } : null,
    }),
  };
}
