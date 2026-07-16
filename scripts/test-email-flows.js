#!/usr/bin/env node
// End-to-end smoke test for the /api/notify email pipeline, runnable
// without real Hostinger credentials (uses Nodemailer's Ethereal test
// SMTP fallback — see api/_lib/mailer.js). Exercises the exact handler
// code Vercel invokes in production, via mocked req/res objects, so this
// is a real functional test of validation, spam handling, rate limiting,
// and email rendering/sending — not just a syntax check.
//
//   node scripts/test-email-flows.js

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
// Force the Ethereal fallback path regardless of any real creds present
// in the environment, so this script never sends real email and never
// requires real secrets to run.
delete process.env.SMTP_PASS;
delete process.env.VERCEL_ENV;

const assert = require('assert');
const { validateLeadSubmission } = require('../api/_lib/validateLead');
const { sendMail } = require('../api/_lib/mailer');
const { adminNotificationEmail, customerConfirmationEmail } = require('../api/_lib/templates');
const notifyHandler = require('../api/notify');

let pass = 0;
let fail = 0;

function ok(label, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function mockReq({ method = 'POST', body = {}, headers = {}, ip = '203.0.113.1' } = {}) {
  return {
    method,
    body,
    headers: { 'x-forwarded-for': ip, ...headers },
    socket: { remoteAddress: ip }
  };
}

function mockRes() {
  const res = {
    statusCode: null,
    jsonBody: null,
    headers: {},
    setHeader(k, v) { res.headers[k] = v; },
    status(code) { res.statusCode = code; return res; },
    json(body) { res.jsonBody = body; return res; }
  };
  return res;
}

async function run() {
  console.log('\n[1] validateLeadSubmission — field validation\n');

  const validBooking = validateLeadSubmission({
    source: 'booking',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+44 7911 123456',
    address: '1 Test Street',
    postcode: 'PE3 9SR',
    service: 'Roller Blinds',
    appointmentTime: 'Afternoon',
    hearAboutUs: 'Google',
    message: 'Interested in a quote for 3 windows.',
    renderedAt: Date.now() - 5000
  });
  ok('accepts a fully valid booking submission', validBooking.valid, JSON.stringify(validBooking.errors));

  const missingName = validateLeadSubmission({ source: 'booking', email: 'a@b.com', phone: '01733853037' });
  ok('rejects submission missing name', !missingName.valid && !!missingName.errors.name);

  const badEmail = validateLeadSubmission({ source: 'booking', name: 'Jane', email: 'not-an-email', phone: '01733853037' });
  ok('rejects invalid email address', !badEmail.valid && !!badEmail.errors.email);

  const badPhone = validateLeadSubmission({ source: 'booking', name: 'Jane', email: 'a@b.com', phone: 'abc' });
  ok('rejects invalid phone number', !badPhone.valid && !!badPhone.errors.phone);

  const unknownSource = validateLeadSubmission({ source: 'not-a-real-source', name: 'Jane', email: 'a@b.com', phone: '01733853037' });
  ok('rejects unknown submission source', !unknownSource.valid && !!unknownSource.errors.source);

  const xssName = validateLeadSubmission({
    source: 'booking', name: '<script>alert(1)</script>Jane', email: 'a@b.com', phone: '01733853037'
  });
  ok('strips HTML tags from name (XSS sanitization)', !xssName.valid, 'expect name-charset rejection after tag-stripping');

  console.log('\n[2] Spam prevention\n');

  const honeypot = validateLeadSubmission({ source: 'booking', name: 'Bot', email: 'a@b.com', phone: '01733853037', website: 'http://spam.example' });
  ok('honeypot field triggers silent spam rejection', !honeypot.valid && honeypot.errors._spam === true);

  const tooFast = validateLeadSubmission({
    source: 'booking', name: 'Jane', email: 'a@b.com', phone: '01733853037', renderedAt: Date.now()
  });
  ok('instant submission (0ms fill time) flagged as spam', !tooFast.valid && tooFast.errors._spam === true);

  const linkSpam = validateLeadSubmission({
    source: 'booking', name: 'Jane', email: 'a@b.com', phone: '01733853037',
    message: 'Check http://spam1.example and http://spam2.example and https://spam3.example'
  });
  ok('message with 2+ links flagged as spam', !linkSpam.valid && linkSpam.errors._spam === true);

  console.log('\n[3] Email templates render valid HTML\n');

  const admin = adminNotificationEmail({
    source: 'booking', sourceLabel: 'Booking Request', name: 'Jane Doe', phone: '01733853037',
    email: 'jane@example.com', address: '1 Test St', postcode: 'PE3 9SR', service: 'Roller Blinds',
    preferredColor: 'White', appointment: 'Afternoon', hearAboutUs: 'Google',
    message: 'Quote please', submittedAt: new Date().toLocaleString('en-GB')
  });
  ok('admin template includes customer name', admin.html.includes('Jane Doe'));
  ok('admin template subject set', typeof admin.subject === 'string' && admin.subject.length > 0);
  ok('admin template uses correct domain', admin.html.includes('blissfulblindsltd.co.uk'));
  ok('admin template does not reference old gmail address', !admin.html.includes('gmail.com'));

  const customer = customerConfirmationEmail({ name: 'Jane Doe' });
  ok('customer template greets by name', customer.html.includes('Jane'));
  ok('customer template uses correct domain', customer.html.includes('blissfulblindsltd.co.uk'));

  console.log('\n[4] Mailer — sendMail over Ethereal fallback (no real Hostinger creds required)\n');

  const sendResult = await sendMail({ to: 'test-recipient@example.com', subject: admin.subject, html: admin.html, text: admin.text, replyTo: 'jane@example.com' });
  ok('sendMail succeeds against Ethereal fallback', sendResult.success === true, sendResult.error);
  ok('sendMail returns a preview URL when using Ethereal', typeof sendResult.previewUrl === 'string' && sendResult.previewUrl.startsWith('https://'));
  if (sendResult.previewUrl) console.log(`    preview: ${sendResult.previewUrl}`);

  console.log('\n[5] POST /api/notify handler — full request/response cycle\n');

  // 5a. Valid booking submission -> 201, emailDelivered true
  {
    const req = mockReq({
      body: {
        source: 'booking', name: 'John Smith', email: 'john.smith@example.com', phone: '01733853037',
        address: '10 Example Rd', postcode: 'PE3 9SR', service: 'Vertical Blinds', preferredColor: 'Grey',
        appointmentTime: 'Morning', hearAboutUs: 'Facebook', message: 'Please call after 5pm.',
        renderedAt: Date.now() - 4000
      }
    });
    const res = mockRes();
    await notifyHandler(req, res);
    ok('valid booking -> HTTP 201', res.statusCode === 201, `got ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`);
    ok('valid booking -> emailDelivered true', res.jsonBody && res.jsonBody.emailDelivered === true);
  }

  // 5b. Valid chatbot-lead submission -> 201
  {
    const req = mockReq({
      ip: '203.0.113.2',
      body: {
        source: 'chatbot-lead', name: 'Amy Chatbot', email: 'amy@example.com', phone: '07911123456',
        postcode: 'LE1 1AA', appointmentDate: '2026-08-01', appointmentTime: 'Evening',
        message: 'Quote via chatbot', renderedAt: Date.now() - 3000
      }
    });
    const res = mockRes();
    await notifyHandler(req, res);
    ok('valid chatbot-lead -> HTTP 201', res.statusCode === 201, `got ${res.statusCode}: ${JSON.stringify(res.jsonBody)}`);
  }

  // 5c. Invalid method -> 405
  {
    const req = mockReq({ method: 'GET', ip: '203.0.113.3' });
    const res = mockRes();
    await notifyHandler(req, res);
    ok('GET request -> HTTP 405', res.statusCode === 405);
    ok('405 response sets Allow header', res.headers.Allow === 'POST');
  }

  // 5d. Missing required fields -> 400
  {
    const req = mockReq({ ip: '203.0.113.4', body: { source: 'booking', name: 'X' } });
    const res = mockRes();
    await notifyHandler(req, res);
    ok('incomplete submission -> HTTP 400', res.statusCode === 400);
    ok('400 response includes field errors', res.jsonBody && typeof res.jsonBody.fields === 'object');
  }

  // 5e. Malformed JSON string body -> 400, no crash
  {
    const req = mockReq({ ip: '203.0.113.5', body: '{not valid json' });
    const res = mockRes();
    await notifyHandler(req, res);
    ok('malformed JSON body -> HTTP 400 (no uncaught exception)', res.statusCode === 400);
  }

  // 5f. Honeypot-filled submission -> 201 (pretend success), no crash
  {
    const req = mockReq({
      ip: '203.0.113.6',
      body: { source: 'booking', name: 'Bot', email: 'a@b.com', phone: '01733853037', website: 'filled-by-bot' }
    });
    const res = mockRes();
    await notifyHandler(req, res);
    ok('honeypot submission -> HTTP 201 (silently ignored)', res.statusCode === 201);
  }

  // 5g. Rate limiting — 6th request within the window from the same IP -> 429
  {
    const ip = '203.0.113.7';
    let lastRes;
    for (let i = 0; i < 6; i++) {
      const req = mockReq({
        ip,
        body: {
          source: 'booking', name: 'Rate Test', email: 'rate@example.com', phone: '01733853037',
          renderedAt: Date.now() - 4000
        }
      });
      lastRes = mockRes();
      await notifyHandler(req, lastRes);
    }
    ok('6th request from same IP within 15 min -> HTTP 429', lastRes.statusCode === 429, `got ${lastRes.statusCode}`);
  }

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error('\n[test-email-flows] Uncaught error while running tests:', err);
  process.exit(1);
});
