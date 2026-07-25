const PDFJS_VERSION = "6.1.200";
const PDFJS_CACHE = "textbook-pdfjs-runtime-v1";
const PDFJS_MODULE_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.mjs`;
const PDFJS_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.worker.mjs`;
const PDF_CACHE = "textbook-pdf-files-v1";

let pdfjsLibPromise = null;
let pdfModuleBlobUrl = "";
let pdfWorkerBlobUrl = "";

async function fetchAndCache(url, cacheName, { refresh = false } = {}) {
  const cache = await caches.open(cacheName);

  if (!refresh) {
    const cached = await cache.match(url);
    if (cached) return cached;
  }

  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`${url} の取得に失敗しました (${response.status})`);
  await cache.put(url, response.clone());
  return response;
}

async function responseToModuleBlobUrl(response, mimeType = "text/javascript") {
  const source = await response.text();
  return URL.createObjectURL(new Blob([source], { type: mimeType }));
}

async function loadPdfJs() {
  if (pdfjsLibPromise) return pdfjsLibPromise;

  pdfjsLibPromise = (async () => {
    if (!("caches" in window)) {
      throw new Error("このブラウザではオフライン保存を利用できません。");
    }

    const [moduleResponse, workerResponse] = await Promise.all([
      fetchAndCache(PDFJS_MODULE_URL, PDFJS_CACHE),
      fetchAndCache(PDFJS_WORKER_URL, PDFJS_CACHE)
    ]);

    pdfModuleBlobUrl = await responseToModuleBlobUrl(moduleResponse);
    pdfWorkerBlobUrl = await responseToModuleBlobUrl(workerResponse);

    const pdfjsLib = await import(pdfModuleBlobUrl);
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerBlobUrl;
    return pdfjsLib;
  })().catch((error) => {
    pdfjsLibPromise = null;
    throw error;
  });

  return pdfjsLibPromise;
}

async function getPdfResponse(pdfUrl) {
  const absoluteUrl = new URL(pdfUrl, location.href).href;
  const cache = await caches.open(PDF_CACHE);
  const cached = await cache.match(absoluteUrl);

  if (!navigator.onLine) {
    if (!cached) throw new Error("このPDFはまだオフライン保存されていません。");
    return cached;
  }

  try {
    const response = await fetch(absoluteUrl, { cache: "no-cache" });
    if (!response.ok) throw new Error(`PDF fetch failed: ${response.status}`);
    await cache.put(absoluteUrl, response.clone());
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

async function cacheAllTextbookPdfs(onProgress) {
  await loadPdfJs();
  const urls = [
    ...Array.from({ length: 22 }, (_, i) => `./pdf/1-${i + 1}.pdf`),
    ...Array.from({ length: 16 }, (_, i) => `./pdf/2-${i + 1}.pdf`)
  ];

  const cache = await caches.open(PDF_CACHE);
  let completed = 0;
  let failed = 0;

  for (const relativeUrl of urls) {
    const absoluteUrl = new URL(relativeUrl, location.href).href;
    try {
      const existing = await cache.match(absoluteUrl);
      if (!existing) {
        const response = await fetch(absoluteUrl, { cache: "no-cache" });
        if (!response.ok) throw new Error(String(response.status));
        await cache.put(absoluteUrl, response.clone());
      }
    } catch (error) {
      console.error("PDF offline cache error:", absoluteUrl, error);
      failed++;
    }
    completed++;
    onProgress?.({ completed, total: urls.length, failed });
  }

  return { completed, total: urls.length, failed };
}

(() => {
  const panel = document.getElementById("pdfSidePanel");
  const closeBtn = document.getElementById("pdfSideCloseBtn");
  const fullscreenBtn = document.getElementById("pdfFullscreenBtn");
  const offlineBtn = document.getElementById("pdfOfflineBtn");
  const renderArea = document.getElementById("pdfRenderArea");
  const heading = document.getElementById("pdfSideTitle");
  if (!panel || !closeBtn || !fullscreenBtn || !renderArea || !heading) return;

  const landscapeTablet = window.matchMedia("(min-width: 768px) and (orientation: landscape)");
  let currentPdfUrl = "";
  let currentDocument = null;
  let loadSerial = 0;
  let resizeTimer = null;
  let preparingOffline = false;

  function isAppleMobile() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function showStatus(message, isError = false) {
    renderArea.innerHTML = "";
    const status = document.createElement("div");
    status.className = `pdf-status${isError ? " error" : ""}`;
    status.textContent = message;
    renderArea.appendChild(status);
  }

  async function renderDocument(pdfDocument, serial) {
    renderArea.innerHTML = "";
    renderArea.scrollTop = 0;

    const availableWidth = Math.max(280, renderArea.clientWidth - 20);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
      if (serial !== loadSerial) return;

      const page = await pdfDocument.getPage(pageNumber);
      const originalViewport = page.getViewport({ scale: 1 });
      const cssScale = availableWidth / originalViewport.width;
      const cssViewport = page.getViewport({ scale: cssScale });
      const renderViewport = page.getViewport({ scale: cssScale * pixelRatio });

      const pageWrap = document.createElement("section");
      pageWrap.className = "pdf-page-wrap";

      const pageLabel = document.createElement("div");
      pageLabel.className = "pdf-page-label";
      pageLabel.textContent = `${pageNumber} / ${pdfDocument.numPages}`;

      const canvas = document.createElement("canvas");
      canvas.className = "pdf-page-canvas";
      canvas.width = Math.floor(renderViewport.width);
      canvas.height = Math.floor(renderViewport.height);
      canvas.style.width = `${Math.floor(cssViewport.width)}px`;
      canvas.style.height = `${Math.floor(cssViewport.height)}px`;

      pageWrap.append(pageLabel, canvas);
      renderArea.appendChild(pageWrap);

      const context = canvas.getContext("2d", { alpha: false });
      await page.render({ canvasContext: context, viewport: renderViewport }).promise;
    }
  }

  async function loadPdf(pdfUrl) {
    const serial = ++loadSerial;
    showStatus("PDFを読み込んでいます…");

    try {
      const [pdfjsLib, response] = await Promise.all([
        loadPdfJs(),
        getPdfResponse(pdfUrl)
      ]);
      if (serial !== loadSerial) return;

      const pdfBytes = new Uint8Array(await response.arrayBuffer());
      const loadingTask = pdfjsLib.getDocument({
        data: pdfBytes,
        useWorkerFetch: false,
        isEvalSupported: false
      });
      const pdfDocument = await loadingTask.promise;
      if (serial !== loadSerial) {
        await pdfDocument.destroy();
        return;
      }

      currentDocument = pdfDocument;
      await renderDocument(pdfDocument, serial);
    } catch (error) {
      console.error("PDF.js load error:", error);
      if (serial === loadSerial) {
        const message = navigator.onLine
          ? "PDFを表示できませんでした。もう一度押すか「全画面」をお試しください。"
          : "オフライン表示の準備ができていません。ネット接続中に「オフライン準備」を押してください。";
        showStatus(message, true);
      }
    }
  }

  function openPdf({ key = "1-1", title = "教本PDF" } = {}) {
    if (!/^[12]-(?:[1-9]|1[0-9]|2[0-2])$/.test(key)) return;

    const pdfUrl = `./pdf/${key}.pdf`;
    currentPdfUrl = pdfUrl;

    if (landscapeTablet.matches) {
      heading.textContent = title;
      panel.setAttribute("aria-hidden", "false");
      document.body.classList.add("pdf-split-open");

      const lessonPane = document.querySelector(".lesson-pane");
      if (lessonPane) lessonPane.scrollTop = 0;

      requestAnimationFrame(() => loadPdf(pdfUrl));
      return;
    }

    if (isAppleMobile()) {
      window.location.href = pdfUrl;
      return;
    }

    window.open(pdfUrl, "_blank", "noopener");
  }

  function openFullscreenPdf() {
    if (!currentPdfUrl) return;
    if (isAppleMobile()) {
      window.location.href = currentPdfUrl;
      return;
    }
    window.open(currentPdfUrl, "_blank", "noopener");
  }

  async function prepareOffline() {
    if (preparingOffline) return;
    if (!navigator.onLine) {
      showStatus("オフライン準備にはインターネット接続が必要です。", true);
      return;
    }

    preparingOffline = true;
    if (offlineBtn) offlineBtn.disabled = true;
    showStatus("オフライン準備を開始しています…");

    try {
      const result = await cacheAllTextbookPdfs(({ completed, total, failed }) => {
        showStatus(`オフライン準備中… ${completed} / ${total}${failed ? `（失敗 ${failed}）` : ""}`);
      });

      if (result.failed === 0) {
        showStatus("オフライン準備が完了しました。Wi-Fiを切っても右側にPDFを表示できます。");
      } else {
        showStatus(`準備は完了しましたが、${result.failed}件を保存できませんでした。通信状態を確認してもう一度押してください。`, true);
      }
    } catch (error) {
      console.error("Offline preparation error:", error);
      showStatus("オフライン準備に失敗しました。通信状態と端末の空き容量を確認してください。", true);
    } finally {
      preparingOffline = false;
      if (offlineBtn) offlineBtn.disabled = false;
    }
  }

  async function closePdf() {
    loadSerial++;
    document.body.classList.remove("pdf-split-open");
    panel.setAttribute("aria-hidden", "true");
    renderArea.innerHTML = "";
    currentPdfUrl = "";
    if (currentDocument) {
      try { await currentDocument.destroy(); } catch (_error) {}
      currentDocument = null;
    }
  }

  function handleLayoutChange() {
    if (!landscapeTablet.matches && document.body.classList.contains("pdf-split-open")) {
      closePdf();
    }
  }

  function handleResize() {
    if (!document.body.classList.contains("pdf-split-open") || !currentDocument) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const serial = ++loadSerial;
      renderDocument(currentDocument, serial).catch(error => {
        console.error("PDF.js resize render error:", error);
      });
    }, 250);
  }

  window.openTextbookPdf = openPdf;
  window.closeTextbookPdf = closePdf;
  window.prepareTextbookOffline = prepareOffline;

  closeBtn.addEventListener("click", closePdf);
  fullscreenBtn.addEventListener("click", openFullscreenPdf);
  offlineBtn?.addEventListener("click", prepareOffline);
  landscapeTablet.addEventListener?.("change", handleLayoutChange);
  window.addEventListener("resize", handleResize, { passive: true });
})();
