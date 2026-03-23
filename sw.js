const CACHE = 'comfort-score-v2';
const STATIC = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

// On install: cache only the static app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .catch(() => {})
  );
  self.skipWaiting();
});

// On activate: clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// On fetch: ALWAYS go to network for external APIs, cache-first for app shell
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Always fetch live from network — never cache these
  const isExternal = url.includes('open-meteo.com') ||
                     url.includes('nominatim.openstreetmap.org') ||
                     url.includes('fonts.googleapis.com') ||
                     url.includes('fonts.gstatic.com');

  if (isExternal || e.request.method !== 'GET') {
    e.respondWith(fetch(e.request));
    return;
  }

  // App shell: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});
