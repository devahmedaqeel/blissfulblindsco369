const config = require('../config');

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verifies a Cloudflare Turnstile token server-side. This MUST happen on
 * the server — a client can always fake having "passed" a client-side
 * widget, so trusting only the frontend would make the CAPTCHA decorative.
 *
 * If no secret key is configured (local/dev), verification is skipped and
 * a loud warning is logged — see config.js for the production guard.
 */
async function verifyTurnstile(token, remoteIp) {
  if (!config.turnstileSecretKey) {
    console.warn('[turnstile] TURNSTILE_SECRET_KEY not set — skipping bot verification (dev mode only).');
    return { success: true, skipped: true };
  }

  if (!token) {
    return { success: false, error: 'missing-token' };
  }

  try {
    const params = new URLSearchParams();
    params.set('secret', config.turnstileSecretKey);
    params.set('response', token);
    if (remoteIp) params.set('remoteip', remoteIp);

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const json = await res.json();
    return { success: !!json.success, raw: json };
  } catch (err) {
    console.error('[turnstile] verification request failed:', err.message);
    return { success: false, error: 'verification-request-failed' };
  }
}

module.exports = { verifyTurnstile };
