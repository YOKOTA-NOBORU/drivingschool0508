const jpText = document.getElementById("jpText");
const targetLang = document.getElementById("targetLang");
const translateBtn = document.getElementById("translateBtn");
const clearBtn = document.getElementById("clearBtn");
const speakBtn = document.getElementById("speakBtn");
const translatedText = document.getElementById("translatedText");
const statusBox = document.getElementById("status");

async function translateText() {
  const text = jpText.value.trim();

  if (!text) {
    alert("日本語を入力してください。");
    return;
  }

  translateBtn.disabled = true;
  statusBox.textContent = "DeepLで翻訳中...";

  try {
    const res = await fetch("/.netlify/functions/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        target_lang: targetLang.value,
        source_lang: "JA"
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "翻訳に失敗しました。");
    }

    translatedText.textContent = data.text || "翻訳結果がありません。";
    statusBox.textContent = "翻訳完了";
  } catch (error) {
    translatedText.textContent = "翻訳できませんでした。";
    statusBox.textContent = "エラー: " + error.message;
    alert("翻訳に失敗しました。Netlify Functions と DeepL APIキーを確認してください。");
  } finally {
    translateBtn.disabled = false;
  }
}

function speakResult() {
  const text = translatedText.textContent.trim();
  if (!text || text === "ここに翻訳結果が表示されます。" || text === "翻訳できませんでした。") {
    alert("先に翻訳してください。");
    return;
  }

  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);

  const langMap = {
    "VI": "vi-VN",
    "EN-US": "en-US",
    "ZH": "zh-CN",
    "KO": "ko-KR",
    "PT-BR": "pt-BR",
    "ID": "id-ID"
  };

  utterance.lang = langMap[targetLang.value] || "vi-VN";
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}

translateBtn.addEventListener("click", translateText);
speakBtn.addEventListener("click", speakResult);

clearBtn.addEventListener("click", () => {
  jpText.value = "";
  translatedText.textContent = "ここに翻訳結果が表示されます。";
  statusBox.textContent = "準備完了";
});

document.querySelectorAll(".phrase").forEach((button) => {
  button.addEventListener("click", () => {
    jpText.value = button.textContent;
    translateText();
  });
});
