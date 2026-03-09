// SW.JS - Service Worker Kazka v1.1
const CACHE_NAME = 'kazka-v3';
const BASE = '/appfinance/';

const ASSETS_TO_CACHE = [
  BASE,
  BASE + 'app.html',
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
  BASE + 'modules/01-config.js',
  BASE + 'modules/02-styles.css',
  BASE + 'modules/03-ui.js',
  BASE + 'modules/04-firebase.js',
  BASE + 'modules/05-utils.js',
  BASE + 'modules/06-goals.js',
  BASE + 'modules/07-sync.js',
  BASE + 'modules/08-transactions.js',
  BASE + 'modules/09-recurring.js',
  BASE + 'modules/10-profile.js',
  BASE + 'modules/11-groups.js',
  BASE + 'modules/12-budget.js',
  BASE + 'modules/13-reports.js',
  BASE + 'modules/14-auth.js',
  BASE + 'modules/15-login-ui.js',
  BASE + 'modules/16-login-styles.css',
  BASE + 'modules/17-admin.js',
  BASE + 'modules/99-init.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.log('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
  console.log('[SW] Activated, cache:', CACHE_NAME);
});

self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Firebase requests
  if (event.request.url.includes('firebase') || event.request.url.includes('googleapis')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Return cached, then update in background
        event.waitUntil(
          fetch(event.request).then(response => {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
            }
          }).catch(() => {})
        );
        return cached;
      }

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return response;
      }).catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match(BASE + 'app.html');
        }
      });
    })
  );
});
