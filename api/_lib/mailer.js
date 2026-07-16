const nodemailer = require('nodemailer');

// Lazily-created, cached transporter. Using a cached promise (not just a
// cached value) means concurrent calls before the first one resolves all
// await the same in-flight setup instead of racing to create it twice.
// Serverless functions can reuse a "warm" instance between invocations,
// so caching at module scope also saves reconnecting on every request.
let transporterPromise = null;
let usingEthereal = false;

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = process.env.SMTP_SECURE ? process.env.SMTP_SECURE !== 'false' : true;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
// Falls back to a placeholder address (not a real mailbox) only so the
// Ethereal dev/test path always has a syntactically valid From header —
// production always has SMTP_USER set (enforced by getTransporter below),
// so this branch is never reached with real mail actually being sent.
const MAIL_FROM = process.env.MAIL_FROM || (SMTP_USER ? `Blissful Blinds Ltd <${SMTP_USER}>` : 'Blissful Blinds Ltd <no-reply@blissfulblindsltd.co.uk>');
const MAIL_TO = process.env.MAIL_TO || SMTP_USER || 'info@blissfulblindsltd.co.uk';

// Serverless functions have a hard execution limit (Vercel's default is
// 10s on Hobby). A hung SMTP connection must not be allowed to eat the
// whole request budget, so every stage of the handshake gets its own cap.
const SMTP_TIMEOUT_MS = 8000;

const IS_PRODUCTION = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

function createRealTransport() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE, // true for port 465 (implicit TLS), false for 587 (STARTTLS)
    auth: { user: SMTP_USER, pass: SMTP_PASS },
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
    'Preview links for each sent message will be logged below instead of real delivery. ' +
    'This must never happen in production.'
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
    if (SMTP_PASS && SMTP_USER) {
      transporterPromise = Promise.resolve(createRealTransport());
    } else if (IS_PRODUCTION) {
      // Never fall back to a fake transport in production — that would
      // silently "succeed" while no real email is ever delivered.
      transporterPromise = Promise.reject(
        new Error('SMTP_USER / SMTP_PASS are not configured. Set them in the Vercel project environment variables.')
      );
    } else {
      transporterPromise = createEtherealTransport();
    }
  }
  return transporterPromise;
}

/**
 * Verifies the SMTP connection/credentials without sending a message.
 * Used by the standalone verification script (scripts/verify-smtp.js) and
 * safe to call from a diagnostics tool — never exposed on a public route.
 */
async function verifyConnection() {
  const transporter = await getTransporter();
  await transporter.verify();
  return { ok: true, host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE, user: SMTP_USER, ethereal: usingEthereal };
}

// Nodemailer already refuses header values containing raw CR/LF, but
// stripping them here too means a malformed "name" or "email" can never
// even reach that check — defense in depth against header/email injection
// via the From/To/Reply-To fields.
function sanitizeHeaderValue(value) {
  return String(value == null ? '' : value).replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Sends one email. Never throws — the caller must never fail a request
 * just because email delivery had a hiccup. Returns
 * { success, error?, previewUrl? } so the caller can log/report as needed.
 */
async function sendMail({ to, subject, html, text, replyTo }) {
  try {
    if (!MAIL_FROM) {
      throw new Error('MAIL_FROM is not configured.');
    }
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: MAIL_FROM,
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
      console.log(`[email] (Ethereal preview) "${subject}" -> ${to}: ${previewUrl}`);
    }
    return result;
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err && err.message);
    return { success: false, error: err && err.message };
  }
}

module.exports = { sendMail, verifyConnection, MAIL_TO, MAIL_FROM, SMTP_HOST, SMTP_PORT };
