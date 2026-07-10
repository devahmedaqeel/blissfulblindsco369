const jwt = require('jsonwebtoken');
const config = require('../config');

function signAdminToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function verifyAdminToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = { signAdminToken, verifyAdminToken };
