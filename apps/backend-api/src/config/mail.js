import nodemailer from "nodemailer";
import config from "./env.js";
import logger from "../shared/logger/index.js";
import { resolveTenantIntegration } from "../modules/integrations/runtime.js";

/**
 * Nodemailer adapter. The rest of the application talks to the email service,
 * allowing this adapter to be replaced by SES, SendGrid, Resend or Mailgun.
 */
const defaultProviderConfig = Object.freeze({
    host: config.SMTP.host,
    port: config.SMTP.port,
    secure: config.SMTP.secure,
    user: config.SMTP.user,
    pass: config.SMTP.pass,
    fromName: config.SMTP.fromName,
    fromEmail: config.SMTP.fromEmail,
});

const isComplete = (smtp) =>
    Boolean(smtp?.host && smtp?.port && smtp?.user && smtp?.pass && smtp?.fromEmail);

export function createSmtpProvider(overrides = {}) {
    const smtp = { ...defaultProviderConfig, ...overrides };
    if (!isComplete(smtp)) {
        return {
            configured: false,
            async verify() {
                throw new Error("SMTP configuration is incomplete");
            },
            async send() {
                throw new Error("Email service is not configured");
            },
        };
    }

    const transporter = nodemailer.createTransport({
        pool: true,
        host: smtp.host,
        port: Number(smtp.port),
        secure: Boolean(smtp.secure),
        requireTLS: !smtp.secure && Number(smtp.port) === 587,
        family: 4,
        auth: { user: smtp.user, pass: smtp.pass },
        maxConnections: 3,
        maxMessages: 50,
        connectionTimeout: 30_000,
        greetingTimeout: 30_000,
        socketTimeout: 60_000,
    });

    return {
        configured: true,
        verify: () => transporter.verify(),
        close: () => transporter.close(),
        send: (message) =>
            transporter.sendMail({
                ...message,
                from: message.from || { name: smtp.fromName, address: smtp.fromEmail },
            }),
    };
}

const providers = new Map();
export function getEmailProvider() {
    const runtime = resolveTenantIntegration("notifications.email", () => ({
        provider: "smtp",
        options: {},
        credentials: defaultProviderConfig,
    }));
    if (runtime.provider !== "smtp")
        throw new Error(`Unsupported email provider: ${runtime.provider}`);
    const smtp = { ...runtime.options, ...runtime.credentials };
    const cacheKey = JSON.stringify(smtp);
    if (!providers.has(cacheKey)) providers.set(cacheKey, createSmtpProvider(smtp));
    return providers.get(cacheKey);
}

/** Best-effort startup health check; SMTP downtime never terminates the API. */
export async function verifyEmailConnection() {
    try {
        await getEmailProvider().verify();
        logger.info("✅ SMTP Connected");
        return { success: true, message: "SMTP connected" };
    } catch (error) {
        logger.error("SMTP connection verification failed", { code: error?.code || "SMTP_UNAVAILABLE" });
        return { success: false, message: "SMTP connection verification failed" };
    }
}

export default getEmailProvider;
