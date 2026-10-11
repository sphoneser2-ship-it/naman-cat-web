// Offline support for the web version: always try the network first (so an update is seen at once),
// and fall back to the last copy kept on the phone when there is no connection.
const CACHE = 'naman-cat-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: false }).then(hit => hit || caches.match(req, { ignoreSearch: true })))
  );
});
