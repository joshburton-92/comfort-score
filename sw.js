// Minimal service worker — enables PWA install prompt only.
// No caching — the app always loads fresh from the network.
// This prevents stale cache issues after updates.

const VERSION = '4';

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

// Kept for the PWA install prompt, but it never calls respondWith(), so every request —
// the app's own files and the weather, search and map APIs — goes to the network exactly
// as if there were no service worker. Re-sending requests from here only added a point
// of failure: a stuck worker broke live weather even when the network was fine.
self.addEventListener('fetch', () => {});
