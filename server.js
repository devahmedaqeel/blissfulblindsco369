const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const connectDB = require('./config/db');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { apiLimiter } = require('./middlewares/rateLimit');

// Initialize database connection
connectDB();

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
// Allow WebSockets and fallbacks locally and in staging
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Cache Socket.IO instance on app to use inside controllers
app.set('io', io);

// Basic Security Hardening & CORS
app.disable('x-powered-by');
app.set('trust proxy', 1); // Respect proxy headers (like Vercel/Cloudflare)
app.use(cors());
app.use(express.json({ limit: '20kb' })); // Restrict payload size for DDoS protection

// Register Rate Limit Middleware globally on APIs
app.use('/api/', apiLimiter);

// Register Route Handlers
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ ok: true, env: config.nodeEnv });
});

// --- SERVE STATIC FRONTEND SITE ---
// Serves homepage and subpages directly from root directory
app.use(express.static(path.join(__dirname, '.'), {
  extensions: ['html', 'htm'], // allow clean URLs (e.g. /order resolves to /order/index.html)
  index: 'index.html'
}));

// Fallback path routing for single-page style or error page
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'), (err) => {
    if (err) res.status(404).json({ error: 'Page not found.' });
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  return res.status(500).json({ error: 'Internal server error.' });
});

// --- SOCKET.IO REALTIME EVENTS ---
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Admin client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Listen on configured port only when executed directly (local/VPS hosting)
if (require.main === module) {
  server.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`Blissful Blinds Server listening on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Order Form: http://localhost:${config.port}/order/`);
    console.log(`Admin Dashboard: http://localhost:${config.port}/admin/orders/`);
    console.log(`====================================================`);
  });
}

module.exports = app;
