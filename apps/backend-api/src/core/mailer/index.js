// server/utils/mailer.js
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@example.com";

let transporter = null;

if (SMTP_HOST && SMTP_PORT) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  // verify transporter quickly in dev/startup (optional)
  transporter.verify().then(() => {
    console.info("Mailer: SMTP transporter ready");
  }).catch((err) => {
    console.warn("Mailer: SMTP transporter verify failed", err && err.message ? err.message : err);
  });
}

const sendMail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    // no SMTP configured — fallback to console (dev)
    console.info("[mailer] fallback sendMail: to=", to, "subject=", subject, "text=", text);
    return Promise.resolve();
  }

  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
  });

  return info;
};

export default { sendMail };
