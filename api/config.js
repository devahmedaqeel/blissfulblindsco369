// GET /api/config — exposes the admin dashboard's public (non-secret)
// configuration. There's no build step on this static site to inject
// server env vars into client JS, so the dashboard fetches this once on
// load instead.
//
// Everything returned here is safe to expose: the Supabase anon key is
// designed to be public and is only as powerful as the Row Level
// Security policies in supabase/migration.sql allow (an unauthenticated
// or non-admin caller can do nothing with it); the VAPID public key is
// public by design (it's how a browser proves which server may push to
// it, not a secret the server must protect).
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const { VAPID_PUBLIC_KEY } = require('./_lib/webpush');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).json({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    vapidPublicKey: VAPID_PUBLIC_KEY || null
  });
};
