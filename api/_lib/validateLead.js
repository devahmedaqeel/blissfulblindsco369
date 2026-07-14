// Server-side validation + sanitization for booking/chatbot-lead form
// submissions handled by POST /api/notify. Never trust the client —
// the frontend also validates, but a server must re-check everything.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[\p{L}\p{M} .'-]+$/u;
// Digits, spaces, +, -, (), 7-20 chars total — permissive enough for
// international formats without accepting arbitrary junk.
const PHONE_RE = /^[+\d][\d\s()-]{6,19}$/;

const KNOWN_SOURCES = {
  booking: 'Booking Request',
  'chatbot-lead': 'Chatbot Lead'
};

function stripTags(str) {
  return String(str).replace(/<[^>]*>/g, '');
}

function collapseWhitespace(str) {
  return String(str).replace(/\s+/g, ' ').trim();
}

function validateLeadSubmission(body) {
  const errors = {};
  body = body || {};

  // Honeypot — a hidden field real users never fill in.
  if (body.website) {
    return { valid: false, errors: { _spam: true } };
  }

  const sourceKey = String(body.source || '').trim();
  if (!KNOWN_SOURCES[sourceKey]) {
    errors.source = 'Unknown submission source.';
  }

  const name = collapseWhitespace(stripTags(body.name || ''));
  if (!name) errors.name = 'Name is required.';
  else if (name.length < 2 || name.length > 80) errors.name = 'Name must be between 2 and 80 characters.';
  else if (!NAME_RE.test(name)) errors.name = 'Name contains characters that are not allowed.';

  const email = String(body.email || '').trim();
  if (!email) errors.email = 'Email is required.';
  else if (email.length > 254 || !EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';

  const phone = collapseWhitespace(stripTags(body.phone || ''));
  if (!phone) errors.phone = 'Phone number is required.';
  else if (!PHONE_RE.test(phone)) errors.phone = 'Please enter a valid phone number.';

  const address = collapseWhitespace(stripTags(body.address || '')).slice(0, 200);
  const postcode = collapseWhitespace(stripTags(body.postcode || '')).slice(0, 20);
  const service = collapseWhitespace(stripTags(body.service || '')).slice(0, 100);
  const preferredColor = collapseWhitespace(stripTags(body.preferredColor || '')).slice(0, 100);
  const appointmentDate = collapseWhitespace(stripTags(body.appointmentDate || '')).slice(0, 60);
  const appointmentTime = collapseWhitespace(stripTags(body.appointmentTime || '')).slice(0, 60);
  const hearAboutUs = collapseWhitespace(stripTags(body.hearAboutUs || '')).slice(0, 60);

  const message = collapseWhitespace(stripTags(body.message || ''));
  if (message.length > 2000) {
    errors.message = 'Message must be under 2000 characters.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      source: sourceKey,
      sourceLabel: KNOWN_SOURCES[sourceKey],
      name, email, phone, address, postcode, service, preferredColor, appointmentDate, appointmentTime, hearAboutUs, message
    }
  };
}

module.exports = { validateLeadSubmission };
