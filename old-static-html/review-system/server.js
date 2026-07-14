const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./src/config');
const { securityHeaders } = require('./src/middleware/security');
const publicReviewsRouter = require('./src/routes/publicReviews');
const adminAuthRouter = require('./src/routes/adminAuth');
const adminReviewsRouter = require('./src/routes/adminReviews');
const notifyRouter = require('./src/routes/notify');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // so req.ip is correct behind a reverse proxy/load balancer

app.use(securityHeaders);
app.use(express.json({ limit: '20kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// CORS is applied ONLY to the public reviews API, which genuinely needs to
// be called cross-origin from the separate static site domain. The admin
// API and admin panel are served by this same app, so browser calls to
// them are always same-origin and never subject to (or need) CORS — the
// browser itself still attaches an Origin header to same-origin POST
// requests, so applying a strict whitelist globally would incorrectly
// 403 the admin panel's own login/API calls.
const publicCors = cors({
  origin(origin, callback) {
    if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
});

app.use('/api/reviews', publicCors, publicReviewsRouter);
app.use('/api/notify', publicCors, notifyRouter);
app.use('/api/admin/auth', adminAuthRouter);
app.use('/api/admin/reviews', adminReviewsRouter);

// Admin panel static UI — served by this same process for a one-command
// deploy. The panel itself calls the /api/admin/* endpoints above using a
// Bearer token, so serving it statically here carries no extra privilege.
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Centralized error handler — never leak stack traces or internals to
// the client, only log them server-side.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(config.port, () => {
  console.log(`Review system API listening on port ${config.port} (${config.nodeEnv})`);
  console.log(`Admin panel: http://localhost:${config.port}/admin/`);
});
