// Minimal service worker — enables PWA install prompt only.
// No caching — the app always loads fresh from the network.
// This prevents stale cache issues after updates.

const VERSION = '3';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Clear ALL caches from previous versions
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Pass everything straight through to the network — no caching
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request));
});
