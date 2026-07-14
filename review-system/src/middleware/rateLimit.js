const rateLimit = require('express-rate-limit');
const config = require('../config');

const reviewSubmitLimiter = rateLimit({
  windowMs: config.reviewSubmitRateWindowMinutes * 60 * 1000,
  max: config.reviewSubmitRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many review submissions from this network. Please try again later.' }
});

const adminLoginLimiter = rateLimit({
  windowMs: config.adminLoginRateWindowMinutes * 60 * 1000,
  max: config.adminLoginRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' }
});

// Generous general limiter for read-only public endpoints, mainly to
// blunt scraping/abuse rather than to constrain normal browsing.
const publicReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});

const notifySubmitLimiter = rateLimit({
  windowMs: config.notifySubmitRateWindowMinutes * 60 * 1000,
  max: config.notifySubmitRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this network. Please try again later, or call us directly.' }
});

module.exports = { reviewSubmitLimiter, adminLoginLimiter, publicReadLimiter, notifySubmitLimiter };
