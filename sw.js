const CACHE_NAME = 'boyette-site-v1';
const ASSETS = [
    '/assets/css/styles.css',
    '/assets/js/main.js',
    '/assets/includes/navbar-professional.html',
    '/assets/includes/navbar-personal.html',
    '/assets/includes/darkmode.html',
];

// Install: cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: cache-first for static assets, network-first for HTML
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Cache-first for CSS, JS, and includes
    if (ASSETS.some((a) => url.pathname.endsWith(a.replace(/^\//, '')))) {
        event.respondWith(
            caches.match(event.request).then((cached) => cached || fetch(event.request))
        );
        return;
    }

    // Network-first for everything else (HTML pages)
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Optionally cache HTML pages
                if (response.ok && event.request.method === 'GET') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
