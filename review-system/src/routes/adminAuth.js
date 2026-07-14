const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/db');
const { signAdminToken } = require('../utils/jwt');
const { adminLoginLimiter } = require('../middleware/rateLimit');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/login', adminLoginLimiter, (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const admin = db.getAdminByUsername(String(username).trim());

  // Always run bcrypt.compare (against a dummy hash if no user was found)
  // so the response time doesn't leak whether the username exists.
  const hashToCheck = admin ? admin.password_hash : '$2a$12$invalidsaltinvalidsaltinvalidsalO';
  const ok = bcrypt.compareSync(String(password), hashToCheck);

  if (!admin || !ok) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = signAdminToken({ sub: admin.id, username: admin.username });
  return res.json({ token, username: admin.username });
});

// Lets the admin panel verify a stored token is still valid on page load.
router.get('/me', requireAdmin, (req, res) => {
  res.json({ username: req.admin.username });
});

module.exports = router;
