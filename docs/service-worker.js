const CACHE_NAME = 'sharetalk-cache-v1';

// Install: take control immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: claim clients and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch: network-first, then cache, fallback to offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // clone response and store in cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // if network fails, return from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return new Response('Offline'); // fallback if nothing cached
        });
      })
  );
});
