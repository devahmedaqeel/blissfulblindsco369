const rateLimit = require('express-rate-limit');

// Rate limiter for submitting orders
// Limit to 5 order submissions per 15 minutes per IP
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, 
  message: {
    error: 'Too many order submissions from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate limiter for admin login attempts
// Limit to 5 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for generic API requests (security hardening)
// Limit to 100 requests per 5 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100,
  message: {
    error: 'Too many requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  orderLimiter,
  loginLimiter,
  apiLimiter
};
