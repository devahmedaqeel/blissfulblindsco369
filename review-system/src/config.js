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

  smtpHost: process.env.SMTP_HOST || 'smtp.hostinger.com',
  smtpPort: int('SMTP_PORT', 465),
  smtpSecure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE !== 'false' : true,
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  mailFrom: process.env.MAIL_FROM || (process.env.SMTP_USER ? `Blissful Blinds Ltd <${process.env.SMTP_USER}>` : 'Blissful Blinds Ltd <no-reply@blissfulblindsltd.co.uk>'),
  mailTo: process.env.MAIL_TO || process.env.SMTP_USER || 'info@blissfulblindsltd.co.uk'
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

if (config.isProduction && (!config.smtpUser || !config.smtpPass)) {
  throw new Error('SMTP_USER and SMTP_PASS must be set (Hostinger SMTP credentials) in production. See .env.example.');
}

if (!config.smtpPass) {
  // eslint-disable-next-line no-console
  console.warn(
    '\n⚠️  WARNING: SMTP_PASS is not set (Hostinger mailbox password). Emails will be sent ' +
    'through a temporary Ethereal test inbox instead of real Hostinger SMTP — fine for ' +
    'development, but no real email will reach anyone. Set SMTP_USER/SMTP_PASS before deploying.\n'
  );
}

module.exports = config;
