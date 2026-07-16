#!/usr/bin/env node
// Exercises the Supabase-persistence + push-notification path added for
// the real-time admin dashboard, without needing real Supabase/VAPID
// credentials:
//   - "not configured" path (no env vars) — already covered by
//     scripts/test-email-flows.js, since /api/notify calls recordEnquiry
//     as part of every submission.
//   - "configured but unreachable" path — points SUPABASE_URL at a bogus
//     host so the insert genuinely round-trips through the real
//     @supabase/supabase-js client and fails at the network layer,
//     proving recordEnquiry/pushToAdmins swallow that failure instead of
//     throwing (which would otherwise take the whole /api/notify request
//     down even though the email already sent successfully).
//
//   node scripts/test-realtime-flow.js

process.env.SUPABASE_URL = 'https://this-project-does-not-exist.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'not-a-real-key';
process.env.VAPID_PUBLIC_KEY = '';
process.env.VAPID_PRIVATE_KEY = '';

let pass = 0;
let fail = 0;
function ok(label, cond, detail) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`); }
}

async function run() {
  const { recordEnquiry } = require('../api/_lib/enquiry');

  console.log('\n[1] recordEnquiry against an unreachable Supabase host\n');
  const start = Date.now();
  let threw = false;
  let id = 'not-set';
  try {
    id = await recordEnquiry({
      source: 'booking', sourceLabel: 'Booking Request', name: 'Network Failure Test',
      email: 'test@example.com', phone: '01733853037', pageUrl: 'https://blissfulblindsltd.co.uk/roller-blinds/'
    });
  } catch (err) {
    threw = true;
  }
  const elapsed = Date.now() - start;

  ok('does not throw when Supabase is unreachable', !threw);
  ok('resolves to null (nothing persisted) rather than a fake id', id === null);
  ok('fails fast rather than hanging (< 15s)', elapsed < 15000, `took ${elapsed}ms`);

  console.log('\n[2] Config endpoint shape\n');
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon-key-placeholder';
  delete require.cache[require.resolve('../api/config')];
  delete require.cache[require.resolve('../api/_lib/webpush')];
  const configHandler = require('../api/config');

  const req = { method: 'GET' };
  const res = {
    statusCode: null, jsonBody: null, headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.jsonBody = b; return this; }
  };
  await configHandler(req, res);
  ok('GET /api/config -> 200', res.statusCode === 200);
  ok('exposes supabaseUrl', res.jsonBody.supabaseUrl === 'https://example.supabase.co');
  ok('exposes supabaseAnonKey', res.jsonBody.supabaseAnonKey === 'anon-key-placeholder');
  ok('does NOT expose service role key anywhere in the response', JSON.stringify(res.jsonBody).indexOf('not-a-real-key') === -1);
  ok('vapidPublicKey is null when unconfigured', res.jsonBody.vapidPublicKey === null);

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error('\n[test-realtime-flow] Uncaught error:', err);
  process.exit(1);
});
