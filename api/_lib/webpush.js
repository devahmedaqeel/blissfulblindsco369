const webpush = require('web-push');
const { getServiceClient } = require('./supabase');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:info@blissfulblindsltd.co.uk';

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

/**
 * Pushes a notification to every subscribed admin browser. Best-effort —
 * never throws, since a push failure must never affect whether the
 * enquiry itself was saved/emailed successfully. Subscriptions the push
 * service reports as gone (410/404 — the user closed the tab, cleared
 * site data, or uninstalled) are pruned automatically.
 */
async function pushToAdmins(payload) {
  if (!ensureConfigured()) {
    console.warn('[webpush] VAPID keys not configured — skipping push.');
    return { sent: 0, failed: 0 };
  }
  const supabase = getServiceClient();
  if (!supabase) return { sent: 0, failed: 0 };

  const { data: subs, error } = await supabase.from('push_subscriptions').select('*');
  if (error || !subs || !subs.length) return { sent: 0, failed: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  const stale = [];

  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body
      );
      sent++;
    } catch (err) {
      failed++;
      if (err && (err.statusCode === 410 || err.statusCode === 404)) {
        stale.push(sub.endpoint);
      } else {
        console.error('[webpush] Failed to deliver to', sub.endpoint, err && err.message);
      }
    }
  }));

  if (stale.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', stale);
  }

  return { sent, failed };
}

module.exports = { pushToAdmins, VAPID_PUBLIC_KEY };
