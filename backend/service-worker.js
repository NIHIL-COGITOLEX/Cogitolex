const CACHE_NAME = "cogitolex-v1";

const FILES = [
    "/",
    "/index.html",
    "/style.css",
    "/app.js"
];

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES))
    );

    self.skipWaiting();
});

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)
            .then(response => {

                return response || fetch(event.request);
            })
    );
});