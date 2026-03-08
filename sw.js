// ===== SERVICE WORKER v2 (PWA con Cache e Sync) =====
const CACHE_VERSION = 'kazka-v2';
const ASSETS_TO_CACHE = [
  './',
  './app.html',
  './index.html',
  './manifest.json'
];

// INSTALL - Cache i file essenziali
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Cache addAll error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ACTIVATE - Pulisci cache vecchie
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_VERSION) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH - Network first, fallback cache
self.addEventListener('fetch', event => {
  // Ignora Firebase URLs
  if (event.request.url.includes('firebaseapp.com') || 
      event.request.url.includes('firebasedatabase.app')) {
    return; // Lascia Firebase gestire direttamente
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se è una GET request, metti in cache
        if (event.request.method === 'GET' && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Se offline, prova dalla cache
        return caches.match(event.request).then(response => {
          return response || new Response('Offline - dati non disponibili', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// BACKGROUND SYNC (quando torna online)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-kazka') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'BACKGROUND_SYNC',
            payload: 'App is back online - syncing data'
          });
        });
      })
    );
  }
});

// MESSAGE - Comunica con il client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
