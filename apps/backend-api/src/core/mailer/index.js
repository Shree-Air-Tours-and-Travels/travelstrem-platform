// server/utils/mailer.js
import nodemailer from "nodemailer";
import config from "../../config/env.js";

const SMTP_HOST = config.SMTP.host;
const SMTP_PORT = config.SMTP.port;
const SMTP_USER = config.SMTP.user;
const SMTP_PASS = config.SMTP.pass;
const SMTP_FROM = config.SMTP.from || config.SMTP.user;

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
  if (!transporter || !SMTP_FROM) {
    // no SMTP configured , fallback to console (dev)
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
