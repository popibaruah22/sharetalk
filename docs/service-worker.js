// Simple auto-cache service worker, no versioning
self.addEventListener('install', (event) => {
  self.skipWaiting(); // take control immediately
});

self.addEventListener('activate', (event) => {
  self.clients.claim(); // control all pages
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // clone response and store in cache
        const responseClone = response.clone();
        caches.open('sharetalk-cache').then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // if network fails, serve from cache
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || new Response('Offline');
        });
      })
  );
});
