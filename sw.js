const CACHE = 'kazka-v5';
const BASE = self.registration.scope;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([
      BASE, BASE + 'index.html', BASE + 'app/', BASE + 'app/index.html',
      BASE + 'manifest.json', BASE + 'assets/icons/icon-192.png', BASE + 'assets/icons/icon-512.png'
    ])).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      const clone = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return r;
    }).catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {title: 'Kazka', body: 'Hai una nuova notifica'};
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: BASE + 'assets/icons/icon-192.png',
    badge: BASE + 'assets/icons/icon-192.png', tag: data.tag || 'kazka',
    data: data.url || BASE + 'app/'
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data || BASE + 'app/'));
});
