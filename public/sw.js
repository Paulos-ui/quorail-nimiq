// Cache only the read-only fallback. Never cache wallet, RPC, API or financial app code.
const CACHE = 'quorail-offline-v4';
const FILES = ['/offline.html', '/offline.js'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('quorail-') && key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url);
 if(event.request.method !== 'GET' || url.origin !== self.location.origin) return;
 if(event.request.mode === 'navigate') event.respondWith(fetch(event.request).catch(() => caches.match('/offline.html')));
 else if(url.pathname === '/offline.js') event.respondWith(fetch(event.request).catch(() => caches.match('/offline.js')));
});
