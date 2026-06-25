exports.handler = async function(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "POST only" })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const text = body.text || "";
    const targetLang = body.target_lang || "VI";
    const sourceLang = body.source_lang || "JA";

    const params = new URLSearchParams();
    params.append("text", text);
    params.append("target_lang", targetLang);
    params.append("source_lang", sourceLang);

    const response = await fetch("https://api-free.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        "Authorization": "DeepL-Auth-Key " + process.env.DEEPL_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: data.message || "DeepL error" })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: data.translations[0].text })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message })
    };
  }
};
