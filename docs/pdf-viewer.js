(()=>{
  const modal=document.getElementById("pdfModal");
  const closeBtn=document.getElementById("pdfCloseBtn");
  const frame=document.getElementById("pdfFrame");
  const heading=modal?.querySelector(".pdf-dialog-header strong");
  const dialog=modal?.querySelector(".pdf-dialog");
  if(!modal||!closeBtn||!frame||!heading||!dialog) return;

  function openPdf({key="1-1",title="教本PDF"}={}){
    if(!/^[12]-(?:[1-9]|1[0-9]|2[0-2])$/.test(key)) return;
    const pdfUrl=`./pdf/${key}.pdf#view=FitH`;
    heading.textContent=title;
    dialog.setAttribute("aria-label",`${title} 教本PDF`);
    frame.title=`${title} 教本PDF`;
    if(!frame.src.endsWith(pdfUrl)) frame.src=pdfUrl;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden","false");
    document.body.classList.add("pdf-modal-open");
  }

  function closePdf(){
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden","true");
    document.body.classList.remove("pdf-modal-open");
  }

  window.openTextbookPdf=openPdf;
  window.closeTextbookPdf=closePdf;

  closeBtn.addEventListener("click",closePdf);
  modal.addEventListener("click",event=>{
    if(event.target===modal) closePdf();
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape") closePdf();
  });
})();
