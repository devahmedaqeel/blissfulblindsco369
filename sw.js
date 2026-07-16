// Service worker for the admin dashboard's Web Push notifications.
// Lives at the site root (not /admin/sw.js) so its scope covers /admin/
// with room to spare — a service worker's scope can never be wider than
// the directory it's served from. It does nothing for regular site
// visitors; only the admin dashboard registers it.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = { title: 'New enquiry', body: 'A new enquiry was submitted.', url: '/admin/' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Non-JSON push payload — fall back to the default text above.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/images/logo-dark.png',
      badge: '/images/logo-dark.png',
      tag: payload.enquiryId ? `enquiry-${payload.enquiryId}` : 'enquiry',
      renotify: true,
      data: { url: payload.url || '/admin/' }
    })
  );
});

// Clicking the notification focuses an already-open dashboard tab if
// one exists, instead of always opening a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/admin/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/admin/') && 'focus' in client) {
          client.postMessage({ type: 'notification-click', url: targetUrl });
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
