const express = require('express');
const crypto = require('crypto');
const db = require('../db/db');
const { validateReviewSubmission } = require('../utils/validate');
const { verifyTurnstile } = require('../utils/turnstile');
const { reviewSubmitLimiter, publicReadLimiter } = require('../middleware/rateLimit');
const { sendMail } = require('../services/email');
const { adminNotificationEmail } = require('../templates/adminNotification');
const { reviewConfirmationEmail } = require('../templates/reviewConfirmation');
const config = require('../config');

const router = express.Router();

function hashIp(ip) {
  // We never store a customer's raw IP address — only a one-way hash,
  // just enough to spot abusive submission patterns without retaining PII.
  return crypto.createHash('sha256').update(String(ip || '')).digest('hex');
}

// POST /api/reviews — customer submits a new review (goes in as "pending";
// nothing here is ever publicly visible until an admin approves it).
router.post('/', reviewSubmitLimiter, async (req, res) => {
  const result = validateReviewSubmission(req.body);

  if (!result.valid) {
    if (result.errors._spam) {
      // Honeypot tripped — pretend success so the bot doesn't learn
      // anything, but do not actually write to the database.
      return res.status(201).json({ message: 'Thank you for your review!' });
    }
    return res.status(400).json({ error: 'Validation failed.', fields: result.errors });
  }

  const turnstileResult = await verifyTurnstile(req.body.turnstileToken, req.ip);
  if (!turnstileResult.success) {
    return res.status(400).json({ error: 'Bot verification failed. Please try again.' });
  }

  const id = db.insertReview({
    name: result.data.name,
    email: result.data.email,
    rating: result.data.rating,
    review: result.data.review,
    avatarUrl: null,
    ipHash: hashIp(req.ip)
  });

  // Email is best-effort and happens after the review is already saved —
  // an SMTP hiccup must never affect whether the review itself was
  // recorded (it still shows up in the admin panel for moderation either way).
  const admin = adminNotificationEmail({
    sourceLabel: 'Review Submission',
    name: result.data.name,
    email: result.data.email,
    service: `${result.data.rating}-star review`,
    message: result.data.review,
    submittedAt: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/London' }),
    ip: req.ip
  });
  const customer = reviewConfirmationEmail({ name: result.data.name, rating: result.data.rating });

  Promise.all([
    sendMail({ to: config.mailTo, subject: admin.subject, html: admin.html, text: admin.text, replyTo: result.data.email }),
    sendMail({ to: result.data.email, subject: customer.subject, html: customer.html, text: customer.text })
  ]).catch((err) => console.error('[reviews] Unexpected email error:', err.message));

  return res.status(201).json({
    message: "Thank you! Your review has been submitted and is awaiting approval.",
    id
  });
});

// GET /api/reviews — public list of approved reviews + live stats.
// ?rating=1-5  filter to one star rating
// ?featured=1  only featured reviews
// ?page=1&limit=12  pagination
router.get('/', publicReadLimiter, (req, res) => {
  const rating = req.query.rating ? Number(req.query.rating) : null;
  const featuredOnly = req.query.featured === '1' || req.query.featured === 'true';
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const offset = (page - 1) * limit;

  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5.' });
  }

  const reviews = db.getApprovedReviews({ limit, offset, minRating: rating, featuredOnly });
  const total = db.countApproved({ minRating: rating });
  const stats = db.getStats();

  return res.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      review: r.review,
      date: r.submitted_at,
      featured: !!r.featured
    })),
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    stats
  });
});

module.exports = router;
