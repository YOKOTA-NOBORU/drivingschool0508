const LANGS={vi:"ベトナム語",en:"英語",zh:"中国語",pt:"ポルトガル語"};
const KINDS=["教官ワンポイント","検定ポイント","よくある失敗","覚えておきたいこと","教習で使う一言"];
const PDF_KEYS=new Set(["1-1","1-10","1-11","1-12","1-13","1-14","1-15","1-16","1-17","1-18","1-19","1-2","1-20","1-21","1-22","1-3","1-4","1-5","1-6","1-7","1-8","1-9","2-1","2-10","2-11","2-12","2-13","2-14","2-15","2-16","2-2","2-3","2-4","2-5","2-6","2-7","2-8","2-9"]);

let currentStage=1;
let currentKey="";
let visibleKinds=new Set(["説明"]);
let currentSpeechBlock=null;

const itemSelect=document.getElementById("itemSelect");
const langSelect=document.getElementById("lang");
const headerCard=document.getElementById("headerCard");
const list=document.getElementById("list");
const prevBtn=document.getElementById("prevBtn");
const nextBtn=document.getElementById("nextBtn");

function voiceLang(code){
  return code==="vi"?"vi-VN":code==="en"?"en-US":code==="zh"?"zh-CN":"pt-BR";
}

function stopSpeech(){
  if("speechSynthesis" in window) speechSynthesis.cancel();
  if(currentSpeechBlock){
    currentSpeechBlock.classList.remove("playing");
    const hint=currentSpeechBlock.querySelector(".tap-speech-hint");
    if(hint) hint.textContent="🔊 タップで再生";
  }
  currentSpeechBlock=null;
}

function toggleSpeech(text,lang,block){
  if(!("speechSynthesis" in window)){
    alert("この端末では音声再生に対応していません。");
    return;
  }
  if(currentSpeechBlock===block && speechSynthesis.speaking){
    stopSpeech();
    return;
  }

  stopSpeech();
  const u=new SpeechSynthesisUtterance(text);
  u.lang=voiceLang(lang);
  u.rate=.9;

  currentSpeechBlock=block;
  block.classList.add("playing");
  const hint=block.querySelector(".tap-speech-hint");
  if(hint) hint.textContent="■ タップで停止";

  u.onend=()=>{if(currentSpeechBlock===block) stopSpeech();};
  u.onerror=()=>{if(currentSpeechBlock===block) stopSpeech();};
  speechSynthesis.speak(u);
}

function addSpeechStyles(){
  if(document.getElementById("tap-speech-style")) return;
  const s=document.createElement("style");
  s.id="tap-speech-style";
  s.textContent=`
    .foreign-block{cursor:pointer;transition:background .18s ease,border-color .18s ease,transform .08s ease;-webkit-tap-highlight-color:transparent}
    .foreign-block:active{transform:scale(.99)}
    .foreign-block.playing{background:#e4f5e9;border-left-color:#2f965c;box-shadow:0 0 0 2px rgba(47,150,92,.14)}
    .tap-speech-hint{margin-top:7px;color:#14532d;font-size:12px;font-weight:800}
  `;
  document.head.appendChild(s);
}

function normalizedItems(){
  const src=typeof MOBILE_ITEMS!=="undefined" ? MOBILE_ITEMS : [];
  const seen=new Set();
  return src
    .map((item,index)=>{
      const stage=Number(item.stage||1);
      const id=Number(item.id||index+1);
      return {...item,stage,id,key:`${stage}-${id}`};
    })
    .filter(item=>{
      if(seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    })
    .sort((a,b)=>(a.stage-b.stage)||(a.id-b.id));
}

function stageItems(){
  return normalizedItems().filter(item=>item.stage===currentStage);
}

function currentItem(){
  const items=stageItems();
  return items.find(item=>item.key===currentKey)||items[0]||null;
}

function displayNo(item){
  return stageItems().findIndex(x=>x.key===item.key)+1;
}

function fillSelect(){
  const items=stageItems();
  if(!items.some(x=>x.key===currentKey)){
    currentKey=items[0]?.key||"";
  }

  itemSelect.innerHTML="";
  items.forEach((item,index)=>{
    const option=document.createElement("option");
    option.value=item.key;
    option.textContent=`教習項目${String(index+1).padStart(2,"0")}　${item.title}`;
    itemSelect.appendChild(option);
  });
  itemSelect.value=currentKey;
}

function renderHeader(){
  const item=currentItem();
  if(!item){
    headerCard.innerHTML="";
    return;
  }

  headerCard.innerHTML=`
    <span class="badge">第${item.stage}段階 ${displayNo(item)}項目</span>
    <div class="title">${item.title}</div>
    <div class="count">${(item.blocks||[]).length} 説明</div>
    <div class="toggle-grid">
      ${KINDS.map(kind=>`<button class="${visibleKinds.has(kind)?"active":""}" data-kind="${kind}">${kind}</button>`).join("")}
      ${PDF_KEYS.has(item.key) ? '<button class="pdf-open-button" data-pdf-open="1">📖 教本PDF</button>' : ''}
    </div>
  `;

  const pdfButton=headerCard.querySelector("[data-pdf-open]");
  if(pdfButton){
    pdfButton.onclick=()=>{
      stopSpeech();
      if(typeof window.openTextbookPdf==="function") window.openTextbookPdf({key:item.key,title:`第${item.stage}段階${displayNo(item)}項目　${item.title}`});
    };
  }

  headerCard.querySelectorAll("[data-kind]").forEach(button=>{
    button.onclick=()=>{
      stopSpeech();
      const kind=button.dataset.kind;
      visibleKinds.has(kind)?visibleKinds.delete(kind):visibleKinds.add(kind);
      renderHeader();
      renderList();
    };
  });
}

function renderList(){
  stopSpeech();
  const lang=langSelect.value;
  const item=currentItem();
  list.innerHTML="";
  if(!item) return;

  (item.blocks||[]).forEach((block,index)=>{
    const article=document.createElement("article");
    article.className="section";

    const ja=(block.ja||[])
      .filter(x=>visibleKinds.has(x.label))
      .map(x=>`<div class="jp-block"><div class="jp-label">${x.label}</div><p class="jp-text">${x.text}</p></div>`)
      .join("");

    const foreign=(block[lang]||[])
      .filter((x,i)=>visibleKinds.has((block.ja||[])[i]?.label))
      .map(x=>`
        <div class="foreign-block" role="button" tabindex="0" data-speech-text="${encodeURIComponent(x.text||"")}">
          <div class="foreign-label">${x.label}</div>
          <p class="foreign-text">${x.text}</p>
          <div class="tap-speech-hint">🔊 タップで再生</div>
        </div>
      `)
      .join("");

    article.innerHTML=`
      <button class="accordion" type="button">
        <span>${index+1}. ${block.title}</span><span class="mark">▶</span>
      </button>
      ${ja}
      <div class="foreign">${foreign}</div>
    `;

    const accordion=article.querySelector(".accordion");
    const foreignArea=article.querySelector(".foreign");
    const mark=article.querySelector(".mark");

    accordion.onclick=()=>{
      stopSpeech();
      foreignArea.classList.toggle("show");
      mark.textContent=foreignArea.classList.contains("show")?"▼":"▶";
    };

    article.querySelectorAll(".foreign-block").forEach(blockEl=>{
      const play=()=>toggleSpeech(
        decodeURIComponent(blockEl.dataset.speechText||""),
        lang,
        blockEl
      );
      blockEl.addEventListener("click",play);
      blockEl.addEventListener("keydown",event=>{
        if(event.key==="Enter"||event.key===" "){
          event.preventDefault();
          play();
        }
      });
    });

    list.appendChild(article);
  });
}

function updateNavButtons(){
  const items=stageItems();
  const index=items.findIndex(x=>x.key===currentKey);
  prevBtn.disabled=index<=0;
  nextBtn.disabled=index<0||index>=items.length-1;
  prevBtn.style.opacity=prevBtn.disabled?".45":"1";
  nextBtn.style.opacity=nextBtn.disabled?".45":"1";
}

function render(){
  fillSelect();
  renderHeader();
  renderList();
  updateNavButtons();
  document.querySelectorAll(".stage").forEach(button=>{
    button.classList.toggle("active",Number(button.dataset.stage)===currentStage);
  });
}

addSpeechStyles();

document.querySelectorAll(".stage").forEach(button=>{
  button.onclick=()=>{
    stopSpeech();
    currentStage=Number(button.dataset.stage);
    currentKey=stageItems()[0]?.key||"";
    visibleKinds=new Set(["説明"]);
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  };
});

itemSelect.onchange=()=>{
  stopSpeech();
  currentKey=itemSelect.value;
  visibleKinds=new Set(["説明"]);
  render();
  window.scrollTo({top:0,behavior:"smooth"});
};

langSelect.onchange=()=>{
  stopSpeech();
  renderList();
};

prevBtn.onclick=()=>{
  stopSpeech();
  const items=stageItems();
  const index=items.findIndex(x=>x.key===currentKey);
  if(index>0){
    currentKey=items[index-1].key;
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  }
};

nextBtn.onclick=()=>{
  stopSpeech();
  const items=stageItems();
  const index=items.findIndex(x=>x.key===currentKey);
  if(index>=0 && index<items.length-1){
    currentKey=items[index+1].key;
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  }
};

window.addEventListener("pagehide",stopSpeech);

currentKey=stageItems()[0]?.key||"";
render();
