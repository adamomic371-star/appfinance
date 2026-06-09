const CACHE = 'kazka-v7';
const BASE = self.registration.scope;

const PRECACHE = [
  BASE, BASE + 'app/app.html', BASE + 'app/',
  BASE + 'app/index.html', BASE + 'index.html',
  BASE + '404.html', BASE + 'manifest.json',
  BASE + 'privacy.html', BASE + 'termini.html',
  BASE + 'admin.html', BASE + 'admin/',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))
  );
  self.clients.claim();
});

// Offline IndexedDB-backed data queue
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SYNC_DATA') {
    const req = indexedDB.open('kazka_offline', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('pending', 'readwrite');
      const store = tx.objectStore('pending');
      store.add({ payload: e.data.payload, ts: Date.now() });
    };
  }
});

self.addEventListener('sync', e => {
  if (e.tag === 'sync-kazka') {
    e.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  const db = await openDB();
  const tx = db.transaction('pending', 'readonly');
  const items = await tx.store.getAll();
  for (const item of items) {
    try {
      await fetch(item.payload.url, {
        method: item.payload.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload.data)
      });
      const delTx = db.transaction('pending', 'readwrite');
      await delTx.store.delete(item.id);
    } catch (e) {
      console.warn('Sync failed, will retry:', e);
    }
  }
}

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

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin && !url.href.includes('firebase')) return;

  // For Firebase requests, try network first with fallback
  if (url.href.includes('firebase')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const c = r.clone();
        caches.open(CACHE + '-api').then(ch => ch.put(e.request, c));
        return r;
      }).catch(async () => {
        const cached = await caches.match(e.request);
        if (cached) return cached;
        // Try IDB cache as last resort
        const db = await openDB();
        const tx = db.transaction('localData', 'readonly');
        const entry = await tx.store.get(url.href);
        if (entry) return new Response(JSON.stringify(entry.data), { headers: { 'Content-Type': 'application/json' } });
        return caches.match(BASE + 'app/app.html');
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
