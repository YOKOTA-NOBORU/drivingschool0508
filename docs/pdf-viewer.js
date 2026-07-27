const PDFJS_VERSION = "6.1.200";
const PDFJS_CACHE = "textbook-pdfjs-runtime-v1";
const PDFJS_MODULE_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.mjs`;
const PDFJS_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.worker.mjs`;
const PDF_CACHE = "textbook-pdf-files-v1";
const OFFLINE_PROMPT_KEY = "textbook-offline-prompt-v1";
const OFFLINE_READY_KEY = "textbook-offline-ready-v1";

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
  const zoomOutBtn = document.getElementById("pdfZoomOutBtn");
  const zoomResetBtn = document.getElementById("pdfZoomResetBtn");
  const zoomInBtn = document.getElementById("pdfZoomInBtn");
  const renderArea = document.getElementById("pdfRenderArea");
  const heading = document.getElementById("pdfSideTitle");
  const contentLayout = document.querySelector(".content-layout");
  const divider = document.getElementById("splitDivider");
  if (!panel || !closeBtn || !fullscreenBtn || !zoomOutBtn || !zoomResetBtn || !zoomInBtn || !renderArea || !heading || !contentLayout || !divider) return;

  const landscapeTablet = window.matchMedia("(min-width: 768px) and (orientation: landscape)");
  let currentPdfUrl = "";
  let currentDocument = null;
  let loadSerial = 0;
  let resizeTimer = null;
  let preparingOffline = false;
  let offlinePromptInProgress = false;
  const SPLIT_WIDTH_KEY = "textbook-split-width-v1";
  let activePointerId = null;
  const MIN_ZOOM = 0.7;
  const MAX_ZOOM = 1.6;
  const ZOOM_STEP = 0.1;
  let zoomLevel = 1;
  let pdfScrollFrame = 0;
  let lastFollowPage = 0;
  let lessonFollowPausedUntil = 0;
  let pageObserver = null;
  let observedVisiblePage = 1;
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  let pinchTargetZoom = 1;
  let pinchActive = false;

  function updateZoomControls() {
    zoomResetBtn.textContent = `${Math.round(zoomLevel * 100)}%`;
    zoomOutBtn.disabled = zoomLevel <= MIN_ZOOM + 0.001;
    zoomInBtn.disabled = zoomLevel >= MAX_ZOOM - 0.001;
  }

  function clampLessonPercent(percent) {
    const layoutWidth = contentLayout.getBoundingClientRect().width;
    if (!layoutWidth) return 45;
    const minLeftPercent = Math.max(28, (300 / layoutWidth) * 100);
    const maxLeftPercent = Math.min(68, 100 - (360 / layoutWidth) * 100);
    return Math.min(Math.max(percent, minLeftPercent), maxLeftPercent);
  }

  function setLessonWidth(percent, { save = true } = {}) {
    const safePercent = clampLessonPercent(percent);
    contentLayout.style.setProperty("--lesson-pane-width", `${safePercent}%`);
    divider.setAttribute("aria-valuenow", String(Math.round(safePercent)));
    divider.setAttribute("aria-valuemin", "28");
    divider.setAttribute("aria-valuemax", "68");
    if (save) localStorage.setItem(SPLIT_WIDTH_KEY, String(safePercent));
  }

  function restoreLessonWidth() {
    const saved = Number(localStorage.getItem(SPLIT_WIDTH_KEY));
    setLessonWidth(Number.isFinite(saved) && saved > 0 ? saved : 45, { save: false });
  }

  function updateWidthFromClientX(clientX) {
    const rect = contentLayout.getBoundingClientRect();
    if (!rect.width) return;
    setLessonWidth(((clientX - rect.left) / rect.width) * 100);
  }

  function finishDividerDrag(event) {
    if (activePointerId === null) return;
    try { divider.releasePointerCapture(activePointerId); } catch (_error) {}
    activePointerId = null;
    divider.classList.remove("dragging");
    document.body.classList.remove("split-resizing");
    handleResize();
    event?.preventDefault?.();
  }

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

  function currentPdfScrollProgress(){
    const scrollable = Math.max(0, renderArea.scrollHeight - renderArea.clientHeight);
    if (!scrollable) return 0;
    return Math.min(1, Math.max(0, renderArea.scrollTop / scrollable));
  }

  function syncLessonToPdfScroll({ force = false } = {}){
    if(!currentDocument || (!force && Date.now() < lessonFollowPausedUntil)) return;
    const progress = currentPdfScrollProgress();
    window.syncExplanationToPdfProgress?.(progress);
  }

  function schedulePdfFollow(){
    cancelAnimationFrame(pdfScrollFrame);
    pdfScrollFrame=requestAnimationFrame(()=>syncLessonToPdfScroll());
  }

  async function renderDocument(pdfDocument, serial, { preserveScroll = false } = {}) {
    const oldScrollable = Math.max(1, renderArea.scrollHeight - renderArea.clientHeight);
    const oldScrollRatio = preserveScroll ? renderArea.scrollTop / oldScrollable : 0;
    renderArea.innerHTML = "";
    renderArea.scrollTop = 0;

    const availableWidth = Math.max(280, renderArea.clientWidth - 20) * zoomLevel;
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
      pageWrap.dataset.pageNumber = String(pageNumber);

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

    if (preserveScroll && serial === loadSerial) {
      const newScrollable = Math.max(0, renderArea.scrollHeight - renderArea.clientHeight);
      renderArea.scrollTop = newScrollable * oldScrollRatio;
    }
    if (serial === loadSerial) {
      requestAnimationFrame(() => syncLessonToPdfScroll({ force: true }));
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
      zoomLevel = 1;
      updateZoomControls();
      await renderDocument(pdfDocument, serial);
    } catch (error) {
      console.error("PDF.js load error:", error);
      if (serial === loadSerial) {
        const message = navigator.onLine
          ? "PDFを表示できませんでした。もう一度押すか「全画面」をお試しください。"
          : "このPDFはまだ端末に保存されていません。ネット接続中にもう一度開いてください。";
        showStatus(message, true);
      }
    }
  }

  async function openPdf({ key = "1-1", title = "教本PDF" } = {}) {
    if (!/^[12]-(?:[1-9]|1[0-9]|2[0-2])$/.test(key)) return;

    const pdfUrl = `./pdf/${key}.pdf`;
    currentPdfUrl = pdfUrl;

    if (landscapeTablet.matches) {
      heading.textContent = title;
      panel.setAttribute("aria-hidden", "false");
      document.body.classList.add("pdf-split-open");
      restoreLessonWidth();

      const lessonPane = document.querySelector(".lesson-pane");
      if (lessonPane) lessonPane.scrollTop = 0;

      await offerOfflinePreparationOnce();
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
    showStatus("教本PDFをオフラインで使えるように保存しています…");

    try {
      const result = await cacheAllTextbookPdfs(({ completed, total, failed }) => {
        showStatus(`オフライン準備中… ${completed} / ${total}${failed ? `（失敗 ${failed}）` : ""}`);
      });

      if (result.failed === 0) {
        localStorage.setItem(OFFLINE_READY_KEY, "1");
        showStatus("保存が完了しました。これからはオフラインでも教本PDFを表示できます。");
      } else {
        localStorage.removeItem(OFFLINE_READY_KEY);
        showStatus(`準備は完了しましたが、${result.failed}件を保存できませんでした。通信状態を確認してもう一度押してください。`, true);
      }
    } catch (error) {
      console.error("Offline preparation error:", error);
      showStatus("オフライン準備に失敗しました。通信状態と端末の空き容量を確認してください。", true);
    } finally {
      preparingOffline = false;
    }
  }

  async function hasAllOfflinePdfs() {
    if (!("caches" in window)) return false;
    try {
      const cache = await caches.open(PDF_CACHE);
      const urls = [
        ...Array.from({ length: 22 }, (_, i) => new URL(`./pdf/1-${i + 1}.pdf`, location.href).href),
        ...Array.from({ length: 16 }, (_, i) => new URL(`./pdf/2-${i + 1}.pdf`, location.href).href)
      ];
      const matches = await Promise.all(urls.map(url => cache.match(url)));
      return matches.every(Boolean);
    } catch (error) {
      console.warn("Offline PDF cache check failed:", error);
      return false;
    }
  }

  async function offerOfflinePreparationOnce() {
    if (offlinePromptInProgress || preparingOffline) return;
    if (localStorage.getItem(OFFLINE_READY_KEY) === "1") return;

    if (await hasAllOfflinePdfs()) {
      localStorage.setItem(OFFLINE_READY_KEY, "1");
      return;
    }

    if (localStorage.getItem(OFFLINE_PROMPT_KEY)) return;
    localStorage.setItem(OFFLINE_PROMPT_KEY, "shown");

    if (!navigator.onLine) return;

    offlinePromptInProgress = true;
    const accepted = window.confirm(
      "教本PDFをオフラインでも使えるように端末へ保存しますか？\n\n「OK」を押すと全38項目を保存します。Wi-Fi接続中に行うことをおすすめします。"
    );
    offlinePromptInProgress = false;

    if (accepted) {
      await prepareOffline();
    }
  }

  async function closePdf() {
    loadSerial++;
    document.body.classList.remove("pdf-split-open");
    panel.setAttribute("aria-hidden", "true");
    renderArea.innerHTML = "";
    currentPdfUrl = "";
    window.clearPdfExplanationFollow?.();
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
      renderDocument(currentDocument, serial, { preserveScroll: true }).catch(error => {
        console.error("PDF.js resize render error:", error);
      });
    }, 250);
  }

  function setZoom(nextZoom) {
    const rounded = Math.round(nextZoom * 10) / 10;
    const safeZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, rounded));
    if (Math.abs(safeZoom - zoomLevel) < 0.001) return;
    zoomLevel = safeZoom;
    updateZoomControls();

    if (!currentDocument) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const serial = ++loadSerial;
      renderDocument(currentDocument, serial, { preserveScroll: true }).catch(error => {
        console.error("PDF.js zoom render error:", error);
      });
    }, 80);
  }

  function touchDistance(touchA, touchB) {
    return Math.hypot(touchB.clientX - touchA.clientX, touchB.clientY - touchA.clientY);
  }

  function beginPinchZoom(event) {
    if (event.touches.length !== 2 || !currentDocument) return;
    pinchStartDistance = touchDistance(event.touches[0], event.touches[1]);
    if (!pinchStartDistance) return;
    pinchStartZoom = zoomLevel;
    pinchTargetZoom = zoomLevel;
    pinchActive = true;
    event.preventDefault();
  }

  function updatePinchZoom(event) {
    if (!pinchActive || event.touches.length !== 2) return;
    const distance = touchDistance(event.touches[0], event.touches[1]);
    if (!distance || !pinchStartDistance) return;
    const rawZoom = pinchStartZoom * (distance / pinchStartDistance);
    pinchTargetZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, rawZoom));
    zoomResetBtn.textContent = `${Math.round(pinchTargetZoom * 100)}%`;
    event.preventDefault();
  }

  function finishPinchZoom(event) {
    if (!pinchActive) return;
    if (event.touches && event.touches.length >= 2) return;
    pinchActive = false;
    setZoom(pinchTargetZoom);
    updateZoomControls();
    event.preventDefault();
  }

  window.openTextbookPdf = openPdf;
  window.closeTextbookPdf = closePdf;

  closeBtn.addEventListener("click", closePdf);
  fullscreenBtn.addEventListener("click", openFullscreenPdf);
  zoomOutBtn.addEventListener("click", () => setZoom(zoomLevel - ZOOM_STEP));
  zoomResetBtn.addEventListener("click", () => setZoom(1));
  zoomInBtn.addEventListener("click", () => setZoom(zoomLevel + ZOOM_STEP));
  updateZoomControls();
  landscapeTablet.addEventListener?.("change", handleLayoutChange);
  window.addEventListener("resize", handleResize, { passive: true });

  renderArea.addEventListener("scroll", schedulePdfFollow, { passive: true });
  renderArea.addEventListener("touchstart", beginPinchZoom, { passive: false });
  renderArea.addEventListener("touchmove", updatePinchZoom, { passive: false });
  renderArea.addEventListener("touchend", finishPinchZoom, { passive: false });
  renderArea.addEventListener("touchcancel", finishPinchZoom, { passive: false });

  const lessonPane = document.querySelector(".lesson-pane");
  const pauseLessonFollow = () => { lessonFollowPausedUntil = Date.now() + 4000; };
  lessonPane?.addEventListener("pointerdown", pauseLessonFollow, { passive: true });
  lessonPane?.addEventListener("wheel", pauseLessonFollow, { passive: true });
  lessonPane?.addEventListener("touchstart", pauseLessonFollow, { passive: true });

  divider.addEventListener("pointerdown", (event) => {
    if (!landscapeTablet.matches || !document.body.classList.contains("pdf-split-open")) return;
    activePointerId = event.pointerId;
    divider.setPointerCapture(event.pointerId);
    divider.classList.add("dragging");
    document.body.classList.add("split-resizing");
    updateWidthFromClientX(event.clientX);
    event.preventDefault();
  });

  divider.addEventListener("pointermove", (event) => {
    if (activePointerId !== event.pointerId) return;
    updateWidthFromClientX(event.clientX);
    event.preventDefault();
  });

  divider.addEventListener("pointerup", finishDividerDrag);
  divider.addEventListener("pointercancel", finishDividerDrag);

  divider.addEventListener("dblclick", () => {
    setLessonWidth(45);
    handleResize();
  });

  divider.addEventListener("keydown", (event) => {
    const current = Number.parseFloat(getComputedStyle(contentLayout).getPropertyValue("--lesson-pane-width")) || 45;
    if (event.key === "ArrowLeft") {
      setLessonWidth(current - (event.shiftKey ? 5 : 2));
      handleResize();
      event.preventDefault();
    } else if (event.key === "ArrowRight") {
      setLessonWidth(current + (event.shiftKey ? 5 : 2));
      handleResize();
      event.preventDefault();
    } else if (event.key === "Home") {
      setLessonWidth(45);
      handleResize();
      event.preventDefault();
    }
  });
})();
