const { createClient } = require('@supabase/supabase-js');

// Server-side only — uses the service_role key, which bypasses Row Level
// Security entirely. Never send this key to the browser; the public site
// and the admin dashboard's browser JS use the anon key instead, which
// is subject to the RLS policies in supabase/migration.sql.
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let client = null;
function getServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return client;
}

module.exports = { getServiceClient };
