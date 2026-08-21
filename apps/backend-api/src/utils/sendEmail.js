import { getEmailProvider } from "../config/mail.js";
import logger from "../shared/logger/index.js";

const TRANSIENT_EMAIL_ERRORS = new Set([
  "ETIMEDOUT",
  "ECONNECTION",
  "ECONNRESET",
  "EAI_AGAIN",
  "ESOCKET",
]);
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function deliverWithRetry(provider, message) {
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await provider.send(message);
    } catch (error) {
      const shouldRetry = attempt < maxAttempts && TRANSIENT_EMAIL_ERRORS.has(error?.code);
      if (!shouldRetry) throw error;
      logger.warn("Transient email delivery failure; retrying", {
        code: error.code,
        attempt,
      });
      await wait(750);
    }
  }
  return null;
}

/**
 * Provider-neutral email utility. It always resolves with a result object so a
 * mail-provider outage cannot cause an unhandled rejection or crash the API.
 */
export async function sendEmail({ to, subject, html, text, replyTo, from, attachments }, { provider } = {}) {
  try {
    if (!to) return { success: false, message: "Email recipient is required", code: "EMAIL_RECIPIENT_REQUIRED" };
    if (!subject) return { success: false, message: "Email subject is required", code: "EMAIL_SUBJECT_REQUIRED" };
    if (!html && !text) return { success: false, message: "Email content is required", code: "EMAIL_CONTENT_REQUIRED" };

    const activeProvider = provider || getEmailProvider();
    const info = await deliverWithRetry(activeProvider, { to, subject, html, text, replyTo, from, attachments });
    return {
      success: true,
      message: "Email sent successfully",
      messageId: info?.messageId || null,
    };
  } catch (error) {
    logger.error("Email delivery failed", {
      message: error?.message || String(error),
      code: error?.code,
    });
    return {
      success: false,
      message: "Email could not be sent. Please try again later.",
      code: error?.code || "EMAIL_DELIVERY_FAILED",
      details: error?.message || "Unknown email delivery error",
    };
  }
}

export default sendEmail;
