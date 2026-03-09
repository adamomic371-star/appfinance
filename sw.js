const CACHE_NAME = 'kazka-v1';
const urlsToCache = [
  '/appfinance/',
  '/appfinance/app.html',
  '/appfinance/index.html',
  '/appfinance/manifest.json',
  '/appfinance/icon-192.png',
  '/appfinance/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});