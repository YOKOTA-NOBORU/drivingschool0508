const CACHE_NAME = "textbook-pdf-step1-items1-2-v2";

const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./pdf-viewer.css",
  "./app.js",
  "./pdf-viewer.js",
  "./pdf/1-1.pdf",
  "./pdf/1-2.pdf",
  "./data.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});
