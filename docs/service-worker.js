const CORE_CACHE = "textbook-core-v14-stage-pinch-zoom";
const PDF_CACHE = "textbook-pdf-files-v1";
const PDFJS_CACHE = "textbook-pdfjs-runtime-v1";

const coreAssets = [
  "./",
  "./index.html",
  "./style.css",
  "./pdf-viewer.css",
  "./app.js",
  "./pdf-viewer.js",
  "./data.js",
  "./mobile-data.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => cache.addAll(coreAssets))
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([CORE_CACHE, PDF_CACHE, PDFJS_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => keep.has(key) ? null : caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.pathname.includes("/pdf/") && url.pathname.endsWith(".pdf")) {
    event.respondWith(
      caches.open(PDF_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        try {
          const network = await fetch(request);
          if (network.ok) await cache.put(request, network.clone());
          return network;
        } catch (_error) {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  if (url.hostname === "cdn.jsdelivr.net" && url.pathname.includes("/pdfjs-dist@")) {
    event.respondWith(
      caches.open(PDFJS_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const network = await fetch(request);
        if (network.ok) await cache.put(request, network.clone());
        return network;
      })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          caches.open(CORE_CACHE).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      }))
    );
  }
});
