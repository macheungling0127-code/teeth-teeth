
/* Dental Pet PWA - Simple offline cache */
const CACHE_NAME = 'dentalpet-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon-180.png',
  './icons/apple-touch-icon-167.png',
  './icons/apple-touch-icon-152.png',
  './icons/favicon-32.png',
  './icons/favicon-16.png',
  './sprites/pet-idle.png' // optional: will be skipped if not present
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(CORE_ASSETS.map(u => new Request(u, { cache: 'reload' }))).catch(err => {
        // Some assets may be missing initially (e.g., sprites). That’s okay.
        console.warn('SW install: some assets missing:', err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle same-origin GET requests
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req)
        .then(networkResp => {
          if (networkResp && networkResp.status === 200) {
            const clone = networkResp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return networkResp;
        })
        .catch(() => cached); // offline: fallback to cache
      return cached || fetchPromise;
    })
  );
});
