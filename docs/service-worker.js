const CACHE_NAME = "textbook-pdf-all-v5-offline";

// アプリの基本ファイル
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

// iPad横持ち表示で使用するPDF.js
const pdfJsAssets = [
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.1.200/legacy/build/pdf.mjs",
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.1.200/legacy/build/pdf.worker.mjs"
];

// 教本PDF 1-1〜1-22、2-1〜2-16
const textbookPdfs = [
  ...Array.from({ length: 22 }, (_, i) => `./pdf/1-${i + 1}.pdf`),
  ...Array.from({ length: 16 }, (_, i) => `./pdf/2-${i + 1}.pdf`)
];

async function cacheOneByOne(cache, urls) {
  await Promise.all(
    urls.map(async (url) => {
      try {
        await cache.add(url);
      } catch (error) {
        // 1ファイルの取得失敗でService Worker全体を止めない
        console.warn("キャッシュできませんでした:", url, error);
      }
    })
  );
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cacheOneByOne(cache, coreAssets);
      await cacheOneByOne(cache, pdfJsAssets);
      await cacheOneByOne(cache, textbookPdfs);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => key === CACHE_NAME ? null : caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 教本PDFはネット優先。通信できない時は保存済みPDFを表示する。
  if (url.pathname.includes("/pdf/") && url.pathname.endsWith(".pdf")) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // PDF.jsとアプリ本体は保存済みデータを優先する。
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (request.method === "GET" && response && (response.ok || response.type === "opaque")) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
