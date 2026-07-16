require('dotenv').config();

function int(name, fallback) {
  const v = parseInt(process.env[name], 10);
  return Number.isFinite(v) ? v : fallback;
}

const config = {
  port: int('PORT', 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '',
  reviewSubmitRateLimit: int('REVIEW_SUBMIT_RATE_LIMIT', 5),
  reviewSubmitRateWindowMinutes: int('REVIEW_SUBMIT_RATE_WINDOW_MINUTES', 15),
  adminLoginRateLimit: int('ADMIN_LOGIN_RATE_LIMIT', 10),
  adminLoginRateWindowMinutes: int('ADMIN_LOGIN_RATE_WINDOW_MINUTES', 15),
  notifySubmitRateLimit: int('NOTIFY_SUBMIT_RATE_LIMIT', 5),
  notifySubmitRateWindowMinutes: int('NOTIFY_SUBMIT_RATE_WINDOW_MINUTES', 15),

  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
  emailAdminTo: process.env.EMAIL_ADMIN_TO || process.env.EMAIL_USER || '',
  emailFromName: process.env.EMAIL_FROM_NAME || 'Blissful Blinds'
};

if (config.isProduction && (!config.jwtSecret || config.jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET must be set to a long random string in production. See .env.example.');
}

if (config.isProduction && !config.turnstileSecretKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '\n⚠️  WARNING: TURNSTILE_SECRET_KEY is not set. Review submissions will be ' +
    'accepted WITHOUT bot verification. Set it before relying on this in production.\n'
  );
}

if (!config.emailPass) {
  // eslint-disable-next-line no-console
  console.warn(
    '\n⚠️  WARNING: EMAIL_PASS is not set (Gmail App Password). Emails will be sent ' +
    'through a temporary Ethereal test inbox instead of real Gmail — fine for ' +
    'development, but no real email will reach anyone. Set EMAIL_PASS before deploying.\n'
  );
}

module.exports = config;
