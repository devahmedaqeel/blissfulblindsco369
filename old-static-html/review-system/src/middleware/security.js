const config = require('../config');

/**
 * Hand-rolled security headers (equivalent to what a package like helmet
 * would set) — kept dependency-free on purpose. Applied to every response.
 */
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self' https://challenges.cloudflare.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "frame-src https://challenges.cloudflare.com; " +
      "connect-src 'self'; " +
      "img-src 'self' data:; " +
      "base-uri 'none'; " +
      "form-action 'self'"
  );
  if (config.isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  }
  next();
}

module.exports = { securityHeaders };
