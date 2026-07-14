const { verifyAdminToken } = require('../utils/jwt');

/**
 * Requires a valid admin Bearer token. Using an Authorization header
 * (rather than a cookie) means the browser never auto-attaches credentials
 * to cross-site requests, which sidesteps CSRF for the admin API entirely
 * — there is no ambient authority to forge.
 */
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }

  try {
    req.admin = verifyAdminToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

module.exports = { requireAdmin };
