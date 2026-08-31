import { escapeHtml, renderEmailLayout } from "./base.template.js";
export default function invitationTemplate({
    companyName,
    recipientName,
    agencyName,
    roleLabel,
    activationUrl,
    expiresInHours = 48,
}) {
    return {
        subject: `Activate your ${agencyName} partner account`,
        text: `${recipientName || "Hello"}, you were invited as ${roleLabel} for ${agencyName}. Activate your account: ${activationUrl}`,
        html: renderEmailLayout({
            companyName,
            preheader: `Your ${agencyName} partner account is ready to activate.`,
            title: "Activate your partner account",
            intro: `Hello ${escapeHtml(recipientName || "there")}, you have been invited as ${escapeHtml(roleLabel)} for ${escapeHtml(agencyName)}.`,
            content: `<p style="margin:0">Click the button below to verify your email and set a password. You will receive a one-time code to confirm it's you. The invitation expires in ${Number(expiresInHours)} hours.</p>`,
            action: { label: "Activate account", url: activationUrl },
        }),
    };
}
