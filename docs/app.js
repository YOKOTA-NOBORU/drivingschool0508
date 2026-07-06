const languageLabelMap = {
  vi: 'ベトナム語',
  en: '英語',
  zh: '中国語',
  pt: 'ポルトガル語'
};

const speechLangMap = {
  vi: 'vi-VN',
  en: 'en-US',
  zh: 'zh-CN',
  pt: 'pt-BR'
};

const state = {
  currentItemId: 1,
  currentLanguage: 'vi',
  visibleSections: new Set(['tip', 'exam', 'failure', 'memory', 'phrase']),
  revealedPhrases: new Set()
};

function init() {
  populateTopicSelect();
  bindEvents();
  render();
}

function populateTopicSelect() {
  const select = document.getElementById('topicSelect');
  select.innerHTML = textbookData
    .map((item) => `<option value="${item.id}">${item.title}</option>`)
    .join('');
  select.value = String(state.currentItemId);
}

function bindEvents() {
  document.getElementById('topicSelect').addEventListener('change', (event) => {
    state.currentItemId = Number(event.target.value);
    render();
  });

  document.getElementById('languageSelect').addEventListener('change', (event) => {
    state.currentLanguage = event.target.value;
    render();
  });

  document.getElementById('sectionToggles').addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="toggle-section"]');
    if (!button) return;

    const sectionKey = button.dataset.section;
    if (state.visibleSections.has(sectionKey)) {
      state.visibleSections.delete(sectionKey);
    } else {
      state.visibleSections.add(sectionKey);
    }
    render();
  });

  document.getElementById('sections').addEventListener('click', (event) => {
    const revealButton = event.target.closest('[data-action="show-phrase"]');
    if (revealButton) {
      const sectionKey = revealButton.dataset.section;
      state.revealedPhrases.add(`${state.currentItemId}-${sectionKey}-${state.currentLanguage}`);
      render();
      return;
    }

    const playButton = event.target.closest('[data-action="play-audio"]');
    if (playButton) {
      const sectionKey = playButton.dataset.section;
      const item = getCurrentItem();
      const section = item.sections.find((entry) => entry.key === sectionKey);
      if (section) {
        speakText(section.translations[state.currentLanguage], state.currentLanguage);
      }
    }
  });
}

function render() {
  const item = getCurrentItem();
  const topicSelect = document.getElementById('topicSelect');
  const languageSelect = document.getElementById('languageSelect');
  const title = document.getElementById('itemTitle');
  const description = document.getElementById('itemDescription');
  const toggleRow = document.getElementById('sectionToggles');
  const sections = document.getElementById('sections');
  const status = document.getElementById('status');

  topicSelect.value = String(item.id);
  languageSelect.value = state.currentLanguage;
  title.textContent = item.title;
  description.textContent = item.description;

  toggleRow.innerHTML = item.sections
    .map((section) => {
      const activeClass = state.visibleSections.has(section.key) ? 'active' : '';
      return `<button class="toggle-chip ${activeClass}" data-action="toggle-section" data-section="${section.key}">${section.label}</button>`;
    })
    .join('');

  sections.innerHTML = item.sections
    .map((section) => {
      const visibleClass = state.visibleSections.has(section.key) ? '' : 'is-hidden';
      const revealKey = `${item.id}-${section.key}-${state.currentLanguage}`;
      const isRevealed = state.revealedPhrases.has(revealKey);
      const translatedText = section.translations[state.currentLanguage] || section.translations.vi;

      return `
        <article class="info-card ${visibleClass}">
          <h3>${section.label}</h3>
          <p class="section-copy">${section.japanese}</p>
          <div class="card-actions">
            ${isRevealed ? `<button class="small-btn" type="button">${languageLabelMap[state.currentLanguage]}で表示中</button>` : `<button class="tap-btn" type="button" data-action="show-phrase" data-section="${section.key}">タップして表示</button>`}
            <button class="play-btn" type="button" data-action="play-audio" data-section="${section.key}">外国語音声</button>
          </div>
          ${isRevealed ? `
            <div class="language-box">
              <div class="language-label">${languageLabelMap[state.currentLanguage]}</div>
              <p class="language-text">${translatedText}</p>
            </div>
          ` : ''}
        </article>
      `;
    })
    .join('');

  status.textContent = `${item.title} · ${languageLabelMap[state.currentLanguage]}表示中`;
}

function getCurrentItem() {
  return textbookData.find((item) => item.id === state.currentItemId) || textbookData[0];
}

function speakText(text, language) {
  if (!('speechSynthesis' in window)) {
    const status = document.getElementById('status');
    status.textContent = 'この端末では音声再生に対応していません。';
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLangMap[language] || 'en-US';
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  const status = document.getElementById('status');
  status.textContent = `${languageLabelMap[language]}の音声を再生しています。`;
}

window.addEventListener('DOMContentLoaded', init);
