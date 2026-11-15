// Service Worker for Bank Nusantara Background & Multi-Device Push Notifications
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const payload = event.data;
  if (!payload || typeof payload !== 'object') return;

  if (payload.type === 'SHOW_BANK_NOTIFICATION') {
    const title = payload.title || 'Bank Nusantara';
    const body = payload.body || 'Ada pembaruan baru di rekening Bank Nusantara Anda.';
    const tag = payload.tag || `bn-notif-${Date.now()}`;
    const targetView = payload.targetView || 'dashboard';
    const targetDashboardTab = payload.targetDashboardTab || 'mutasi';
    const category = payload.category || 'transaction';

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        tag,
        renotify: true,
        requireInteraction: false,
        data: {
          url: payload.url || `/?notifView=${encodeURIComponent(targetView)}&notifTab=${encodeURIComponent(targetDashboardTab)}`,
          targetView,
          targetDashboardTab,
          category,
        },
      })
    );
  }
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Bank Nusantara';
  const body = payload.body || payload.message || 'Notifikasi perbankan baru.';
  const targetView = payload.targetView || 'dashboard';
  const targetDashboardTab = payload.targetDashboardTab || 'mutasi';
  const category = payload.category || 'transaction';
  const tag = payload.tag || `bn-push-${category}-${Date.now()}`;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      renotify: true,
      data: {
        url: `/?notifView=${encodeURIComponent(targetView)}&notifTab=${encodeURIComponent(targetDashboardTab)}`,
        targetView,
        targetDashboardTab,
        category,
      },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};
  const targetView = notifData.targetView || 'dashboard';
  const targetDashboardTab = notifData.targetDashboardTab || 'mutasi';
  const category = notifData.category || 'transaction';
  const targetUrl =
    notifData.url ||
    `/?notifView=${encodeURIComponent(targetView)}&notifTab=${encodeURIComponent(targetDashboardTab)}`;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        try {
          client.postMessage({
            type: 'NAVIGATE_FROM_NOTIFICATION',
            targetView,
            targetDashboardTab,
            category,
          });
        } catch {
          // ignore
        }
        return client.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
