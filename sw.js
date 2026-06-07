// This service worker unregisters itself and clears all caches.
// It exists only to clean up the old service worker that was caching site assets.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
            .then(() => self.registration.unregister())
    );
    self.clients.claim();
});