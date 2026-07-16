#!/usr/bin/env node
// Confirms the configured SMTP credentials actually authenticate against
// Hostinger, without sending a real email. Run locally with the real
// SMTP_USER/SMTP_PASS set (e.g. via `.env.local` + `vercel env pull`, or
// exported in the shell), or as a one-off `vercel dev` / Vercel CLI
// command against the deployed environment variables:
//
//   node scripts/verify-smtp.js
//
// Exits 0 and prints the connection details on success, exits 1 with the
// SMTP server's real error message on failure (bad credentials, wrong
// host/port, network block, etc.) — that message is exactly what a human
// needs to fix the Hostinger mailbox/Vercel env var configuration.

const path = require('path');

// Best-effort local .env loading (no dependency needed) so this works
// the same way whether run against `.env.local` or real shell env vars.
function loadDotEnvIfPresent(file) {
  try {
    const fs = require('fs');
    const full = path.join(__dirname, '..', file);
    if (!fs.existsSync(full)) return;
    const lines = fs.readFileSync(full, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const key = match[1];
      let value = match[2];
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // Non-fatal — real env vars (Vercel, CI, shell export) still work.
  }
}

loadDotEnvIfPresent('.env.local');
loadDotEnvIfPresent('.env');

const { verifyConnection } = require('../api/_lib/mailer');

(async () => {
  console.log('[verify-smtp] Checking SMTP_HOST/SMTP_USER/SMTP_PASS...');
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error(
      '[verify-smtp] SMTP_USER and/or SMTP_PASS are not set in the environment.\n' +
      'Set them (see .env.example) before running this script — otherwise there is\n' +
      'nothing real to verify.'
    );
    process.exit(1);
  }

  try {
    const result = await verifyConnection();
    if (result.ethereal) {
      console.error('[verify-smtp] Connected, but to Ethereal (test) SMTP, not Hostinger — SMTP_PASS was not picked up correctly.');
      process.exit(1);
    }
    console.log('[verify-smtp] SUCCESS — authenticated with Hostinger SMTP.');
    console.log(`  host:   ${result.host}`);
    console.log(`  port:   ${result.port}`);
    console.log(`  secure: ${result.secure}`);
    console.log(`  user:   ${result.user}`);
    process.exit(0);
  } catch (err) {
    console.error('[verify-smtp] FAILED to authenticate/connect:');
    console.error(`  ${err.message}`);
    process.exit(1);
  }
})();
