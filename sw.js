// ╔══════════════════════════════════════════════════════════════╗
// ║  KAZKA v4 — Service Worker                                   ║
// ║  Cache versioning + Push notifications + Offline support     ║
// ╚══════════════════════════════════════════════════════════════╝

const CACHE_VER  = 'kazka-v4.0.2';
const CACHE_STATIC = [
  './app/',
  './app/index.html',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './manifest.json',
];

// ─── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VER)
      .then(c => c.addAll(CACHE_STATIC))
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE — elimina cache vecchie ─────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VER).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── FETCH — cache-first per assets, network-first per API ────
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (e.request.method !== 'GET') return;

  // Firebase / Google APIs — sempre rete
  if (url.includes('firebase') || url.includes('googleapis') ||
      url.includes('gstatic')  || url.includes('cloudflare')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_VER).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Offline fallback per HTML
        if (e.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./app/index.html');
        }
      });
    })
  );
});

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || '💰 Kazka', {
      body:    data.body || 'Hai una nuova notifica',
      icon:    './assets/icons/icon-192.png',
      badge:   './assets/icons/icon-192.png',
      tag:     data.tag  || 'kazka-notif',
      vibrate: [200, 100, 200],
      data:    { url: data.url || './app/' },
      actions: [
        { action: 'open',    title: 'Apri Kazka' },
        { action: 'dismiss', title: 'Ignora' }
      ]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      const url = e.notification.data?.url || './app/';
      const open = cls.find(c => c.url.includes('kazka'));
      if (open) { open.focus(); return; }
      return clients.openWindow(url);
    })
  );
});

// ─── BACKGROUND SYNC — salva tx offline ───────────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'sync-transactions') {
    e.waitUntil(_syncPendingTx());
  }
});

async function _syncPendingTx() {
  // Legge dalla IndexedDB le tx pending e le invia a Firebase
  // quando torna la connessione
  console.log('[SW] Background sync: transazioni pending');
}
