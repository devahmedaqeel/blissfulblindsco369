const nodemailer = require('nodemailer');
const config = require('../config');

// Lazily-created, cached transporter. Using a cached promise (not just a
// cached value) means concurrent calls before the first one resolves all
// await the same in-flight setup instead of racing to create it twice.
let transporterPromise = null;
let usingEthereal = false;

function createRealTransport() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: config.emailUser,
      pass: config.emailPass
    }
  });
}

async function createEtherealTransport() {
  const testAccount = await nodemailer.createTestAccount();
  usingEthereal = true;
  console.warn(
    '[email] Using Ethereal test SMTP (no EMAIL_PASS configured). ' +
    'Preview links for each sent message will be logged below instead of ' +
    'real delivery.'
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
    transporterPromise = config.emailPass ? Promise.resolve(createRealTransport()) : createEtherealTransport();
  }
  return transporterPromise;
}

/**
 * Sends one email. Never throws — callers (form submission routes) must
 * never fail a request just because email delivery had a hiccup; the
 * customer's data is already saved by the time this is called. Returns
 * { success, error?, previewUrl? } so callers can log/report as needed.
 */
async function sendMail({ to, subject, html, text, replyTo }) {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"${config.emailFromName}" <${config.emailUser || 'no-reply@example.com'}>`,
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
      console.log(`[email] (Ethereal preview) "${subject}" → ${to}: ${previewUrl}`);
    }
    return result;
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendMail, getTransporter };
