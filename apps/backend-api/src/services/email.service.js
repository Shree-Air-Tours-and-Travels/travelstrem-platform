import config from "../config/env.js";
import sendEmail from "../utils/sendEmail.js";
import welcomeTemplate from "../templates/welcome.template.js";
import loginTemplate from "../templates/login.template.js";
import bookingTemplate from "../templates/booking.template.js";
import paymentTemplate from "../templates/payment.template.js";
import resetPasswordTemplate from "../templates/resetPassword.template.js";
import invitationTemplate from "../templates/invitation.template.js";
import tenantNotificationTemplate from "../templates/tenantNotification.template.js";

/**
 * Application-facing email service. Domain code calls these functions and is
 * therefore isolated from Nodemailer and the active delivery provider.
 */
const brandDefaults = () => ({
  companyName: config.COMPANY_NAME,
  supportEmail: config.SUPPORT_EMAIL,
});

const deliver = async (to, template, options = {}) => sendEmail({
  to,
  subject: options.subject || template.subject,
  text: template.text,
  html: template.html,
  replyTo: options.replyTo,
}, { provider: options.provider });

export async function sendWelcomeEmail({ to, provider, ...data }) {
  return deliver(to, welcomeTemplate({ ...brandDefaults(), ...data }), { provider });
}

export async function sendLoginEmail({ to, subject, provider, ...data }) {
  return deliver(to, loginTemplate({ ...brandDefaults(), ...data }), { subject, provider });
}

export async function sendBookingConfirmation({ to, provider, ...data }) {
  return deliver(to, bookingTemplate({ ...brandDefaults(), ...data }), { provider });
}

export async function sendPaymentSuccess({ to, provider, ...data }) {
  return deliver(to, paymentTemplate({ ...brandDefaults(), ...data }), { provider });
}

export async function sendPasswordResetEmail({ to, subject, provider, ...data }) {
  return deliver(to, resetPasswordTemplate({ ...brandDefaults(), ...data }), { subject, provider });
}
export async function sendInvitationEmail({ to, provider, ...data }) {
  return deliver(to, invitationTemplate({ ...brandDefaults(), ...data }), { provider });
}

export async function sendTenantNotificationEmail({ to, provider, ...data }) {
  return deliver(to, tenantNotificationTemplate({ ...brandDefaults(), ...data }), { provider });
}

/** Supports operational emails while keeping controllers provider-agnostic. */
export async function sendTransactionalEmail({ to, subject, html, text, replyTo, provider }) {
  return sendEmail({ to, subject, html, text, replyTo }, { provider });
}

export default {
  sendWelcomeEmail,
  sendLoginEmail,
  sendBookingConfirmation,
  sendPaymentSuccess,
  sendPasswordResetEmail,
  sendInvitationEmail,
  sendTenantNotificationEmail,
  sendTransactionalEmail,
};
