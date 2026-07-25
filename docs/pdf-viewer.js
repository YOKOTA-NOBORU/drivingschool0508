import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.1.200/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.1.200/build/pdf.worker.mjs";

(()=>{
  const panel=document.getElementById("pdfSidePanel");
  const closeBtn=document.getElementById("pdfSideCloseBtn");
  const fullscreenBtn=document.getElementById("pdfFullscreenBtn");
  const renderArea=document.getElementById("pdfRenderArea");
  const heading=document.getElementById("pdfSideTitle");
  if(!panel||!closeBtn||!fullscreenBtn||!renderArea||!heading) return;

  const landscapeTablet=window.matchMedia("(min-width: 768px) and (orientation: landscape)");
  let currentPdfUrl="";
  let currentDocument=null;
  let loadSerial=0;
  let resizeTimer=null;

  function isAppleMobile(){
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function showStatus(message,isError=false){
    renderArea.innerHTML="";
    const status=document.createElement("div");
    status.className=`pdf-status${isError?" error":""}`;
    status.textContent=message;
    renderArea.appendChild(status);
  }

  async function renderDocument(pdfDocument,serial){
    renderArea.innerHTML="";
    renderArea.scrollTop=0;

    const availableWidth=Math.max(280,renderArea.clientWidth-20);
    const pixelRatio=Math.min(window.devicePixelRatio||1,2);

    for(let pageNumber=1;pageNumber<=pdfDocument.numPages;pageNumber++){
      if(serial!==loadSerial) return;

      const page=await pdfDocument.getPage(pageNumber);
      const originalViewport=page.getViewport({scale:1});
      const cssScale=availableWidth/originalViewport.width;
      const cssViewport=page.getViewport({scale:cssScale});
      const renderViewport=page.getViewport({scale:cssScale*pixelRatio});

      const pageWrap=document.createElement("section");
      pageWrap.className="pdf-page-wrap";

      const pageLabel=document.createElement("div");
      pageLabel.className="pdf-page-label";
      pageLabel.textContent=`${pageNumber} / ${pdfDocument.numPages}`;

      const canvas=document.createElement("canvas");
      canvas.className="pdf-page-canvas";
      canvas.width=Math.floor(renderViewport.width);
      canvas.height=Math.floor(renderViewport.height);
      canvas.style.width=`${Math.floor(cssViewport.width)}px`;
      canvas.style.height=`${Math.floor(cssViewport.height)}px`;

      pageWrap.append(pageLabel,canvas);
      renderArea.appendChild(pageWrap);

      const context=canvas.getContext("2d",{alpha:false});
      await page.render({canvasContext:context,viewport:renderViewport}).promise;
    }
  }

  async function loadPdf(pdfUrl){
    const serial=++loadSerial;
    showStatus("PDFを読み込んでいます…");

    try{
      const loadingTask=pdfjsLib.getDocument({url:pdfUrl});
      const pdfDocument=await loadingTask.promise;
      if(serial!==loadSerial){
        await pdfDocument.destroy();
        return;
      }
      currentDocument=pdfDocument;
      await renderDocument(pdfDocument,serial);
    }catch(error){
      console.error("PDF.js load error:",error);
      if(serial===loadSerial){
        showStatus("PDFを表示できませんでした。「全画面」を押してください。",true);
      }
    }
  }

  function openPdf({key="1-1",title="教本PDF"}={}){
    if(!/^[12]-(?:[1-9]|1[0-9]|2[0-2])$/.test(key)) return;

    const pdfUrl=`./pdf/${key}.pdf`;
    currentPdfUrl=pdfUrl;

    if(landscapeTablet.matches){
      heading.textContent=title;
      panel.setAttribute("aria-hidden","false");
      document.body.classList.add("pdf-split-open");

      const lessonPane=document.querySelector(".lesson-pane");
      if(lessonPane) lessonPane.scrollTop=0;

      requestAnimationFrame(()=>loadPdf(pdfUrl));
      return;
    }

    if(isAppleMobile()){
      window.location.href=pdfUrl;
      return;
    }

    window.open(pdfUrl,"_blank","noopener");
  }

  function openFullscreenPdf(){
    if(!currentPdfUrl) return;
    if(isAppleMobile()){
      window.location.href=currentPdfUrl;
      return;
    }
    window.open(currentPdfUrl,"_blank","noopener");
  }

  async function closePdf(){
    loadSerial++;
    document.body.classList.remove("pdf-split-open");
    panel.setAttribute("aria-hidden","true");
    renderArea.innerHTML="";
    currentPdfUrl="";
    if(currentDocument){
      try{await currentDocument.destroy();}catch(_error){}
      currentDocument=null;
    }
  }

  function handleLayoutChange(){
    if(!landscapeTablet.matches && document.body.classList.contains("pdf-split-open")){
      closePdf();
    }
  }

  function handleResize(){
    if(!document.body.classList.contains("pdf-split-open")||!currentDocument) return;
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      const serial=++loadSerial;
      renderDocument(currentDocument,serial).catch(error=>{
        console.error("PDF.js resize render error:",error);
      });
    },250);
  }

  window.openTextbookPdf=openPdf;
  window.closeTextbookPdf=closePdf;

  closeBtn.addEventListener("click",closePdf);
  fullscreenBtn.addEventListener("click",openFullscreenPdf);
  landscapeTablet.addEventListener?.("change",handleLayoutChange);
  window.addEventListener("resize",handleResize,{passive:true});
})();
