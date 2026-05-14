const CACHE='kazka-v5';
const BASE=self.registration.scope;
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll([BASE,BASE+'index.html',BASE+'app/',BASE+'app/index.html']).catch(()=>{})));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(ch=>ch.put(e.request,c));return r;}).catch(()=>caches.match(e.request)));});
