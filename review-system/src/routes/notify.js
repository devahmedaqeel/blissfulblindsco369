const express = require('express');
const crypto = require('crypto');
const db = require('../db/db');
const { validateLeadSubmission } = require('../utils/validateLead');
const { notifySubmitLimiter } = require('../middleware/rateLimit');
const { sendMail } = require('../services/email');
const { adminNotificationEmail } = require('../templates/adminNotification');
const { customerConfirmationEmail } = require('../templates/customerConfirmation');
const config = require('../config');

const router = express.Router();

function hashIp(ip) {
  return crypto.createHash('sha256').update(String(ip || '')).digest('hex');
}

function formatSubmittedAt(date) {
  return date.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London'
  });
}

// POST /api/notify — generic form-submission endpoint used by the
// booking form (all 9 pages) and the AI chatbot's lead-capture form.
// Always: (1) saves the lead to the database first, so a submission is
// never lost even if email delivery has a problem, then (2) sends an
// admin notification and a customer confirmation email.
router.post('/', notifySubmitLimiter, async (req, res) => {
  const result = validateLeadSubmission(req.body);

  if (!result.valid) {
    if (result.errors._spam) {
      return res.status(201).json({ message: 'Thank you! We will be in touch shortly.' });
    }
    return res.status(400).json({ error: 'Validation failed.', fields: result.errors });
  }

  const { source, sourceLabel, name, email, phone, postcode, service, appointmentDate, appointmentTime, message } = result.data;
  const now = new Date();
  const submittedAtDisplay = formatSubmittedAt(now);
  const appointment = [appointmentDate, appointmentTime].filter(Boolean).join(' ');

  let leadId;
  try {
    leadId = db.insertLead({
      source,
      name,
      email,
      phone,
      postcode,
      service,
      appointmentDate,
      appointmentTime,
      message,
      ipHash: hashIp(req.ip)
    });
  } catch (err) {
    console.error('[notify] Failed to save lead to database:', err.message);
    return res.status(500).json({ error: 'Something went wrong saving your request. Please call us directly.' });
  }

  // Data is safely saved at this point. Email delivery below is
  // best-effort — a Gmail/SMTP hiccup must never turn into a 500 for a
  // customer whose enquiry was already recorded.
  const admin = adminNotificationEmail({
    sourceLabel,
    name,
    phone,
    email,
    postcode,
    service,
    appointment,
    message,
    submittedAt: submittedAtDisplay,
    ip: req.ip
  });

  const customer = customerConfirmationEmail({ name });

  const [adminResult, customerResult] = await Promise.all([
    sendMail({ to: config.mailTo, subject: admin.subject, html: admin.html, text: admin.text, replyTo: email }),
    sendMail({ to: email, subject: customer.subject, html: customer.html, text: customer.text })
  ]);

  db.markLeadEmailStatus(leadId, {
    adminEmailSent: adminResult.success,
    customerEmailSent: customerResult.success
  });

  return res.status(201).json({
    message: 'Thank you! Your request has been received and our team will be in touch shortly.',
    id: leadId,
    emailDelivered: adminResult.success && customerResult.success
  });
});

module.exports = router;
