const nodemailer = require('nodemailer');
const config = require('../config');

// Lazily-created, cached transporter. Using a cached promise (not just a
// cached value) means concurrent calls before the first one resolves all
// await the same in-flight setup instead of racing to create it twice.
let transporterPromise = null;
let usingEthereal = false;

const SMTP_TIMEOUT_MS = 8000;

function createRealTransport() {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure, // true for port 465 (implicit TLS), false for 587 (STARTTLS)
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS
  });
}

async function createEtherealTransport() {
  const testAccount = await nodemailer.createTestAccount();
  usingEthereal = true;
  console.warn(
    '[email] SMTP_PASS is not set — using Ethereal test SMTP instead of Hostinger. ' +
    'Preview links for each sent message will be logged below instead of ' +
    'real delivery. This must never happen in production.'
  );
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
}

function getTransporter() {
  if (!transporterPromise) {
    if (config.smtpUser && config.smtpPass) {
      transporterPromise = Promise.resolve(createRealTransport());
    } else if (config.isProduction) {
      transporterPromise = Promise.reject(
        new Error('SMTP_USER / SMTP_PASS are not configured.')
      );
    } else {
      transporterPromise = createEtherealTransport();
    }
  }
  return transporterPromise;
}

/** Verifies the SMTP connection/credentials without sending a message. */
async function verifyConnection() {
  const transporter = await getTransporter();
  await transporter.verify();
  return { ok: true, host: config.smtpHost, port: config.smtpPort, secure: config.smtpSecure, user: config.smtpUser, ethereal: usingEthereal };
}

// Defense in depth against header/email injection via user-supplied
// name/email fields — nodemailer already rejects raw CR/LF in headers,
// but stripping here means malformed input never reaches that check.
function sanitizeHeaderValue(value) {
  return String(value == null ? '' : value).replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Sends one email. Never throws — callers (form submission routes) must
 * never fail a request just because email delivery had a hiccup; the
 * customer's data is already saved by the time this is called. Returns
 * { success, error?, previewUrl? } so callers can log/report as needed.
 */
async function sendMail({ to, subject, html, text, replyTo }) {
  try {
    if (!config.mailFrom) {
      throw new Error('MAIL_FROM is not configured.');
    }
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: config.mailFrom,
      to: sanitizeHeaderValue(to),
      subject: sanitizeHeaderValue(subject),
      html,
      text,
      replyTo: replyTo ? sanitizeHeaderValue(replyTo) : undefined
    });

    const result = { success: true, messageId: info.messageId };
    if (usingEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      result.previewUrl = previewUrl;
      console.log(`[email] (Ethereal preview) "${subject}" → ${to}: ${previewUrl}`);
    }
    return result;
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendMail, getTransporter, verifyConnection };
