// Codice sviluppato da Adamo Michele
const CACHE = 'kazka-v9';
const BASE = self.registration.scope;

const PRECACHE = [
  BASE,
  BASE + 'app/',
  BASE + 'app/index.html',
  BASE + 'index.html',
  BASE + '404.html',
  BASE + 'manifest.json',
  BASE + 'privacy.html',
  BASE + 'termini.html',
  BASE + 'admin/',
  BASE + 'admin/index.html',
  'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE && x !== CACHE + '-api').map(x => caches.delete(x))))
  );
  self.clients.claim();
});

// Offline IndexedDB-backed data queue
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SYNC_DATA') {
    openDB().then(db => {
      const tx = db.transaction('pending', 'readwrite');
      const store = tx.objectStore('pending');
      store.add({ payload: e.data.payload, ts: Date.now() });
    }).catch(() => {});
  }
});

self.addEventListener('sync', e => {
  if (e.tag === 'sync-kazka') {
    e.waitUntil(syncPendingData());
  }
});

// BUG-19 FIX: proper IndexedDB promise wrapper
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('kazka_offline', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('localData')) {
        db.createObjectStore('localData', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// BUG-19 FIX: use proper IDB callbacks instead of non-standard .store.getAll()
async function syncPendingData() {
  let db;
  try { db = await openDB(); } catch(e) { return; }

  const items = await new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readonly');
    const store = tx.objectStore('pending');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  for (const item of items) {
    try {
      await fetch(item.payload.url, {
        method: item.payload.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload.data)
      });
      await new Promise((resolve, reject) => {
        const delTx = db.transaction('pending', 'readwrite');
        const store = delTx.objectStore('pending');
        const req = store.delete(item.id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Sync failed, will retry:', e);
    }
  }
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Firebase RTDB = data API, cache with special strategy
  if (url.hostname.includes('firebaseio.com')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const c = r.clone();
        caches.open(CACHE + '-api').then(ch => ch.put(e.request, c));
        return r;
      }).catch(async () => {
        const cached = await caches.match(e.request);
        if (cached) return cached;
        try {
          const db = await openDB();
          const entry = await new Promise((resolve, reject) => {
            const tx = db.transaction('localData', 'readonly');
            const store = tx.objectStore('localData');
            const req = store.get(url.href);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });
          if (entry) return new Response(JSON.stringify(entry.data), { headers: { 'Content-Type': 'application/json' } });
        } catch(e) {}
        return (await caches.match(BASE + 'app/index.html')) || (await caches.match(BASE + '404.html'));
      })
    );
    return;
  }

  // CDN / Google Fonts / Firebase SDK — stale-while-revalidate
  if (url.hostname !== self.location.hostname) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(r => {
          caches.open(CACHE).then(ch => ch.put(e.request, r.clone()));
          return r;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  e.respondWith(
    fetch(e.request).then(r => {
      const c = r.clone();
      caches.open(CACHE).then(ch => ch.put(e.request, c));
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match(BASE + '404.html')))
  );
});
