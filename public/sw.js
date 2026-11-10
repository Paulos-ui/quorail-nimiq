// Never cache payment data, wallet responses, RPC requests or app navigation.
// A network-only shell avoids stale financial code. Offline visits get a clear fallback.
const CACHE = 'quorail-offline-v2';
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.add('/offline.html'))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('quorail-') && key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => {
 if(event.request.mode === 'navigate') event.respondWith(fetch(event.request).catch(() => caches.match('/offline.html')));
});
