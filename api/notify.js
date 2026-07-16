// POST /api/notify — form-submission endpoint used by the booking form
// (all site pages) and the AI chatbot's lead-capture form. Sends an
// admin notification email and a customer confirmation email via
// Hostinger SMTP / Nodemailer. Runs as a Vercel Serverless Function on the
// same deployment as the static site, so no separate backend/CORS setup
// is needed — the frontend just calls this same-origin path.
const { validateLeadSubmission } = require('./_lib/validateLead');
const { sendMail, MAIL_TO } = require('./_lib/mailer');
const { adminNotificationEmail, customerConfirmationEmail } = require('./_lib/templates');

// Lightweight best-effort rate limiting. Serverless instances are
// ephemeral and this Map only persists for as long as a given instance
// stays warm, so this is defense-in-depth rather than a hard guarantee
// — genuine abuse protection should sit in front of this at the
// platform/WAF level. Still meaningfully slows down a script hammering
// this endpoint from one warm instance.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const hits = new Map();

function isRateLimited(key) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    hits.set(key, { windowStart: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.socket && req.socket.remoteAddress || 'unknown';
}

function formatSubmittedAt(date) {
  return date.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London'
  });
}

function parseBody(req) {
  // Vercel's Node.js runtime auto-parses JSON bodies into req.body when
  // Content-Type is application/json, but that only happens for
  // well-formed JSON — malformed JSON, a missing Content-Type header, or a
  // client that sends a raw string all leave req.body in a shape this
  // handler doesn't expect. Normalize defensively rather than letting a
  // bad request throw an uncaught exception.
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length) {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return req.body == null ? {} : null;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed.' });
    }

    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const body = parseBody(req);
    if (body === null) {
      return res.status(400).json({ error: 'Malformed request body.' });
    }

    const result = validateLeadSubmission(body);
    if (!result.valid) {
      if (result.errors._spam) {
        // Pretend success to the bot/spammer without sending any email.
        return res.status(201).json({ message: 'Thank you! We will be in touch shortly.' });
      }
      return res.status(400).json({ error: 'Validation failed.', fields: result.errors });
    }

    const { source, sourceLabel, name, email, phone, address, postcode, service, preferredColor, appointmentDate, appointmentTime, hearAboutUs, message } = result.data;
    const submittedAtDisplay = formatSubmittedAt(new Date());
    const appointment = [appointmentDate, appointmentTime].filter(Boolean).join(' ');

    const admin = adminNotificationEmail({
      source, sourceLabel, name, phone, email, address, postcode, service, preferredColor, appointment, hearAboutUs, message,
      submittedAt: submittedAtDisplay
    });
    const customer = customerConfirmationEmail({ name });

    const [adminResult, customerResult] = await Promise.all([
      sendMail({ to: MAIL_TO, subject: admin.subject, html: admin.html, text: admin.text, replyTo: email }),
      sendMail({ to: email, subject: customer.subject, html: customer.html, text: customer.text })
    ]);

    if (!adminResult.success) {
      // The admin email is the one that actually needs to reach a human —
      // if it failed, surface that as a real error so the frontend can
      // show its "please call us directly" fallback instead of claiming
      // success.
      return res.status(502).json({ error: 'Could not deliver notification email. Please call us directly.' });
    }

    return res.status(201).json({
      message: 'Thank you! Your request has been received and our team will be in touch shortly.',
      emailDelivered: adminResult.success && customerResult.success
    });
  } catch (err) {
    // Last-resort guard: sendMail/validateLeadSubmission never throw by
    // design, but a handler that can still crash on an unexpected input
    // shape would take down the whole function invocation instead of
    // returning a clean error to the browser.
    console.error('[notify] Unhandled error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please call us directly.' });
  }
};
