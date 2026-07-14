const nodemailer = require('nodemailer');

// Lazily-created, cached transporter. Using a cached promise (not just a
// cached value) means concurrent calls before the first one resolves all
// await the same in-flight setup instead of racing to create it twice.
// Serverless functions can reuse a "warm" instance between invocations,
// so caching at module scope also saves reconnecting on every request.
let transporterPromise = null;
let usingEthereal = false;

const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_ADMIN_TO = process.env.EMAIL_ADMIN_TO || EMAIL_USER;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Blissful Blinds Co';

function createRealTransport() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
  });
}

async function createEtherealTransport() {
  const testAccount = await nodemailer.createTestAccount();
  usingEthereal = true;
  console.warn(
    '[email] Using Ethereal test SMTP (no EMAIL_PASS configured). ' +
    'Preview links for each sent message will be logged below instead of real delivery.'
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
    transporterPromise = EMAIL_PASS ? Promise.resolve(createRealTransport()) : createEtherealTransport();
  }
  return transporterPromise;
}

/**
 * Sends one email. Never throws — the caller must never fail a request
 * just because email delivery had a hiccup. Returns
 * { success, error?, previewUrl? } so the caller can log/report as needed.
 */
async function sendMail({ to, subject, html, text, replyTo }) {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER || 'no-reply@example.com'}>`,
      to,
      subject,
      html,
      text,
      replyTo
    });

    const result = { success: true, messageId: info.messageId };
    if (usingEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      result.previewUrl = previewUrl;
      console.log(`[email] (Ethereal preview) "${subject}" -> ${to}: ${previewUrl}`);
    }
    return result;
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendMail, EMAIL_ADMIN_TO };
