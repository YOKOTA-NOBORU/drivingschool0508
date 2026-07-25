(()=>{
  const panel=document.getElementById("pdfSidePanel");
  const closeBtn=document.getElementById("pdfSideCloseBtn");
  const fullscreenBtn=document.getElementById("pdfFullscreenBtn");
  const frame=document.getElementById("pdfSideFrame");
  const heading=document.getElementById("pdfSideTitle");
  if(!panel||!closeBtn||!fullscreenBtn||!frame||!heading) return;

  const landscapeTablet=window.matchMedia("(min-width: 768px) and (orientation: landscape)");
  let currentPdfUrl="";

  function isAppleMobile(){
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function openPdf({key="1-1",title="教本PDF"}={}){
    if(!/^[12]-(?:[1-9]|1[0-9]|2[0-2])$/.test(key)) return;

    const pdfUrl=`./pdf/${key}.pdf`;
    currentPdfUrl=pdfUrl;

    // タブレット・PCの横持ちでは、説明とPDFを左右に表示
    if(landscapeTablet.matches){
      heading.textContent=title;
      frame.title=`${title} 教本PDF`;
      frame.src=`${pdfUrl}#view=FitH`;
      panel.setAttribute("aria-hidden","false");
      document.body.classList.add("pdf-split-open");

      // 左側の説明を先頭から表示
      const lessonPane=document.querySelector(".lesson-pane");
      if(lessonPane) lessonPane.scrollTop=0;
      return;
    }

    // 縦持ち・スマホは、現在の安定した表示方法を維持
    if(isAppleMobile()){
      window.location.href=pdfUrl;
      return;
    }

    window.open(pdfUrl,"_blank","noopener");
  }

  function openFullscreenPdf(){
    if(!currentPdfUrl) return;

    // iPad・iPhoneでは同じ画面で開き、左端からのスワイプで戻れる
    if(isAppleMobile()){
      window.location.href=currentPdfUrl;
      return;
    }

    window.open(currentPdfUrl,"_blank","noopener");
  }

  function closePdf(){
    document.body.classList.remove("pdf-split-open");
    panel.setAttribute("aria-hidden","true");
    frame.src="about:blank";
    currentPdfUrl="";
  }

  function handleLayoutChange(){
    if(!landscapeTablet.matches && document.body.classList.contains("pdf-split-open")){
      closePdf();
    }
  }

  window.openTextbookPdf=openPdf;
  window.closeTextbookPdf=closePdf;

  closeBtn.addEventListener("click",closePdf);
  fullscreenBtn.addEventListener("click",openFullscreenPdf);
  landscapeTablet.addEventListener?.("change",handleLayoutChange);
})();
