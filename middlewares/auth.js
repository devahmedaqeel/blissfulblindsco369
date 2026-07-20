const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Authentication Middleware
 * Checks for JWT Bearer token in Authorization header.
 */
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No authorization header provided.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Access denied. Invalid token format. Expected Bearer <token>.' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.admin = decoded; // Expose decoded payload to route handlers
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Access denied. Invalid token.' });
  }
}

module.exports = {
  authenticateAdmin
};
