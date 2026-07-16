const { getServiceClient } = require('./supabase');

const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 15 * 60;

// In-memory first line of defense — instant, no network round trip, and
// still meaningfully slows down a script hammering one warm serverless
// instance. Resets on cold start, which is exactly what the Supabase
// check below exists to cover.
const hits = new Map();

function isRateLimitedInMemory(ip) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_SECONDS * 1000) {
    hits.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

/**
 * Authoritative rate-limit check, persisted in Postgres so it holds even
 * across cold starts and multiple concurrent serverless instances — the
 * in-memory Map alone can't do that. Fails open (never blocks a real
 * request) if Supabase isn't configured or the RPC call errors, since a
 * broken rate limiter must never become a way to take the contact form
 * offline.
 */
async function isRateLimited(ip) {
  if (isRateLimitedInMemory(ip)) return true;

  const supabase = getServiceClient();
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_ip: ip,
      p_window_seconds: RATE_WINDOW_SECONDS,
      p_max_count: RATE_LIMIT
    });
    if (error) {
      console.error('[rateLimit] Supabase check failed, failing open:', error.message);
      return false;
    }
    return !!data;
  } catch (err) {
    console.error('[rateLimit] Unexpected error, failing open:', err.message);
    return false;
  }
}

module.exports = { isRateLimited };
